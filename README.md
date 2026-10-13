# Fitslot - Gym Booking System
A lightcweb application designed for gym members to browse and book training sessions, manage check-in codes, and handle automated waitlists, with dedicated admin tools for session creation.

Live Website URL:https://fitslot-gym-slot-booking-website.onrender.com/
## Backend/Database used: Stack: Node.js, Express.js (Backend), Supabase / PostgreSQL (Database), and  HTML/CSS/JavaScript with JWT authentication stored in `localStorage`.

## Assumptions
- Users must be registered and logged in to access booking features and view personal reservations.
- Sessions whose date and time have already passed according to the system clock are automatically closed and cannot be booked or cancelled.
- Each session has a default capacity limit of 20 slots unless specified otherwise by an admin.

#Credentials
Admin Credentials
email:a@gmail.com
password:123
Member Credentials
email:member@gmail.com
password:1234 

## 🚀 Setup Instructions
1. Clone or download the project repository to your local machine.
2. Navigate to the backend folder and install dependencies:
   ```bash
   npm install
