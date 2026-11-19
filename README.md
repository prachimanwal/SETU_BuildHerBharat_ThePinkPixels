# SETU: Bridging Skills, Opportunities & Employment
### हुनर से हक़ की कमाई तक।

**Event**: Builder Bharat 2026 – Build Her Bharat  
**Institution**: K.R. Mangalam University, Gurugram  
**Tech Stack**: Node.js, Express.js, TypeScript, MongoDB Atlas, Mongoose, Zod, JWT / HttpOnly Cookie & Bearer Sessions, Google OAuth 2.0, bcrypt, React 19, Tailwind CSS v4.

---

## 🛠️ Root Cause & Solution for Netlify JSON Error

### The Issue
```text
Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```
When accessing `https://oursetu.netlify.app/`, attempting registration or login previously triggered this error.

**Why this happened:**
1. **Netlify SPA Redirection**: Netlify is a static web hosting platform. When the frontend made a request to `/api/auth/register`, Netlify looked for a local file at that path. Finding none, its Single Page App (SPA) redirect rule returned `index.html` (`<!DOCTYPE html>...`).
2. **Missing Backend Connection**: There was no backend API URL or proxy configured to forward `/api/*` requests to an active Express server.
3. **Unchecked JSON Parsing**: The client code called `response.json()` without verifying whether the `Content-Type` was `application/json`.

**How we fixed it:**
1. **Built a Standalone Express + TypeScript Backend (`backend/`)**: Houses all authentication, opportunity, assessment, learning, portfolio, application, employer, and admin endpoints.
2. **Enforced Uniform JSON Envelopes**: All API responses (including 404s and errors) return strict JSON `{ success: boolean, message: string, data?: any }` and never HTML.
3. **Safe Frontend API Client (`client/src/utils/api.ts`)**: Automatically prepends `VITE_API_URL`, attaches Bearer tokens, and guards against non-JSON responses.
4. **Netlify Proxy Rewrites (`client/public/_redirects` & `netlify.toml`)**: Forwards `/api/*` requests from Netlify to the deployed Render backend with status 200.

---

## 🚀 Local Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (tested on v20+)
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/setu_db`) or a free MongoDB Atlas connection string.

### 2. Environment Configuration
Backend `.env` file (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/setu_db
SESSION_SECRET=setu_super_secret_jwt_key_2026_builder_bharat
JWT_SECRET=setu_super_secret_jwt_key_2026_builder_bharat
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

### 3. Seed Demo Data
Populate MongoDB with demo seekers, employers, admin, assessments, learning resources, and opportunities:
```bash
npm run seed
```

### 4. Run the Full Application Locally
```bash
# Concurrently launches backend API (Port 5000) and frontend (Port 5173)
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 5. Run Automated Verification Tests
```bash
# Runs the complete 17-point automated verification suite
npm run verify
```

---

## ☁️ Deployment Instructions

### A. Deploy Backend to Render

1. **Push Code to GitHub**:
   Ensure the `backend/` directory is pushed to your GitHub repository.
2. **Create New Web Service on Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com/) -> **New +** -> **Web Service**.
   - Connect your GitHub repository.
   - Configure the service settings:
     - **Name**: `setu-backend-api`
     - **Root Directory**: `backend`
     - **Environment**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
3. **Set Environment Variables in Render**:
   Under **Environment** in your Render service dashboard, add:
   | Key | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `CLIENT_URL` | `https://oursetu.netlify.app` |
   | `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/setu_db?retryWrites=true&w=majority` |
   | `JWT_SECRET` | *(Generate a secure 32+ character random secret)* |
   | `SESSION_SECRET` | *(Generate a secure 32+ character random secret)* |
   | `GOOGLE_CLIENT_ID` | *(Your Google Cloud OAuth Client ID)* |
   | `GOOGLE_CLIENT_SECRET` | *(Your Google Cloud OAuth Client Secret)* |
4. **Deploy**:
   Click **Create Web Service**. Note your Render URL: `https://setu-backend-api.onrender.com`.
5. **Seed the Atlas Database**:
   You can run `npm run seed` locally with your Atlas `MONGODB_URI` set in `backend/.env`, or run the seed command via Render Shell.

---

### B. Configure Frontend on Netlify (`oursetu.netlify.app`)

There are two seamless ways to connect your Netlify frontend to your Render backend:

#### Option 1: Netlify Reverse-Proxy (Recommended - Zero Cross-Origin Cookie Issues)
The repository includes [`client/public/_redirects`](file:///c:/Users/hp/OneDrive/Desktop/SETU%20final/client/public/_redirects):
```text
/api/*  https://setu-backend-api.onrender.com/api/:splat  200
/*      /index.html                                       200
```
Update the destination URL in `client/public/_redirects` to match your live Render backend URL and deploy. All calls to `/api/*` will be proxied server-side by Netlify directly to your backend, avoiding any browser CORS or third-party cookie restrictions!

#### Option 2: Environment Variable
In your Netlify site dashboard:
- Go to **Site settings** -> **Environment variables**.
- Add variable:
  - `VITE_API_URL` = `https://setu-backend-api.onrender.com`
- Trigger a new deployment. The frontend [`api.ts`](file:///c:/Users/hp/OneDrive/Desktop/SETU%20final/client/src/utils/api.ts) client will automatically send direct requests to your Render backend, accompanied by `Authorization: Bearer <token>` and `credentials: 'include'`.

---

### C. MongoDB Atlas Connection Guide

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create a free shared cluster (M0).
3. Under **Database Access**, create a database user (e.g., `setu_admin`) with a secure password.
4. Under **Network Access**, click **Add IP Address** and choose **Allow Access From Anywhere** (`0.0.0.0/0`) so Render instances can connect.
5. In **Database** -> Click **Connect** -> **Connect your application** -> Copy the connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/setu_db?retryWrites=true&w=majority
   ```
6. Set this string as `MONGODB_URI` on Render and in `backend/.env`.

---

## 🔑 Demo Credentials

| Role | Email | Password | Persona & Highlights |
|---|---|---|---|
| **Job Seeker** | `seeker@setu.demo` | `SetuDemo@2026` | **Priya Sharma**: Returning to work after career break. Has verified Canva skills (80%), practical assignment in portfolio, and a scheduled interview. |
| **Approved Employer** | `employer@techcorp.demo` | `SetuDemo@2026` | **Gramin Digital Services Pvt Ltd**: Verified by admin. Can publish opportunities and review candidate applicants & schedule interviews. |
| **Pending Employer** | `pending@startup.demo` | `SetuDemo@2026` | **BharatTech Innovations**: Newly registered enterprise with verification docs pending admin approval (publishing blocked). |
| **Platform Administrator**| `admin@setu.gov.in` | `SetuAdmin@2026` | **SETU Platform Admin**: Full administrative authority for employer verification approvals, moderation, and reporting queues. |

---

## 📋 Successfully Tested APIs (17/17 Flows)

| Module | Endpoint | Method | Status | Notes |
|---|---|---|---|---|
| **Auth** | `/api/auth/register` | `POST` | `201 OK` | Validates fields with Zod, hashes passwords with bcrypt, blocks admin registration |
| **Auth** | `/api/auth/login` | `POST` | `200 OK` | Verifies credentials, sets HttpOnly cookie & returns JWT Bearer token |
| **Auth** | `/api/auth/google` | `POST` | `200 OK` | Google Identity token parsing & auto-provisioning |
| **Auth** | `/api/auth/logout` | `POST` | `200 OK` | Clears auth cookies and ends session |
| **Users** | `/api/users/me` | `GET` | `200 OK` | Fetches authenticated user profile |
| **Users** | `/api/users/profile` | `PUT` | `200 OK` | Updates seeker/employer profiles with ownership enforcement |
| **Users** | `/api/users/profile/completion` | `GET` | `200 OK` | Dynamic percentage based on real DB fields |
| **Dashboard** | `/api/dashboard` | `GET` | `200 OK` | Aggregated metrics, verified skills, recent activity feed, interview updates |
| **Opportunities** | `/api/opportunities` | `GET` | `200 OK` | Search, filtering, work mode, career restart filters |
| **Opportunities** | `/api/opportunities` | `POST` | `201 OK` | Restricted to approved employers (pending employers blocked) |
| **Opportunities** | `/api/opportunities/matched` | `GET` | `200 OK` | Explainable skill matching against seeker profile |
| **Assessments** | `/api/assessments` | `GET` | `200 OK` | Catalog retrieved (correct answer indices hidden) |
| **Assessments** | `/api/assessments/:id/submit` | `POST` | `200 OK` | Server-side scoring, strengths vs gaps analysis, persistent results |
| **Learning** | `/api/learning` | `GET` | `200 OK` | Catalog with user progress tracking |
| **Learning** | `/api/learning/:id/complete` | `POST` | `200 OK` | Marks complete; practical assignments auto-create portfolio project |
| **Portfolio** | `/api/portfolio` | `GET`/`POST`/`PUT`/`DELETE` | `200 OK` | Full CRUD with ownership checks |
| **Applications** | `/api/applications` | `POST` | `201 OK` | Direct application with duplicate prevention |
| **Applications** | `/api/applications/:id/status` | `PUT` | `200 OK` | Status updates & interview scheduling |
| **Employer** | `/api/employer/applicants` | `GET` | `200 OK` | Applicant review with strict competitor data isolation |
| **Admin** | `/api/admin/employers/:id/verify` | `PUT` | `200 OK` | Approves / rejects / suspends employers |
| **Admin** | `/api/admin/reports/:id/resolve` | `PUT` | `200 OK` | Resolves reports and hides offending listings |
| **Schemes** | `/api/schemes` | `GET` | `200 OK` | Curated government schemes directory |
