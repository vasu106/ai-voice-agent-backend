# Clinic Voice Agent — Backend

REST API backend for an AI voice agent that handles clinic appointments via Vapi.

---

## Project Structure

```
backend/
├── src/
│   ├── routes/
│   │   └── index.js              # All route definitions
│   ├── controllers/
│   │   ├── slotsController.js    # Handles /get-available-slots
│   │   ├── appointmentController.js  # Handles book/cancel/reschedule
│   │   └── conversationController.js # Handles log-call-summary, handoff
│   ├── services/
│   │   ├── slotsService.js       # Business logic for slots
│   │   ├── appointmentService.js # Business logic for appointments
│   │   └── conversationService.js # Business logic for conversations
│   ├── utils/
│   │   ├── slotHelper.js         # Time/slot utility functions
│   │   └── responseHelper.js     # JSON response helpers
│   ├── config/
│   │   └── supabase.js           # Supabase client setup
│   └── index.js                  # Express app entry point
├── package.json
├── .env.example
└── README.md
```

---

## API Endpoints

All endpoints are POST and live under `/api/`.

| Endpoint | Required Fields |
|---|---|
| `POST /api/get-available-slots` | `date`, `doctor` |
| `POST /api/book-appointment` | `patient_name`, `phone`, `doctor`, `date`, `time` |
| `POST /api/cancel-appointment` | `phone`, `date` |
| `POST /api/reschedule-appointment` | `phone`, `old_date`, `new_date`, `new_time`, `doctor` |
| `POST /api/log-call-summary` | `summary` (optional: `call_id`, `phone`, `organization_id`, `duration_seconds`) |
| `POST /api/handoff-to-human` | (optional: `phone`, `reason`, `call_id`) |

---

## Supabase Tables Required

Make sure these tables exist in your Supabase project:

- `organizations` — clinic/hospital records
- `doctors` — doctor records with `organization_id`, `name`
- `clinic_hours` — with `organization_id`, `day_of_week`, `open_time`, `close_time`, `is_open`
- `patients` — with `name`, `phone`, `organization_id`
- `appointments` — with `patient_id`, `doctor_id`, `organization_id`, `appointment_date`, `appointment_time`, `status`
- `conversations` — with `call_id`, `patient_id`, `organization_id`, `summary`, `duration_seconds`

---

## Run Locally

### Step 1: Clone and install

```bash
cd backend
npm install
```

### Step 2: Setup environment

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
PORT=3000
NODE_ENV=development
```

> ⚠️ Use the **Service Role Key** (not anon key) so the backend can bypass RLS.

### Step 3: Run

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server starts at: `http://localhost:3000`

Health check: `GET http://localhost:3000/health`

---

## Deploy on Railway

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial backend"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 2: Create Railway project

1. Go to https://railway.app
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repo
4. Railway auto-detects Node.js

### Step 3: Add environment variables in Railway

In your Railway project → **Variables** tab, add:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NODE_ENV=production
```

Railway automatically sets `PORT`.

### Step 4: Deploy

Railway deploys automatically on every push to `main`.

Your live URL will be something like:
```
https://your-app-name.up.railway.app
```

---

## Connect to Vapi

In your Vapi dashboard, for each tool:

- **Method**: POST
- **URL**: `https://your-app.up.railway.app/api/<endpoint>`
- **Content-Type**: `application/json`

Example for book-appointment tool in Vapi:
```
POST https://your-app.up.railway.app/api/book-appointment
Body: { "patient_name": "...", "phone": "...", "doctor": "...", "date": "...", "time": "..." }
```

---

## Notes

- All dates must be in `YYYY-MM-DD` format
- All times must be in `HH:MM` (24-hour) format
- Double booking is prevented at the service level
- Doctor lookup is case-insensitive partial match