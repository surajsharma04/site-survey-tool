# Site Survey Tool for ISPs

Site Survey Tool is a full-stack workspace for ISP field teams. It keeps property intake, floor plans, RF notes, survey checklists, and handoff reporting in one role-aware interface for engineers, planners, and operations reviewers.

## Stack

- Frontend: React, Vite, Tailwind CSS, GSAP, React Router
- Backend: Spring Boot, Spring Security, JWT, JPA/Hibernate
- Database: MySQL
- File storage: MinIO or another S3-compatible service

## Project Structure

- `frontend/` contains the React application
- `backend/` contains the Spring Boot API

## Run The Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend starts at `http://localhost:5173`.

## Run The Backend

Create or reuse a MySQL database and make sure MinIO or another S3-compatible endpoint is available, then start the API:

```powershell
cd backend
.\gradlew.bat bootRun
```

The backend starts at `http://localhost:8081`.

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

## Frontend Environment Variable

```env
VITE_API_BASE_URL=http://localhost:8081/api
```

## Notes

- The frontend includes local demo fallbacks for auth and some workspace data when the API is unavailable.
- Keep `.env` local and replace sample secrets before sharing the project.
