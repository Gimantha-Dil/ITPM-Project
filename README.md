# SLIIT Learning Platform

A full-stack web platform built exclusively for SLIIT students to buy & sell study notes, host or join Kuppi (study) sessions, chat with peers, and manage academic resources — all in one place.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, React Router v6 |
| Backend | Node.js, Express.js v5 |
| Database | MongoDB Atlas (Mongoose ODM) |
| Authentication | JWT + OTP Email Verification |
| File Handling | Multer |
| Email | Nodemailer, Resend |
| PDF Generation | PDFKit |
| Excel Export | ExcelJS |
| Testing | Jest, Supertest, mongodb-memory-server |
| E2E Testing | Playwright |

---

## Features

### Auth & Users
- Register with **SLIIT email only** (`@my.sliit.lk`)
- OTP-based email verification
- JWT login / logout
- Forgot password with OTP reset
- Profile management with profile picture upload
- Bank details management (required to sell)
- Account deletion with OTP confirmation

### Notes Marketplace
- Upload and sell study notes (with preview file)
- Browse and purchase notes from other students
- Download purchased notes
- Payment slip upload & seller verification flow
- Feedback & ratings system
- Bookmarks for saving notes

### Kuppi Sessions
- Create and host live study sessions (online/physical)
- Enroll with payment slip
- Host verifies / rejects enrollments
- Feedback on sessions

### Chat
- Peer-to-peer messaging between students

### Chatbot
- AI-powered chatbot assistant

### Notifications
- In-app notification system

### Analytics
- Dashboard with platform analytics (admin)

### Payments
- Manual bank transfer payment system
- Payment history tracking
- Payment slip re-upload support

---

## Project Structure

```
ITPM-Project/
├── backend/
│   ├── controllers/       # Business logic
│   ├── middleware/        # Auth, file upload
│   ├── models/            # Mongoose schemas
│   ├── routes/            # Express API routes
│   ├── tests/             # Jest unit/integration tests
│   ├── utils/             # Email, PDF, Excel helpers
│   ├── server.js          # Entry point
│   └── .env               # Environment variables
└── frontend/
    ├── public/
    └── src/
        ├── components/    # Reusable UI components
        ├── context/       # React Context (Auth)
        ├── pages/         # Page components
        └── App.js
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm
- MongoDB Atlas account (or local MongoDB)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ITPM-Project.git
cd ITPM-Project
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
PORT=5000
FRONTEND_URL=http://localhost:3000
```

Start the backend:

```bash
npm start
```

Backend runs on `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000`

---

## Running Tests

From the `backend/` directory:

```bash
# Verbose output
npm test

# Silent mode
npm run test:silent
```

Tests use an in-memory MongoDB instance — no real DB connection needed.

---

## API Endpoints

### Auth — `/api/auth`
| Method | Route | Description |
|---|---|---|
| POST | `/register` | Register new user |
| POST | `/verify-otp` | Verify email OTP |
| POST | `/login` | Login |
| POST | `/forgot-password` | Send password reset OTP |
| POST | `/reset-password` | Reset password |
| GET | `/profile` | Get current user profile |
| PUT | `/profile` | Update profile |
| PUT | `/change-password` | Change password |
| DELETE | `/delete-account` | Delete account |

### Notes — `/api/notes`
| Method | Route | Description |
|---|---|---|
| GET | `/` | List all notes |
| POST | `/` | Create a note (requires bank details) |
| GET | `/:id` | Get note by ID |
| PUT | `/:id` | Update note |
| DELETE | `/:id` | Delete note |
| POST | `/:id/purchase` | Purchase a note |
| GET | `/:id/download` | Download purchased note |
| POST | `/:id/feedback` | Add feedback |
| POST | `/:id/bookmark` | Toggle bookmark |

### Kuppi Sessions — `/api/kuppi`
| Method | Route | Description |
|---|---|---|
| GET | `/` | List all sessions |
| POST | `/` | Create session (requires bank details) |
| GET | `/:id` | Get session by ID |
| PUT | `/:id` | Update session |
| DELETE | `/:id` | Delete session |
| POST | `/:id/enroll` | Enroll in session |
| PUT | `/:sessionId/verify/:enrollmentId` | Verify enrollment |

### Other Endpoints
| Prefix | Description |
|---|---|
| `/api/chat` | Peer chat messages |
| `/api/notifications` | User notifications |
| `/api/analytics` | Platform analytics |
| `/api/payments` | Payment history |
| `/api/files` | File management |

---

## Frontend Pages

| Route | Page |
|---|---|
| `/` | Home / Landing Page |
| `/login` | Login |
| `/register` | Register |
| `/verify-otp` | OTP Verification |
| `/forgot-password` | Password Reset |
| `/notes` | Browse Notes |
| `/create-note` | Upload Note |
| `/my-notes` | My Uploaded Notes |
| `/my-purchases` | Purchased Notes |
| `/kuppi-sessions` | Browse Kuppi Sessions |
| `/create-session` | Create Kuppi Session |
| `/my-sessions` | My Sessions |
| `/chat` | Chat |
| `/chatbot` | AI Chatbot |
| `/analytics` | Analytics Dashboard |
| `/profile` | User Profile |
| `/notifications` | Notifications |
| `/bookmarks` | Bookmarked Notes |
| `/payment-history` | Payment History |

---

## Access Control

- Only **SLIIT email addresses** (`@my.sliit.lk`) can register
- Sellers must add **bank details** before listing notes or sessions
- Protected routes require a valid JWT token
- Admin role available for platform management

---

## Team

> SLIIT — IT Project Management (ITPM) Group Project (16), 2026
