# AI-Powered HCP CRM Interaction Logger

A full-stack, AI-first CRM module for capturing Healthcare Professional (HCP) interactions through natural language, structured review, and intelligent follow-up recommendations.

Live App: [https://hcp-crm-rgft.onrender.com/](https://hcp-crm-rgft.onrender.com/)
Backend Swagger: [https://hcp-crm-back.onrender.com/docs](https://hcp-crm-back.onrender.com/docs)
Repository: [https://github.com/Yashashvi211189/HCP_CRM](https://github.com/Yashashvi211189/HCP_CRM)

This project helps pharmaceutical sales representatives, medical representatives, account managers, and field teams convert unstructured meeting notes into clean CRM records with minimal manual entry.

## Overview
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/e60888ce-0ca7-4ecb-b4c9-12f120590273" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/d2f6beb4-38ba-4285-b3aa-cf0bb28c8a66" />



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
- AI workspace with extracted summary, confidence indicators, doctor context, and processing status
- Smart follow-up action cards with priority, due date, and one-click accept
- Modern card-based form layout with collapsible metadata fields
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
|   +-- .env.example
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
+-- .github/
|   +-- workflows/
|       +-- pages.yml
+-- render.yaml
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

Swagger UI is available at the same URL and can be used to inspect and test every FastAPI route.

Alternative OpenAPI docs:

```text
http://127.0.0.1:8000/redoc
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

## Live Deployment

Use three separate hosted pieces:

| Part | Host | Purpose |
| --- | --- | --- |
| Frontend | Render Static Site or GitHub Pages | React app |
| Backend | Render Web Service | FastAPI API and Swagger |
| Database | Hosted MySQL | Permanent CRM records |

Do not use `localhost` in production. Do not leave placeholders such as `USER`, `PASSWORD`, `HOST`, or `PORT` in Render environment variables.

### 1. Create Hosted MySQL First

Create a MySQL database on a host such as Railway, Aiven, Clever Cloud, or another MySQL provider.

Then run the project schema file against that hosted database:

```text
sql/schema.sql
```

You can paste the file contents into your provider's SQL console, or run it with the MySQL CLI:

```bash
mysql -h YOUR_DB_HOST -P 3306 -u YOUR_DB_USER -p hcp_crm < sql/schema.sql
```

Your hosted MySQL URL must use real values and a numeric port:

```env
DATABASE_URL=mysql+pymysql://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_DB_HOST:3306/hcp_crm
```

Wrong:

```env
DATABASE_URL=mysql+pymysql://USER:PASSWORD@HOST:PORT/hcp_crm
```

### 2. Deploy Backend on Render

Create a Render **Web Service** for the backend. Do not deploy the backend as a Static Site.

Backend settings:

```text
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Backend environment variables:

```env
DATABASE_URL=mysql+pymysql://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_DB_HOST:3306/hcp_crm
GROQ_API_KEY=your_real_groq_key
JWT_SECRET=hcp_crm_secure_secret_2026
ADMIN_PASSWORD=admin123
PYTHON_VERSION=3.11.9
```

After deploy, test:

```text
https://your-backend-service.onrender.com/
https://your-backend-service.onrender.com/docs
```

### 3. Deploy Frontend

If using Render Static Site:

```text
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: build
```

Frontend environment variable:

```env
REACT_APP_API_URL=https://your-backend-service.onrender.com
```

If using GitHub Pages:

The repository includes `.github/workflows/pages.yml`.

Before enabling the workflow, add this repository variable in GitHub:

```text
Settings -> Secrets and variables -> Actions -> Variables -> New repository variable
```

Name:

```text
REACT_APP_API_URL
```

Value:

```text
https://your-backend-service.onrender.com
```

Then enable GitHub Pages:

```text
Settings -> Pages -> Build and deployment -> Source: GitHub Actions
```

After the workflow runs, the frontend will be available at:

```text
https://Yashashvi211189.github.io/HCP_CRM/
```

### 4. Swagger UI

Local Swagger:

```text
http://127.0.0.1:8000/docs
```

Production Swagger:

```text
https://your-backend-service.onrender.com/docs
```

Use Swagger UI to verify:

- `/` health check returns service status
- `/auth/send-otp` returns the demo OTP flow
- `/auth/verify-otp` returns an authorization token
- `/api/chat` returns AI extracted data and suggestions
- `/api/interactions` writes records to MySQL

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

FastAPI automatically exposes interactive Swagger documentation:

```text
Local:      http://127.0.0.1:8000/docs
Production: https://your-render-backend-url.onrender.com/docs
```

Most CRM routes require a bearer token. Log in through `/auth/verify-otp`, copy the returned token, click `Authorize` in Swagger UI, and enter:

```text
Bearer YOUR_TOKEN_HERE
```

### Health Check

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/` | Confirms the FastAPI service is running |

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
5. The AI workspace shows summary, confidence indicators, doctor context, and follow-up cards.
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
