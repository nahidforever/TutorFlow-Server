# 🎓 TutorFlow - Server (Backend API)

TutorFlow backend is a REST API built with Node.js and Express.js.  
It handles authentication, tutor management, booking system, and secure data operations.

## 🚀 Features

- 🔐 JWT Authentication system
- 👨‍🏫 Tutor CRUD API (Create, Read, Update, Delete)
- 📅 Booking system with slot validation
- 🔎 Search & filter API (MongoDB regex, date range)
- 👤 User-based data protection
- ⚡ Secure RESTful API structure

## ⚙️ Tech Stack

- Node.js
- Express.js
- MongoDB
- JWT (JSON Web Token)
- CORS
- dotenv

## 🔐 Authentication

- JWT token generation on login/register with (Better Auth)
- Protected API routes using Proxy.js
- Google login support

## 📡 Main API Routes

### Auth

- POST /auth/login
- POST /auth/register

### Tutors

- GET /tutors
- POST /tutors
- PUT /tutors/:id
- DELETE /tutors/:id

### Bookings

- POST /bookings
- GET /bookings/user
- PATCH /bookings/:id
