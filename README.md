# Site Survey Tool for ISPs

Site Survey Tool is a production-ready full-stack workspace for ISP field teams. It centralizes property intake, floor plans, RF notes, survey checklists, and handoff reporting into one role-aware platform for engineers, planners, and operations reviewers.

---

## Live Demo

https://site-survey-tool-nine.vercel.app/

---

## Architecture

Frontend (Vercel) → Spring Boot API (Render) → Railway MySQL

---

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* GSAP
* React Router

### Backend

* Spring Boot
* Spring Security
* JWT Authentication
* JPA / Hibernate

### Database & Deployment

* MySQL
* Railway
* Render
* Vercel
* Docker

### File Storage

* MinIO

---

## Features

* Role-aware dashboard for engineers and operations teams
* Property and site tracking workflows
* Floor plan and RF evidence management
* Survey checklist and reporting workflows
* Secure JWT authentication with protected API routes
* Responsive and mobile-friendly UI for field operations
* Production-ready deployment using Docker and cloud platforms

---

## Project Structure

```text
site-survey-tool/
│
├── frontend/    # React + Vite frontend
├── backend/     # Spring Boot backend API
└── README.md
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

---

## Backend Setup

Create or reuse a MySQL database and ensure MinIO is available before starting the API.

```bash
cd backend
./gradlew bootRun
```

Backend runs at:

```text
http://localhost:8081
```

---

## Backend Environment Variables

```env
SPRING_DATASOURCE_URL=jdbc:mysql://127.0.0.1:3306/sitesurvey?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true

SPRING_DATASOURCE_USERNAME=sitesurvey
SPRING_DATASOURCE_PASSWORD=your-password

APP_JWT_SECRET=replace-with-a-long-random-secret

APP_CORS_ALLOWED_ORIGINS=http://localhost:5173

MINIO_URL=http://localhost:9000
MINIO_ACCESS_KEY=sitesurveyminio
MINIO_SECRET_KEY=your-secret
MINIO_BUCKET_NAME=sitesurvey-files
```

---

## Frontend Environment Variable

```env
VITE_API_BASE_URL=http://localhost:8081/api
```

---

## Deployment

### Frontend

* Deployed on Vercel

### Backend

* Containerized using Docker
* Deployed on Render

### Database

* Hosted on Railway MySQL

---

## Notes

* The frontend includes local demo fallbacks for authentication and workspace data when the API is unavailable.
* Keep `.env` files private and never commit secrets to GitHub.
* Replace sample credentials before production deployment.

---

## Future Improvements

* Real-time collaboration for survey teams
* File upload optimization using S3-compatible storage
* Advanced analytics and reporting dashboards
* Offline-first support for field engineers
* Role-based access management enhancements
