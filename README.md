# Anonymous Text

An anonymous messaging web application designed and built for a university Software Engineering Sessional project. The platform enables users to send and receive genuine, candid feedback and messages securely and anonymously, with real-time leetspeak-aware offensive language filtering, granular administrative moderation, and role-based access control.

Migrated from legacy PHP/MySQL to a production-ready, full-stack JavaScript architecture using **Next.js (App Router)**, **Tailwind CSS**, and **MongoDB Atlas (Mongoose)**.

---

## 🌟 Key Features

| Requirement | Description |
| :--- | :--- |
| **FR-01: User Registration** | Register with Full Name, Username (3–50 chars, regex `^[a-zA-Z0-9_]{3,50}$`), Email, and Password (min 6 chars). |
| **FR-02: Authentication & Session** | Secure login/logout using bcryptjs (salt rounds 10) and JWT (`jose`) in an `httpOnly`, `SameSite=Lax`, `Secure` cookie. Blocked accounts cannot log in. |
| **FR-03: Compose Anonymous Note** | Send an anonymous note (1–500 chars) to any registered user with a live character counter and instant delivery. |
| **FR-03b: NGL Public Links** | **Public Link (`/u/[username]`)**: Anyone on the internet (literally everyone, without needing an account) can send an anonymous note to a user! Includes dice question prompts, rate-limiting, and word filtering. |
| **FR-15: Live Anonymous Chat** | **Live 1-on-1 Chat (`/chat`)**: Randomly pairs two online strangers into an encrypted, ephemeral messenger room. Complete privacy (pseudonyms e.g., Anonymous Fox), instant skip/leave, offensive word filter, and auto-purging conversations. |
| **FR-04: Private Inbox** | View received, non-deleted messages (newest first). Unread messages marked with glowing badges. **Sender identities are cryptographically and architecturally omitted via projections and explicit DTOs**. |
| **FR-05: Message View** | Opening a note automatically marks it as read and displays it as an authentic **Cream Paper Note** (`#fbf7ef`) with serif typography. |
| **FR-06: Anonymous Reply** | Reply to received notes without ever knowing who sent them; threads maintain parent-child references. Block checks apply. |
| **FR-07: Soft Delete** | Soft-delete received notes (`isDeleted: true`) without affecting database referential integrity. |
| **FR-08: In-App Reporting** | Report abusive messages with a mandatory reason (max 255 chars) and an optional checkbox to simultaneously block the sender. |
| **FR-09: Sender Blocking** | Block abusive senders directly from a received message without revealing their username. |
| **FR-10: Offensive Language Filter** | Real-time filter rejecting offensive words (English + Romanized Bangla). Normalizes leetspeak (`0->o`, `1->i`, `3->e`, `4->a`, `5->s`, `7->t`, `@->a`, `$->s`), collapses 3+ repeated letters, and strips punctuation. |
| **FR-11: Password Management** | Change password with verification of current password and confirmation matching. |
| **FR-12: Admin Moderation** | Admin-exclusive queue of pending reports displaying offending message text, reason, date, and **sender username** (the *only* place sender identity is visible). Actions: Dismiss, Delete Message, or Block Sender Account. |
| **FR-13: User Directory** | Admin user directory with live search and an instant Block/Unblock toggle. |
| **FR-14: Role-Based Routing** | Edge middleware (`middleware.js`) enforcing strict boundary routing between anonymous guests, regular users, and administrators. Admins cannot send messages. |

---

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, JavaScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (White-Green / Cyan-Green Palette with instant Light/Dark mode switcher, frosted glass, and Cream Paper Note `#fbf7ef`)
- **Branding**: Custom Circular Emblem logo (`logo.png`) representing secure speech and privacy.
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) via [Mongoose](https://mongoosejs.com/) (Globally cached connection for serverless execution)
- **Authentication**: Custom JWT implementation using [`jose`](https://github.com/panva/jose) in `httpOnly` cookies + [`bcryptjs`](https://github.com/dcodeIO/bcrypt.js)
- **Validation**: [`zod`](https://zod.dev/) on all API inputs and route handlers
- **Icons**: [`lucide-react`](https://lucide.dev/)

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: v18.18+ or v20+ (Node v24 is fully supported)
- **npm**: v9+
- A free **MongoDB Atlas** cluster or a local MongoDB database instance.

### 2. Clone and Install Dependencies
```bash
git clone <your-repo-url>
cd "Anonymous Text"
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in the required variables:
```env
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/anonymous_text?retryWrites=true&w=majority"
JWT_SECRET="your-32-character-long-secret-key-goes-here!"
ADMIN_PASSWORD="Admin@ChangeMe123!"
```

### 4. Seed the Administrator Account
Run the automated seed script to provision the default administrator:
```bash
npm run seed:admin
```
Default credentials:
- **Email**: `admin@example.com`
- **Username**: `admin`
- **Password**: Value of `ADMIN_PASSWORD` (defaults to `Admin@123456`)

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ How to Create a MongoDB Atlas Cluster (Step-by-Step)

1. **Sign Up / Log In**: Visit [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and register for a free account.
2. **Create an Organization / Project**: Name your project (e.g. `AnonymousText`).
3. **Deploy a Free Cluster (M0)**:
   - Click **Create Deployment**.
   - Choose the **M0 Free** tier.
   - Select your preferred cloud provider (AWS/GCP) and region closest to your users.
   - Click **Create**.
4. **Configure Database Access (User Credentials)**:
   - In the left sidebar, click **Database Access** under **Security**.
   - Click **Add New Database User**.
   - Choose **Password** authentication.
   - Username: e.g., `app_user`
   - Password: Click **Autogenerate Secure Password** and copy it.
   - Database User Privileges: Select **Read and write to any database**.
   - Click **Add User**.
5. **Configure Network Access (IP Whitelist)**:
   - In the left sidebar, click **Network Access** under **Security**.
   - Click **Add IP Address**.
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`) so Vercel serverless functions can connect.
   - Click **Confirm**.
6. **Obtain Connection String**:
   - In the left sidebar, click **Database**.
   - Click **Connect** on your cluster.
   - Select **Drivers** (Node.js).
   - Copy the connection URI:
     ```
     mongodb+srv://app_user:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your database user password and append the database name `anonymous_text`:
     ```
     mongodb+srv://app_user:YourPass123@cluster0.xxxx.mongodb.net/anonymous_text?retryWrites=true&w=majority
     ```
   - Paste this into your `MONGODB_URI` environment variable.

---

## 📤 How to Push to GitHub

1. Initialize Git in the project root (if not already initialized):
   ```bash
   git init
   ```
2. Verify that `node_modules` and `.env*.local` are in `.gitignore`.
3. Stage all files:
   ```bash
   git add .
   ```
4. Commit your changes:
   ```bash
   git commit -m "feat: complete production-ready Anonymous Text web app"
   ```
5. Create a new repository on [GitHub](https://github.com/new) (e.g., `anonymous-text`).
6. Link the local repository and push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/anonymous-text.git
   git push -u origin main
   ```

---

## ☁️ Step-by-Step Vercel Deployment

1. **Sign in to Vercel**: Go to [vercel.com](https://vercel.com/) and sign in with your GitHub account.
2. **Import Repository**:
   - Click **Add New...** -> **Project**.
   - Select your `anonymous-text` GitHub repository and click **Import**.
3. **Configure Project Settings**:
   - **Framework Preset**: Next.js (automatically detected).
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. **Add Environment Variables**:
   Under **Environment Variables**, add the following:
   - `MONGODB_URI`: Your MongoDB Atlas connection URI string.
   - `JWT_SECRET`: A secure 32+ character random secret string (e.g., generated with `openssl rand -hex 32`).
   - `ADMIN_PASSWORD`: Your desired administrator seed password.
   - `NODE_ENV`: `production`
5. **Deploy**:
   - Click **Deploy**.
   - Vercel will build the Next.js App Router project and publish it to a global edge CDN.
6. **Run Initial Admin Seed**:
   You can run `npm run seed:admin` once locally with your remote `MONGODB_URI` set in `.env.local` to seed the admin account into your MongoDB Atlas database.
7. **Verify**: Open your Vercel deployment URL (e.g. `https://anonymous-text.vercel.app`) and test registration and administrator login!

---

## 🔒 Security Architecture Highlights

1. **No Recipient Sender Leakage**:
   - The message recipient endpoint (`GET /api/messages` and `GET /api/messages/[id]`) applies strict projections (`select('_id content isRead parentId createdAt')`) and constructs explicit DTOs.
   - `senderId` is never returned in client responses.
2. **XSS Protection**:
   - All user inputs are sanitized and rendered directly through React JSX escaping.
   - `dangerouslySetInnerHTML` is never used.
3. **HTTP-Only, SameSite Cookies**:
   - Authentication tokens are stored inside `httpOnly`, `SameSite=Lax`, and `Secure` cookies, safeguarding against client-side script theft.
4. **Rate Limiting**:
   - In-memory rate limiting guards `/api/auth/login` (10 requests/min) and `/api/messages` (20 requests/min).
5. **Comprehensive Input Validation**:
   - Strict Zod schemas guard every route handler against malformed payloads and injection attacks.

