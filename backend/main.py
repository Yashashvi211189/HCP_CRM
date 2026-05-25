import base64
import hashlib
import hmac
import json
import os
import random
import smtplib
from datetime import date, datetime, timedelta
from email.message import EmailMessage
from types import SimpleNamespace
from typing import Optional
from urllib import request

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from agent.graph import run_agent
from database import ChatMessage, HCP, Interaction, OTPCode, User, UserActivity, get_db, init_db

app = FastAPI(title="HCP CRM")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _b64_encode(data):
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def _b64_decode(data):
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_token(payload):
    body = {**payload, "exp": int((datetime.utcnow() + timedelta(hours=8)).timestamp())}
    encoded = _b64_encode(json.dumps(body, separators=(",", ":")).encode())
    secret = os.getenv("JWT_SECRET", "change_this_secret").encode()
    signature = hmac.new(secret, encoded.encode(), hashlib.sha256).digest()
    return f"{encoded}.{_b64_encode(signature)}"


def decode_token(token):
    try:
        encoded, signature = token.split(".", 1)
        secret = os.getenv("JWT_SECRET", "change_this_secret").encode()
        expected = _b64_encode(hmac.new(secret, encoded.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(signature, expected):
            raise ValueError("Bad signature")
        payload = json.loads(_b64_decode(encoded))
        if payload.get("exp", 0) < int(datetime.utcnow().timestamp()):
            raise ValueError("Expired")
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid session")


def auth_payload(authorization: Optional[str] = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing session")
    return decode_token(authorization.replace("Bearer ", "", 1))


def current_user(payload=Depends(auth_payload), db: Session = Depends(get_db)):
    if payload.get("role") != "user":
        raise HTTPException(status_code=403, detail="User access required")
    if payload.get("temporary"):
        return SimpleNamespace(id=0, name="Temporary User", email="", temporary=True)
    user = db.query(User).filter(User.id == payload.get("user_id")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def current_admin(payload=Depends(auth_payload)):
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload


def log_activity(db, user_id, action, route):
    if not user_id:
        return
    db.add(UserActivity(user_id=user_id, action=action, route=route))
    db.commit()


def send_otp_email(email, code):
    message = EmailMessage()
    message["Subject"] = "Your HCP CRM OTP"
    message["From"] = os.getenv("SMTP_FROM", "no-reply@hcp-crm.local")
    message["To"] = email
    message.set_content(f"Your HCP CRM login OTP is {code}. It expires in 5 minutes.")

    host = os.getenv("SMTP_HOST", "")
    username = os.getenv("SMTP_USERNAME", "")
    password = os.getenv("SMTP_PASSWORD", "")
    if not host:
        print(f"OTP for {email}: {code}")
        return

    port = int(os.getenv("SMTP_PORT", "587"))
    with smtplib.SMTP(host, port, timeout=10) as server:
        server.starttls()
        if username:
            server.login(username, password)
        server.send_message(message)


def send_provider_notification(interaction_data, hcp=None):
    recipient = (hcp.email if hcp and hcp.email else os.getenv("DEFAULT_PROVIDER_NOTIFICATION_EMAIL", "")).strip()
    notification = {
        "recipient": recipient,
        "hcp_name": interaction_data.get("hcp_name") or "Healthcare Provider",
        "interaction_type": interaction_data.get("interaction_type") or "Interaction",
        "interaction_date": interaction_data.get("interaction_date") or "",
        "interaction_time": interaction_data.get("interaction_time") or "",
        "topics_discussed": interaction_data.get("topics_discussed") or "",
        "followup_actions": interaction_data.get("followup_actions") or "",
        "interaction_id": interaction_data.get("id") or "",
    }
    trigger_n8n("provider_notification_requested", notification)

    host = os.getenv("SMTP_HOST", "")
    if not host or not recipient:
        if os.getenv("N8N_WEBHOOK_URL"):
            message = "Notification workflow triggered."
        elif not recipient:
            message = "Saved. Add an HCP email or DEFAULT_PROVIDER_NOTIFICATION_EMAIL to send provider notifications."
        else:
            message = "Saved. Configure SMTP settings to send provider notification emails."
        return {
            "sent": False,
            "channel": "n8n" if os.getenv("N8N_WEBHOOK_URL") else "none",
            "recipient": recipient,
            "message": message,
        }

    message = EmailMessage()
    message["Subject"] = f"HCP CRM interaction saved: {notification['hcp_name']}"
    message["From"] = os.getenv("SMTP_FROM", "no-reply@hcp-crm.local")
    message["To"] = recipient
    message.set_content(
        "\n".join(
            [
                f"Hello {notification['hcp_name']},",
                "",
                "A new HCP CRM interaction record has been saved.",
                "",
                f"Interaction type: {notification['interaction_type']}",
                f"Date: {notification['interaction_date']}",
                f"Time: {notification['interaction_time']}",
                f"Topics discussed: {notification['topics_discussed'] or 'Not provided'}",
                f"Follow-up actions: {notification['followup_actions'] or 'Not provided'}",
                "",
                "This is an automated notification from HCP CRM.",
            ]
        )
    )

    try:
        port = int(os.getenv("SMTP_PORT", "587"))
        username = os.getenv("SMTP_USERNAME", "")
        password = os.getenv("SMTP_PASSWORD", "")
        with smtplib.SMTP(host, port, timeout=10) as server:
            server.starttls()
            if username:
                server.login(username, password)
            server.send_message(message)
        return {"sent": True, "channel": "email", "recipient": recipient, "message": "Notification sent to provider."}
    except Exception as exc:
        return {"sent": False, "channel": "email", "recipient": recipient, "message": f"Notification email failed: {exc}"}


def trigger_n8n(event, payload):
    webhook_url = os.getenv("N8N_WEBHOOK_URL")
    if not webhook_url:
        return
    data = json.dumps({"event": event, "payload": payload}).encode("utf-8")
    req = request.Request(webhook_url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        request.urlopen(req, timeout=5).read()
    except Exception:
        pass


class SendOTPRequest(BaseModel):
    name: str
    email: str


class VerifyOTPRequest(BaseModel):
    email: str
    otp: str


class AdminLoginRequest(BaseModel):
    password: str


class ActivityRequest(BaseModel):
    action: str
    route: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[list[dict]] = None


class InteractionCreate(BaseModel):
    hcp_id: Optional[int] = None
    hcp_name: Optional[str] = ""
    interaction_type: Optional[str] = "Meeting"
    interaction_date: Optional[str] = None
    interaction_time: Optional[str] = None
    attendees: Optional[str] = ""
    topics_discussed: Optional[str] = ""
    materials_shared: Optional[str] = ""
    samples_distributed: Optional[str] = ""
    sentiment: Optional[str] = "Neutral"
    outcomes: Optional[str] = ""
    followup_actions: Optional[str] = ""
    ai_suggested_followups: Optional[str] = ""
    raw_chat_input: Optional[str] = ""


class InteractionPatch(BaseModel):
    field: str
    new_value: str


@app.on_event("startup")
def startup():
    try:
        init_db()
    except OperationalError as exc:
        print(f"Database unavailable during startup; temporary OTP login remains available. {exc}")


@app.get("/")
def health_check():
    return {"status": "ok", "service": "hcp-crm-api"}


def _date_value(value):
    return datetime.strptime(value, "%Y-%m-%d").date() if value else date.today()


def _time_value(value):
    return datetime.strptime(value[:5], "%H:%M").time() if value else datetime.now().time().replace(second=0, microsecond=0)


def serialize_interaction(interaction):
    return {
        "id": str(interaction.id),
        "user_id": str(interaction.user_id or ""),
        "hcp_id": str(interaction.hcp_id or ""),
        "hcp_name": str(interaction.hcp_name or ""),
        "interaction_type": str(interaction.interaction_type or ""),
        "interaction_date": str(interaction.interaction_date or ""),
        "interaction_time": interaction.interaction_time.strftime("%H:%M") if interaction.interaction_time else "",
        "attendees": str(interaction.attendees or ""),
        "topics_discussed": str(interaction.topics_discussed or ""),
        "materials_shared": str(interaction.materials_shared or ""),
        "samples_distributed": str(interaction.samples_distributed or ""),
        "sentiment": str(interaction.sentiment or ""),
        "outcomes": str(interaction.outcomes or ""),
        "followup_actions": str(interaction.followup_actions or ""),
        "ai_suggested_followups": str(interaction.ai_suggested_followups or ""),
        "raw_chat_input": str(interaction.raw_chat_input or ""),
        "created_at": str(interaction.created_at or ""),
        "updated_at": str(interaction.updated_at or ""),
    }


def serialize_interaction_payload(payload, interaction_id="temp"):
    return {
        "id": str(interaction_id),
        "user_id": "0",
        "hcp_id": str(payload.hcp_id or ""),
        "hcp_name": str(payload.hcp_name or ""),
        "interaction_type": str(payload.interaction_type or "Meeting"),
        "interaction_date": str(payload.interaction_date or date.today().isoformat()),
        "interaction_time": str((payload.interaction_time or datetime.now().strftime("%H:%M"))[:5]),
        "attendees": str(payload.attendees or ""),
        "topics_discussed": str(payload.topics_discussed or ""),
        "materials_shared": str(payload.materials_shared or ""),
        "samples_distributed": str(payload.samples_distributed or ""),
        "sentiment": str(payload.sentiment or "Neutral"),
        "outcomes": str(payload.outcomes or ""),
        "followup_actions": str(payload.followup_actions or ""),
        "ai_suggested_followups": str(payload.ai_suggested_followups or ""),
        "raw_chat_input": str(payload.raw_chat_input or ""),
        "created_at": str(datetime.utcnow()),
        "updated_at": str(datetime.utcnow()),
    }


def serialize_user(user, db):
    latest_activity = (
        db.query(UserActivity)
        .filter(UserActivity.user_id == user.id)
        .order_by(UserActivity.timestamp.desc())
        .first()
    )
    active_cutoff = datetime.utcnow() - timedelta(minutes=10)
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "created_at": str(user.created_at or ""),
        "last_login": str(user.last_login or ""),
        "last_activity": str(latest_activity.timestamp) if latest_activity else "",
        "active": bool(latest_activity and latest_activity.timestamp >= active_cutoff),
    }


@app.post("/auth/send-otp")
def send_otp(payload: SendOTPRequest, db: Session = Depends(get_db)):
    if not payload.name.strip() or not payload.email.strip():
        raise HTTPException(status_code=400, detail="Name and email are required")
    code = "12345"
    try:
        db.query(OTPCode).filter(OTPCode.email == payload.email).delete()
        db.add(
            OTPCode(
                name=payload.name.strip(),
                email=payload.email.strip().lower(),
                code=code,
                expires_at=datetime.utcnow() + timedelta(minutes=5),
            )
        )
        db.commit()
    except OperationalError:
        db.rollback()
    send_otp_email(payload.email, code)
    return {"message": "OTP sent", "otp": code}


@app.post("/auth/verify-otp")
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    submitted_otp = payload.otp.strip()
    using_temporary_otp = submitted_otp == "12345"
    otp = None
    try:
        otp = (
            db.query(OTPCode)
            .filter(OTPCode.email == email, OTPCode.code == submitted_otp)
            .order_by(OTPCode.created_at.desc())
            .first()
        )
    except OperationalError:
        db.rollback()
        if using_temporary_otp:
            fallback_name = email.split("@", 1)[0] if email else "User"
            return {
                "token": create_token({"role": "user", "user_id": 0, "temporary": True}),
                "user": {
                    "id": "0",
                    "name": fallback_name,
                    "email": email,
                    "created_at": "",
                    "last_login": "",
                    "last_activity": "",
                    "active": True,
                },
            }
        raise
    if not using_temporary_otp and (not otp or otp.expires_at < datetime.utcnow()):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        fallback_name = email.split("@", 1)[0] if email else "User"
        user = User(name=otp.name if otp else fallback_name, email=email, created_at=datetime.utcnow())
        db.add(user)
        db.flush()
    else:
        if otp:
            user.name = otp.name
    user.last_login = datetime.utcnow()
    db.query(OTPCode).filter(OTPCode.email == email).delete()
    db.add(UserActivity(user_id=user.id, action="login", route="/login"))
    db.commit()
    return {"token": create_token({"role": "user", "user_id": user.id}), "user": serialize_user(user, db)}


@app.post("/auth/admin-login")
def admin_login(payload: AdminLoginRequest):
    if payload.password != os.getenv("ADMIN_PASSWORD", "admin123"):
        raise HTTPException(status_code=401, detail="Invalid admin password")
    return {"token": create_token({"role": "admin"}), "role": "admin"}


@app.post("/api/activity")
def track_activity(payload: ActivityRequest, user: User = Depends(current_user), db: Session = Depends(get_db)):
    log_activity(db, user.id, payload.action, payload.route)
    return {"ok": True}


@app.post("/api/chat")
def chat(request: ChatRequest, user: User = Depends(current_user), db: Session = Depends(get_db)):
    is_temporary = bool(getattr(user, "temporary", False))
    result = run_agent(request.message, request.history or [], None if is_temporary else db, user.id)
    log_activity(db, user.id, "crm_chat", "/api/chat")
    return result


@app.get("/api/hcps")
def search_hcps(q: str = "", user: User = Depends(current_user), db: Session = Depends(get_db)):
    query = db.query(HCP)
    if q:
        query = query.filter(HCP.name.ilike(f"%{q}%"))
        log_activity(db, user.id, "search", "/api/hcps")
    return [
        {
            "id": str(hcp.id),
            "name": str(hcp.name or ""),
            "specialty": str(hcp.specialty or ""),
            "institution": str(hcp.institution or ""),
            "email": str(hcp.email or ""),
            "phone": str(hcp.phone or ""),
            "created_at": str(hcp.created_at or ""),
        }
        for hcp in query.limit(20).all()
    ]


@app.post("/api/interactions")
def create_interaction(payload: InteractionCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if bool(getattr(user, "temporary", False)):
        serialized = serialize_interaction_payload(payload, f"temp-{int(datetime.utcnow().timestamp())}")
        serialized["notification"] = send_provider_notification(serialized)
        return serialized

    hcp = None
    try:
        if payload.hcp_name:
            hcp = db.query(HCP).filter(HCP.name == payload.hcp_name).first()
            if not hcp:
                hcp = HCP(name=payload.hcp_name)
                db.add(hcp)
                db.flush()

        interaction = Interaction(
            user_id=user.id,
            hcp_id=hcp.id if hcp else payload.hcp_id,
            hcp_name=payload.hcp_name or "",
            interaction_type=payload.interaction_type or "Meeting",
            interaction_date=_date_value(payload.interaction_date),
            interaction_time=_time_value(payload.interaction_time),
            attendees=payload.attendees or "",
            topics_discussed=payload.topics_discussed or "",
            materials_shared=payload.materials_shared or "",
            samples_distributed=payload.samples_distributed or "",
            sentiment=payload.sentiment or "Neutral",
            outcomes=payload.outcomes or "",
            followup_actions=payload.followup_actions or "",
            ai_suggested_followups=payload.ai_suggested_followups or "",
            raw_chat_input=payload.raw_chat_input or "",
        )
        db.add(interaction)
        db.flush()
        db.add(UserActivity(user_id=user.id, action="submission", route="/api/interactions"))
        db.add(UserActivity(user_id=user.id, action="crm_save_interaction", route="/api/interactions"))
        db.commit()
        db.refresh(interaction)
        serialized = serialize_interaction(interaction)
        trigger_n8n("interaction_created", serialized)
        serialized["notification"] = send_provider_notification(serialized, hcp)
        return serialized
    except OperationalError:
        db.rollback()
        serialized = serialize_interaction_payload(payload, f"temp-{int(datetime.utcnow().timestamp())}")
        serialized["notification"] = send_provider_notification(serialized)
        return serialized


@app.get("/api/interactions")
def list_interactions(user: User = Depends(current_user), db: Session = Depends(get_db)):
    log_activity(db, user.id, "crm_list_interactions", "/api/interactions")
    interactions = db.query(Interaction).order_by(Interaction.created_at.desc()).all()
    return [serialize_interaction(interaction) for interaction in interactions]


@app.patch("/api/interactions/{interaction_id}")
def patch_interaction(interaction_id: int, payload: InteractionPatch, user: User = Depends(current_user), db: Session = Depends(get_db)):
    allowed = {
        "hcp_name",
        "interaction_type",
        "interaction_date",
        "interaction_time",
        "attendees",
        "topics_discussed",
        "materials_shared",
        "samples_distributed",
        "sentiment",
        "outcomes",
        "followup_actions",
    }
    if payload.field not in allowed:
        raise HTTPException(status_code=400, detail="Unsupported field")

    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")

    value = payload.new_value
    if payload.field == "interaction_date":
        value = _date_value(value)
    if payload.field == "interaction_time":
        value = _time_value(value)
    setattr(interaction, payload.field, value)
    db.add(UserActivity(user_id=user.id, action=f"crm_edit_{payload.field}", route=f"/api/interactions/{interaction_id}"))
    db.commit()
    db.refresh(interaction)
    return serialize_interaction(interaction)


@app.delete("/api/interactions/{interaction_id}")
def delete_interaction(interaction_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    db.query(ChatMessage).filter(ChatMessage.interaction_id == interaction_id).delete()
    db.delete(interaction)
    db.add(UserActivity(user_id=user.id, action="crm_delete_interaction", route=f"/api/interactions/{interaction_id}"))
    db.commit()
    return {"id": interaction_id}


@app.get("/admin/users")
def admin_users(q: str = "", admin=Depends(current_admin), db: Session = Depends(get_db)):
    query = db.query(User)
    if q:
        query = query.filter(or_(User.name.ilike(f"%{q}%"), User.email.ilike(f"%{q}%")))
    users = query.order_by(User.last_login.desc()).all()
    return {"users": [serialize_user(user, db) for user in users]}


@app.get("/admin/users/{user_id}/activity")
def admin_user_activity(user_id: int, admin=Depends(current_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    rows = db.query(UserActivity).filter(UserActivity.user_id == user_id).order_by(UserActivity.timestamp.desc()).limit(100).all()
    interactions = (
        db.query(Interaction)
        .filter(Interaction.user_id == user_id)
        .order_by(Interaction.created_at.desc())
        .limit(100)
        .all()
    )
    return {
        "user": serialize_user(user, db),
        "activity": [
            {"id": str(row.id), "action": row.action, "route": row.route, "timestamp": str(row.timestamp or "")}
            for row in rows
        ],
        "interactions": [serialize_interaction(interaction) for interaction in interactions],
    }
