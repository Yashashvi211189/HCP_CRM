# AI-Powered HCP CRM Interaction Logger

A full-stack, AI-first CRM module for capturing Healthcare Professional (HCP) interactions through natural language, structured review, and intelligent follow-up recommendations.

This project helps pharmaceutical sales representatives, medical representatives, account managers, and field teams convert unstructured meeting notes into clean CRM records with minimal manual entry.

## Overview

Traditional CRM tools often force field teams to fill long forms after every meeting. This application changes that workflow by allowing a representative to write a natural interaction note such as:

```text
Today I met with Dr. Smith, discussed Product X efficacy, positive sentiment, shared brochures.
```

The AI agent extracts the important CRM fields, populates the interaction form, suggests contextual follow-ups, and allows the user to save the interaction record.

## Key Features

- AI-assisted interaction logging from natural language
- LangGraph-based backend agent with dedicated tools
- Groq LLM integration using `gemma2-9b-it`
- Structured HCP interaction form with auto-population from AI
- AI chat panel for logging interaction details conversationally
- Smart follow-up suggestions based on topics and sentiment
- Voice-note summarization flow using browser speech recognition
- Temporary OTP login for local demo access
- Admin dashboard for user activity and submitted interaction visibility
- MySQL persistence using SQLAlchemy ORM
- FastAPI backend with documented API routes
- React 18 frontend with Redux Toolkit state management

## Tech Stack

### Frontend

- React 18
- Redux Toolkit
- React Redux
- Axios
- CSS-only styling
- Google Inter font

### Backend

- Python
- FastAPI
- SQLAlchemy ORM
- PyMySQL
- LangGraph
- LangChain Core
- LangChain Groq
- Groq API

### Database

- MySQL
- Database name: `hcp_crm`

## Project Structure

```text
hcp-crm/
+-- backend/
|   +-- main.py
|   +-- database.py
|   +-- requirements.txt
|   +-- .env.example
|   +-- agent/
|       +-- __init__.py
|       +-- graph.py
|       +-- tools.py
+-- frontend/
|   +-- public/
|   |   +-- index.html
|   +-- package.json
|   +-- src/
|       +-- index.js
|       +-- App.jsx
|       +-- App.css
|       +-- components/
|       +-- hooks/
|       +-- store/
+-- sql/
    +-- schema.sql
    +-- migration_auth.sql
```

## LangGraph Agent Tools

The AI agent is built around five tools:

1. `log_interaction`
   Extracts HCP name, date, time, interaction type, topics, materials, samples, sentiment, outcomes, and follow-ups.

2. `edit_interaction`
   Updates a supported field on an existing interaction.

3. `get_hcp_profile`
   Fetches HCP-related context.

4. `suggest_followups`
   Generates follow-up recommendations based on sentiment and topics.

5. `analyze_sentiment`
   Classifies interaction text as Positive, Neutral, or Negative.

## Database Tables

The MySQL schema includes:

- `hcps`
- `interactions`
- `chat_messages`
- `users`
- `user_activity`
- `otp_codes`

Saved CRM records are stored in:

```text
hcp_crm.interactions
```

## Environment Variables

Create a backend `.env` file from the example:

```powershell
cd backend
copy .env.example .env
```

Update the values:

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

For local development on the current machine, MySQL was verified with:

```env
DATABASE_URL=mysql+pymysql://root:root@localhost:3306/hcp_crm
```

Do not commit the real `.env` file.

## Setup Instructions

### 1. Clone the Repository

```powershell
git clone https://github.com/Yashashvi211189/HCP_CRM.git
cd HCP_CRM
```

### 2. Configure MySQL

Start MySQL and create the database:

```sql
CREATE DATABASE IF NOT EXISTS hcp_crm;
```

Then load the schema:

```powershell
mysql -uroot -p hcp_crm < sql/schema.sql
```

If `mysql` is not on PATH, use the full MySQL client path installed on your machine.

### 3. Set Up Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edit `.env` and set your `DATABASE_URL` and `GROQ_API_KEY`.

Start the backend:

```powershell
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Backend docs:

```text
http://127.0.0.1:8000/docs
```

### 4. Set Up Frontend

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

## Login

For local demo access, the user OTP is:

```text
12345
```

Admin password defaults to:

```text
admin123
```

Both can be changed in backend configuration.

## API Endpoints

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/auth/send-otp` | Sends or returns a temporary OTP |
| POST | `/auth/verify-otp` | Verifies OTP and returns a user token |
| POST | `/auth/admin-login` | Logs in admin |

### CRM

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/chat` | Sends a natural language message to the LangGraph agent |
| GET | `/api/hcps?q=` | Searches HCPs |
| POST | `/api/interactions` | Saves an interaction |
| GET | `/api/interactions` | Lists interactions |
| PATCH | `/api/interactions/{id}` | Updates one interaction field |
| DELETE | `/api/interactions/{id}` | Deletes an interaction |

### Admin

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/admin/users` | Lists users |
| GET | `/admin/users/{id}/activity` | Shows user activity and interaction records |

## Example Workflow

1. Log in as a user with OTP `12345`.
2. Type a natural interaction note in the AI Assistant panel.
3. The AI extracts structured data.
4. The left form updates automatically.
5. AI follow-up recommendations appear.
6. Click Save.
7. The record is stored in MySQL under `hcp_crm.interactions`.
8. Admin can view user activity and submitted interaction content.

## Example AI Input

```text
Today I met with Dr. Smith, discussed Product X efficacy, positive sentiment, shared brochures.
```

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

## Security Notes

- The committed repository does not include `backend/.env`.
- Never commit real Groq API keys, SMTP credentials, JWT secrets, or database passwords.
- The OTP flow is simplified for demo/local development.
- Production deployment should use stronger authentication, secure session management, role-based access control, and environment-managed secrets.

## Current Limitations

- The UI is currently a two-panel CRM logging screen.
- The OTP flow is optimized for local demonstration.
- Voice note support depends on browser speech recognition availability.
- Production-grade audit, consent, and compliance workflows should be expanded before real healthcare deployment.

## Roadmap

- AI-first summary-first workflow
- Collapsible advanced CRM fields
- HCP relationship scoring
- Previous interaction timeline
- Confidence score visualization
- Compliance checks and consent reminders
- Contextual follow-up generation with due dates
- Role-based admin analytics
- Deployment configuration

## Repository

```text
https://github.com/Yashashvi211189/HCP_CRM
```
