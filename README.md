# 🚀 LCAMS – Learning Classroom & Asset Management System

A full-stack web application designed to efficiently manage institutional infrastructure, classroom assets, and maintenance operations in a centralized digital platform.

---

# 📌 Overview

LCAMS (Learning Classroom & Asset Management System) helps educational institutions digitally manage:

* 🏢 Academic Blocks
* 🧱 Floors & Rooms
* 💻 Institutional Assets
* 🔧 Maintenance Activities
* 📊 Infrastructure Analytics

The system provides real-time visibility into infrastructure resources and simplifies asset tracking, maintenance workflows, and administrative operations.

---

# ✨ Features

## 🔐 Authentication & Authorization

* JWT-based authentication
* Secure password hashing using bcryptjs
* Role-based access control

### Roles Implemented

* Admin
* Staff
* Maintenance
* Viewer

---

## 🏗️ Infrastructure Management

* Multi-block architecture
* Floor-wise room organization
* Structured classroom hierarchy

### Room Types

* Classroom
* Smart Classroom
* Laboratory
* Faculty Room
* HOD Office
* Auditorium
* Conference Room
* Store Room
* Washrooms

---

## 📦 Asset Management

Track and manage institutional assets efficiently.

### Asset Categories

* Electronics
* Furniture
* Laboratory Equipment
* Electrical
* IT Infrastructure
* Safety Equipment

### Asset Status Tracking

* Working
* Damaged
* Under Maintenance
* Discarded
* Lost

---

## 🔧 Maintenance Management

Digital workflow for reporting and resolving maintenance issues.

### Features

* Issue reporting
* Task assignment
* Priority management
* Repair tracking
* Status updates

### Maintenance Status

* Pending
* In Progress
* Resolved
* Closed

---

## 📊 Analytics Dashboard

Interactive dashboard with real-time infrastructure insights.

### Dashboard Metrics

* Total Blocks
* Total Floors
* Total Rooms
* Total Assets
* Maintenance Statistics
* Asset Distribution Charts
* Room Type Analytics
* Recent Maintenance Activity

---

# 🛠️ Tech Stack

## Frontend

* React.js
* React Router DOM
* Axios
* React Hot Toast
* Recharts

## Backend

* Node.js
* Express.js

## Database

* MongoDB Atlas
* Mongoose ODM

## Authentication

* JWT
* bcryptjs

## Development Tools

* VS Code
* Postman
* Git & GitHub

---

# 🗂️ Project Structure

```bash
LCAMS/
│
├── client/                 # React Frontend
│   ├── src/
│   ├── public/
│
├── server/                 # Node.js Backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── seed/
│   └── config/
│
├── .env
├── package.json
└── README.md
```

---

# 🧠 Database Design

## Core Collections

* Users
* Roles
* Blocks
* Floors
* Rooms
* Assets
* MaintenanceLogs

## Relationships

* Block → Floors
* Floor → Rooms
* Room → Assets
* Asset → Maintenance Logs

Implemented using:

```js
mongoose.Schema.Types.ObjectId
```

---

# ⚙️ Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/lcams.git
```

## 2️⃣ Navigate to Project

```bash
cd lcams
```

## 3️⃣ Install Dependencies

### Frontend

```bash
cd client
npm install
```

### Backend

```bash
cd ../server
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
DB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

---

# ▶️ Running the Project

## Start Backend

```bash
cd server
npm run dev
```

## Start Frontend

```bash
cd client
npm start
```

---

# 🌱 Database Seeding

Populate the database with sample data:

```bash
cd server
node seed/seed.js
```

Seeded Data Includes:

* Roles
* Users
* Blocks
* Floors
* Rooms
* Assets
* Maintenance Logs

---

# 🚧 Challenges Faced

During development, several real-world debugging and integration challenges were solved:

* Mongoose model export issues
* MongoDB authentication problems
* Duplicate key errors
* Dashboard rendering crashes
* API response inconsistencies
* Data aggregation debugging

---

# 📈 Future Enhancements

* 📱 Mobile responsive optimization
* 🔔 Email notifications
* 📌 QR-based asset tracking
* 🤖 Predictive maintenance analytics
* 📄 Report export system
* 🔍 Advanced filtering & search

---

# 🎯 Learning Outcomes

Through this project, I gained hands-on experience in:

* Full Stack Web Development
* REST API Architecture
* MongoDB Schema Design
* React Component Architecture
* Authentication & Authorization
* Dashboard Analytics
* Error Handling & Debugging
* Real-world Project Structuring

---

# 🤝 Contribution

Contributions, suggestions, and improvements are welcome.

Feel free to fork the repository and submit pull requests.

---

# 📄 License

This project is developed for educational and academic purposes.

---

# 👩‍💻 Author

## Riya Bandi

Computer Science Engineering Student
Full Stack & Backend Development Enthusiast

* GitHub: https://github.com/your-username
* LinkedIn: https://linkedin.com/in/your-linkedin

---

# ⭐ Final Note

LCAMS is a scalable and structured institutional infrastructure management platform designed to simplify asset tracking, improve maintenance efficiency, and provide real-time infrastructure visibility through a centralized digital system.

If you found this project interesting, consider giving it a ⭐ on GitHub.
