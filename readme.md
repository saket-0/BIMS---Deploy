# BIMS: Blockchain Inventory Management System

BIMS is a modern, secure, web-based application designed to manage inventory using an immutable blockchain ledger. It features a client-server architecture with a robust **Node.js/Express.js** backend and a Vanilla JavaScript frontend, all powered by a **PostgreSQL** database.

The system enforces strict business logic and security through **Role-Based Access Control (RBAC)**, ensuring all inventory transactions are validated, cryptographically signed, and permanently recorded on a server-side blockchain.

-----

## 🌟 Key Features

### Ledger Integrity & Audit

  * **Server-Authoritative Blockchain:** The client only sends a transaction request; the server rebuilds the entire world state in memory and validates the transaction before creating a cryptographically signed block.
  * **Real-Time Sync (SSE):** Uses **Server-Sent Events** to automatically broadcast new, validated blocks to all connected clients, ensuring real-time UI updates across the application.
  * **Time-Travel Audit:** Admins and Auditors can generate a verifiable, read-only snapshot of the entire inventory state as it existed at any specific historical date and time.
  * **Chain Integrity Verification:** Admins and Auditors can trigger a server-side hash verification of the entire blockchain to detect any tampering.

### Inventory & Product Management

  * **Full Product Lifecycle:** Supports creation, editing of name, price, and category (`ADMIN_EDIT_ITEM`), and immutable deletion (`DELETE_ITEM`) which is only permitted if the stock is zero.
  * **Image Management:** Includes a dedicated image proxy endpoint on the backend to fetch remote URLs securely, combined with **Cropper.js** on the frontend for compulsory 1:1 square cropping of product images.
  * **Location and Category "Smart Delete":** Admin actions to remove locations or categories trigger a soft-delete (archive) if they have transaction history, or a permanent hard delete if they are unused.

### Security & Auditing

  * **Anomaly Detection Report:** A dedicated report flags transactions based on three rules: **Business Logic** (e.g., after-hours activity in UTC), **Statistical Outliers** (e.g., quantity \> 3-sigma deviation), and **Behavioral Anomalies** (e.g., first-time unusual actions for a user role).
  * **Predictive Low Stock:** Calculates 30-day velocity to provide proactive warnings for items expected to run out soon.
  * **User Profile & Sessions:** Users can update their own profile and change passwords securely. The system also tracks the 10 most recent login sessions and their active/expired status.

-----

## 🛠️ Tech Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | Vanilla JavaScript (ES6+) | All client-side logic, routing, and state management. |
| | TailwindCSS / CSS3 | Utility-first styling with a comprehensive Dark Mode. |
| **Backend** | Node.js / Express.js | Robust server handling API routes and business logic. |
| | PostgreSQL | Database for persistence of users, sessions, and the blockchain table. |
| **Integrity** | `crypto` (Node.js) | Used for SHA-256 cryptographic hashing of blocks. |
| **Security** | `bcryptjs` | Used for secure password hashing and verification. |

-----

## ⚙️ Setup and Installation

### Prerequisites

  * [Node.js](https://nodejs.org/) (v18 or later)
  * [PostgreSQL](https://www.postgresql.org/download/)

### 1\. Database Setup

1.  Install and run PostgreSQL.
2.  Create a new database named `bims` and a user (default: `deep`/`password`).
    ```sql
    -- Example for psql
    CREATE DATABASE bims;
    CREATE USER deep WITH PASSWORD 'password';
    GRANT ALL PRIVILEGES ON DATABASE bims TO deep;
    ```

### 2\. Backend Server Setup

Navigate to the `bims-backend` directory and run the following commands.

```bash
cd bims-backend

# 1. Install dependencies, create tables, and seed default users
npm run build

# 2. Start the backend server (runs on http://127.0.0.1:3000)
npm start
```

### 3\. Frontend Application

The frontend is a static site (HTML, CSS, JS). You can serve it using any local web server.

```bash
# 1. Navigate to the root directory (Lap/)
cd ..

# 2. Install 'serve' globally if you don't have it
npm install -g serve

# 3. Serve the directory (runs on http://127.0.0.1:5500)
serve -l 5500
```

Open your browser and navigate to `http://127.0.0.1:5500`.

-----

## 🔑 Default Logins

The password for all seeded users is `password`.

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@bims.com` | `password` |
| **Inventory Manager** | `manager@bims.com` | `password` |
| **Auditor** | `auditor@bims.com` | `password` | 