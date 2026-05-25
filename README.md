# HCP CRM - AI-Powered Healthcare Engagement Platform

## What Is An HCP CRM?

An HCP CRM system is a specialized platform that helps health and life sciences organizations, including pharmaceutical, biotechnology, medical device, and healthcare teams, manage communication and engagement with healthcare providers. It centralizes provider data, tracks interactions across channels, supports compliance-ready documentation, and enables personalized, data-driven outreach.

This project is a full-stack HCP CRM and healthcare discovery platform with an AI-first interaction workflow. It helps teams discover healthcare providers, log HCP engagements, structure meeting notes, generate follow-ups, and save clean CRM records.

Live App: [https://hcp-crm-rgft.onrender.com/](https://hcp-crm-rgft.onrender.com/)  
Backend Swagger: [https://hcp-crm-back.onrender.com/docs](https://hcp-crm-back.onrender.com/docs)  
Repository: [https://github.com/Yashashvi211189/HCP_CRM](https://github.com/Yashashvi211189/HCP_CRM)

## Product Overview

HCP CRM combines three workflows in one application:

- **Healthcare discovery:** 
<img width="959" height="425" alt="image" src="https://github.com/user-attachments/assets/7fc1c757-966b-4524-8363-b880c10f3c6f" />
find nearby doctors, clinics, hospitals, dentists, pharmacies, and healthcare locations using OpenStreetMap and Overpass.

- **Interaction logging:** 
<img width="940" height="429" alt="image" src="https://github.com/user-attachments/assets/14ba80aa-312d-471d-8b2c-2c767c053bb5" />
capture HCP meetings, calls, topics, materials, samples, sentiment, outcomes, and follow-up actions.

- **AI Workspace:**
- <img width="538" height="389" alt="image" src="https://github.com/user-attachments/assets/be2cfd4a-61a9-4991-8373-951b649072d3" />
convert natural language notes into structured CRM data with summaries, recommendations, confidence indicators, and doctor context.

Example interaction note:

```text
Today I met with Dr. Smith, discussed Product X efficacy, positive sentiment, shared brochures.
```

The AI extracts the CRM fields, updates the interaction form, recommends follow-up actions, and allows the user to save the final record.

## Key Features

- Professional HCP CRM dashboard with top navigation
- Home overview page for healthcare discovery and CRM access
- Find Doctors, Clinics, and Hospitals pages
- Live nearby healthcare search using OpenStreetMap Overpass API
- Leaflet and React-Leaflet interactive maps
- Browser geolocation support for "near me" discovery
- CRM-backed HCP search by name, specialty, institution, email, and phone
- Interaction Logger for structured HCP engagement records
- AI Workspace for note extraction, summaries, sentiment, and follow-up recommendations
- Doctor context panel with selected HCP details
- HCP selection workflow after authentication
- Voice-note summarization support through browser speech recognition
- Save interaction workflow with provider notification support
- Admin dashboard for user activity and submitted interactions
- OTP-based user login and admin login
- FastAPI Swagger documentation
- MySQL persistence with SQLAlchemy ORM
- Render-ready frontend and backend deployment

## Current Navigation

The authenticated application includes:

- Home
- Find Doctors
- Clinics
- Hospitals
- Interaction Logger
- AI Workspace
- Health Records
- HCP selector
- Logout

## AI Workspace

The AI assistant is designed as the primary productivity workspace for HCP engagement teams. It can:

- Understand natural language HCP visit notes
- Extract HCP name, interaction type, date, time, attendees, topics, products, materials, samples, sentiment, outcomes, and follow-ups
- Suggest next-best follow-up actions
- Show extracted summaries and confidence indicators
- Provide doctor context from CRM data
- Help the user refine unclear interaction details before saving

The prompt is intentionally CRM-focused: it allows normal conversation, but only logs an interaction when the user clearly describes a real HCP meeting, call, visit, or engagement.

## Healthcare Discovery And Maps

The project uses free and open map infrastructure:

- **Map display:** OpenStreetMap tiles
- **Map UI:** Leaflet and React-Leaflet
- **Nearby search:** Overpass API
- **Endpoint:** `https://overpass-api.de/api/interpreter`
- **No Google Maps API key required**
- **No billing account required**

The backend provides a dedicated API endpoint:

```text
GET /api/nearby-healthcare?lat=28.6139&lon=77.2090&category=hospitals&radius=10000
```

Supported categories:

- `all`
- `doctors`
- `clinics`
- `hospitals`

The endpoint searches OpenStreetMap tags such as:

```text
amenity=hospital
amenity=clinic
amenity=doctors
amenity=dentist
amenity=pharmacy
healthcare=hospital
healthcare=clinic
healthcare=doctor
```

Returned places are rendered as Leaflet markers with popup cards showing name, type, address, specialty, contact, and source metadata.

## Notification Support

When an interaction is saved, the backend prepares a provider notification payload for the related doctor or healthcare organization. Notification delivery supports configured channels such as SMTP email and external workflow automation through `N8N_WEBHOOK_URL`.

If notification services are not configured, the CRM record still saves successfully and returns notification status metadata.

## Tech Stack

### Frontend

- React 18
- Redux Toolkit
- React Redux
- Axios
- Leaflet
- React-Leaflet
- OpenStreetMap tiles
- CSS-only responsive styling

### Backend

- Python
- FastAPI
- SQLAlchemy ORM
- PyMySQL
- LangGraph
- LangChain Core
- LangChain Groq
- Groq LLM API
- OpenStreetMap Overpass API integration

### Database

- MySQL
- Database name: `hcp_crm`

## Project Structure

```text
hcp-crm/
|-- backend/
|   |-- main.py
|   |-- database.py
|   |-- requirements.txt
|   |-- .env.example
|   |-- agent/
|       |-- __init__.py
|       |-- graph.py
|       |-- tools.py
|-- frontend/
|   |-- public/
|   |-- package.json
|   |-- src/
|       |-- index.js
|       |-- App.jsx
|       |-- App.css
|       |-- components/
|       |-- hooks/
|       |-- store/
|-- sql/
|   |-- schema.sql
|   |-- migration_auth.sql
|-- render.yaml
|-- README.md
```

## LangGraph Agent Tools

The AI agent uses dedicated tools for CRM workflow support:

1. `log_interaction` - extracts structured HCP interaction fields.
2. `edit_interaction` - updates supported interaction fields.
3. `get_hcp_profile` - retrieves HCP context.
4. `suggest_followups` - generates follow-up recommendations.
5. `analyze_sentiment` - classifies interaction sentiment.

## Database Tables

The MySQL schema includes:

- `hcps`
- `interactions`
- `chat_messages`
- `users`
- `user_activity`
- `otp_codes`

Saved interaction records are stored in:

```text
hcp_crm.interactions
```

## Environment Variables

Create `backend/.env` from the example:

```powershell
cd backend
copy .env.example .env
```

Backend variables:

```env
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=mysql+pymysql://root:your_mysql_password@localhost:3306/hcp_crm
N8N_WEBHOOK_URL=http://localhost:5678/webhook/hcp-interaction
JWT_SECRET=change_this_secret
ADMIN_PASSWORD=admin123
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM=no-reply@hcp-crm.local
```

Frontend variable:

```env
REACT_APP_API_URL=http://127.0.0.1:8000
```

No Google Maps key is required.

## Local Setup

### 1. Clone The Repository

```powershell
git clone https://github.com/Yashashvi211189/HCP_CRM.git
cd HCP_CRM
```

### 2. Configure MySQL

Create the database:

```sql
CREATE DATABASE IF NOT EXISTS hcp_crm;
```

Load the schema:

```powershell
mysql -uroot -p hcp_crm < sql/schema.sql
```

### 3. Run Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Backend docs:

```text
http://127.0.0.1:8000/docs
```

### 4. Run Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm start
```

Frontend app:

```text
http://localhost:3000
```

## Render Deployment

The project is designed for separate frontend and backend deployment on Render.

### Backend Web Service

```text
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Required backend environment variables:

```env
DATABASE_URL=mysql+pymysql://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_DB_HOST:3306/hcp_crm
GROQ_API_KEY=your_real_groq_key
JWT_SECRET=your_secure_secret
ADMIN_PASSWORD=your_admin_password
PYTHON_VERSION=3.11.9
```

Optional notification variables:

```env
N8N_WEBHOOK_URL=
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM=
```

### Frontend Static Site

```text
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: build
```

Frontend environment variable:

```env
REACT_APP_API_URL=https://your-backend-service.onrender.com
```

## API Endpoints

Swagger documentation:

```text
Local:      http://127.0.0.1:8000/docs
Production: https://your-backend-service.onrender.com/docs
```

Most CRM routes require a bearer token. Log in through `/auth/verify-otp`, copy the returned token, click `Authorize` in Swagger UI, and enter:

```text
Bearer YOUR_TOKEN_HERE
```

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/auth/send-otp` | Sends or returns an OTP |
| POST | `/auth/verify-otp` | Verifies OTP and returns a user token |
| POST | `/auth/admin-login` | Logs in an admin user |

### CRM And AI

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/chat` | Sends a message to the LangGraph AI agent |
| GET | `/api/hcps?q=` | Searches HCP records |
| POST | `/api/interactions` | Saves an HCP interaction |
| GET | `/api/interactions` | Lists saved interactions |
| PATCH | `/api/interactions/{id}` | Updates one interaction field |
| DELETE | `/api/interactions/{id}` | Deletes an interaction |

### Healthcare Discovery

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/nearby-healthcare` | Searches live nearby healthcare locations from OpenStreetMap |

Example:

```text
/api/nearby-healthcare?lat=28.6139&lon=77.2090&category=hospitals&radius=10000
```

### Admin

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/admin/users` | Lists users |
| GET | `/admin/users/{id}/activity` | Shows user activity and interaction records |

## Example User Workflow

1. Log in with OTP.
2. Select an HCP workspace.
3. Open the AI Workspace.
4. Describe an HCP meeting in natural language.
5. AI extracts the structured CRM fields.
6. Review the Interaction Logger form.
7. Accept or adjust follow-up recommendations.
8. Save the interaction.
9. Provider notification metadata is generated.
10. Admin can review activity and submitted records.

## Example AI Output

```json
{
  "reply": "Interaction logged and follow-ups suggested.",
  "extracted_data": {
    "hcp_name": "Dr. Smith",
    "interaction_type": "Meeting",
    "topics_discussed": "Product X efficacy",
    "materials_shared": "Brochures",
    "sentiment": "Positive"
  },
  "suggestions": [
    "Schedule follow-up with Dr. Smith",
    "Send clinical data on Product X efficacy",
    "Add Dr. Smith to advisory board consideration"
  ]
}
```

## Login Defaults

Local user OTP:

```text
12345
```

Default admin password:

```text
admin123
```

Change these values before any serious production use.

## Security Notes

- Do not commit `.env` files.
- Do not commit Groq API keys, SMTP credentials, JWT secrets, or database passwords.
- The OTP flow is simplified for development and demonstration.
- Production deployment should use stronger authentication, stricter CORS, secure cookies or managed auth, role-based access control, audit logging, and compliance review.
- OpenStreetMap and Overpass are free public services with usage limits; heavy production traffic should use caching or a dedicated hosted/self-hosted OSM data service.

## Current Limitations

- OpenStreetMap place coverage depends on community data quality.
- Overpass public servers may rate-limit heavy usage.
- Appointment slot availability is not sourced from public map data.
- Voice note support depends on browser speech recognition availability.
- Compliance, consent, audit, and role workflows should be expanded before real clinical or regulated use.

## Roadmap

- HCP relationship scoring
- Previous interaction timeline
- Provider profile enrichment
- Better health records upload and timeline
- Appointment availability and calendar integration
- Caching layer for OpenStreetMap search results
- More advanced admin analytics
- Production-grade authentication and authorization
- Compliance review workflows

