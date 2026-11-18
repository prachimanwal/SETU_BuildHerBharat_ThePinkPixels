# SETU: Bridging Skills, Opportunities & Employment
### हुनर से हक़ की कमाई तक।

**Event**: Builder Bharat 2026 – Build Her Bharat  
**Institution**: K.R. Mangalam University, Gurugram  
**Tech Stack**: React 19 + Vite + TypeScript, Node.js + Express + TypeScript, MongoDB + Mongoose, Chart.js, Tailwind CSS v4.

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- **Node.js**: v18+ (tested on v25.9.0)
- **MongoDB**: Local MongoDB community service running on port `27017` (default `mongodb://127.0.0.1:27017/setu_db`). No cloud accounts or paid API keys required.

To verify or start MongoDB locally on Windows:
```powershell
Get-Service MongoDB
# If stopped, start with:
Start-Service MongoDB
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```
Default contents:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/setu_db
JWT_SECRET=setu_super_secret_jwt_key_2026_builder_bharat
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Install Dependencies & Seed Demo Data
Run from the root directory:
```bash
# Seed database with complete demo profiles, assessments, opportunities & schemes
npm run seed
```

### 4. Run the Full Application
```bash
# Launches Express API Server (Port 5000) and Vite Client (Port 5173) concurrently
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🔑 Demo Logins for Judges & Evaluators

The application includes an instant **"1-Click Demo Login"** dropdown directly in the top header and on the login page:

| Role | Email | Password | Persona & Highlights |
|---|---|---|---|
| **Job Seeker** | `seeker@setu.demo` | `SetuDemo@2026` | **Priya Sharma**: Rural-to-urban graduate returning to work. Has completed Graphic Design assessment, completed practical assignment, built portfolio project, and has a scheduled interview ready to view! |
| **Approved Employer** | `employer@techcorp.demo` | `SetuDemo@2026` | **Gramin Digital Services Pvt Ltd**: Verified by administrator with official badge. Can publish opportunities and review candidate applicants & schedule interviews. |
| **Pending Employer** | `pending@startup.demo` | `SetuDemo@2026` | **BharatTech Innovations**: Registered employer with pending GST verification. Can save drafts, but publishing is safely blocked until admin approves. |
| **Administrator** | `admin@setu.gov.in` | `SetuAdmin@2026` | **Platform Admin**: Verification queue, moderation desk, reported listings resolution, Build Her confidential safety tickets, and Govt schemes management. |

---

## 🌉 The 7-Stage SETU Journey Walkthrough

SETU connects seekers through an unbroken, persistent 7-stage pathway:

$$\text{Discover} \longrightarrow \text{Assess} \longrightarrow \text{Learn} \longrightarrow \text{Practice} \longrightarrow \text{Build Portfolio} \longrightarrow \text{Find Opportunities} \longrightarrow \text{Earn}$$

1. **Discover**: Self-registration without formal degree constraints. Seekers add location (rural/urban), languages, skills, experience (or fresher/career break), and goals.
2. **Assess**: 3 interactive assessments (Web Dev, Graphic Design, Digital Office Operations). Evaluated on the server; computes score percentage, strengths, and maps skill gaps directly to learning resources.
3. **Learn**: Practical tutorials with clear briefs and sample deliverables.
4. **Practice**: Seekers submit practical assignment deliverables (e.g. Canva poster link, Google Sheets budget).
5. **Build Portfolio**: One-click integration saves practical deliverables directly to the seeker's public portfolio with titles, descriptions, and work sample links.
6. **Find Opportunities**: Transparent rule-based matching engine scores listings ($95\%$, $85\%$) and explains *why* ("Matches your Canva skills", "Remote work fits your preference", "Career restart friendly"). Seekers can bookmark and submit direct applications with automatic portfolio snapshots.
7. **Earn**: Employers review candidate portfolios, update timeline status (`Applied` $\to$ `Under Review` $\to$ `Shortlisted` $\to$ `Interview Scheduled` $\to$ `Selected`), and schedule interviews with date, time, and Google Meet link. Recorded outcomes reflect directly on the seeker dashboard.

---

## 🎯 Verification & Acceptance Suite

An automated end-to-end verification suite is included. Run:
```bash
npm run verify
```
This script validates:
1. Demo seeker authentication & password hashing
2. Pending employer registration status check
3. Admin role enforcement
4. Assessment server scoring formula and gap-to-resource linking
5. Practical assignment submission & auto-creation of portfolio project
6. Policy enforcement: Pending employer blocked from publishing live opportunities
7. Admin approval workflow
8. Approved employer publishing opportunities
9. Transparent explainability matching rules
10. Direct application creation and duplicate application prevention
11. Employer scheduling interview with date, time, and instructions
12. Listing report moderation (seeker reports $\to$ admin hides listing)
13. Strict tenant isolation (competitor cannot view another employer's applicants)

---

## 🌟 Ten MVP Features Implemented

1. **Registration & Profile**: Self-registration for seekers and employers. Supports users with no formal degree, freshers, and career returnees.
2. **Personalized Dashboard**: Dynamic "Next Suggested Action" banner, 7-stage journey visual tracker, matched opportunities, recommended learning, and interview alert.
3. **Skill Assessment**: 3 seeded domain assessments scored on the server, gap-to-resource linking, and persistent history.
4. **Learning & Practice**: Practical assignments with completion modals and one-click portfolio publishing.
5. **Opportunity Matching**: Filterable directory with transparent match scores and explainability reason badges.
6. **Employer Verification**: Document upload, admin review queue, verified badge, and public listing protection.
7. **Application Tracking**: Direct vs. external applications, duplicate prevention, status history timeline, and interview callout cards.
8. **My Progress**: Chart.js data visualizations (status funnel, assessment scores over time, 7-stage audit) derived from saved records.
9. **Government Schemes**: Searchable directory of verified Central & State schemes (PMKVY, NAPS, PM Vishwakarma, Stand-Up India) with confirmed `.gov.in` URLs.
10. **Build Her**: Dedicated section for women returning to work, career restart opportunities, POSH Act workplace safety rights, helplines (1091, 112, 181, 7827170170), and a confidential support desk.

---

## 🌐 Bilingual Interface (English / Hindi)
A language toggle is available in the top bar to switch between English and Hindi (**हुनर से हक़ की कमाई तक।**).
