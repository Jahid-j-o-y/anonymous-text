# Project Report Migration Notes

**Project Title**: Anonymous Text — Safe & Private Anonymous Messaging Platform  
**Course**: Software Engineering Sessional  
**Migration Overview**: This document details the architectural migration of the project from the originally proposed **PHP 8 / MySQL / Apache** stack to a modern, production-ready **Next.js (App Router, Full-Stack JavaScript) / MongoDB Atlas / Tailwind CSS** stack.

You can directly replace the corresponding chapters and sections in your Software Engineering Project Report with the updated text and diagrams below.

---

## 1. Tools and Technologies (Update for Chapter 2)

### Old Report Text:
> The system is developed using PHP 8.x for server-side logic, MySQL for relational database management, and HTML/CSS/JavaScript for client-side rendering, hosted on an Apache HTTP Server.

### New Report Text (Drop-In Replacement):
> The system is developed using a unified full-stack JavaScript architecture. The front end and back end are integrated using **Next.js (App Router)** with **React 19**, providing server-side rendering (SSR), client-side interactivity, and modular Route Handlers. Data is persisted in a distributed cloud NoSQL database using **MongoDB Atlas** with the **Mongoose** Object Data Modeling (ODM) library. Client-side styling is engineered using **Tailwind CSS**, featuring a modern **White-Green (Cyan-Green)** color palette with an interactive top-right **Dark/Light Mode Switcher**, frosted-glass cards, and an authentic circular brand logo (`logo.png`). Security and validation are enforced at runtime using **Zod** schema validation, **bcryptjs** cryptographic password hashing, and signed **JSON Web Tokens (JWT)** via the **jose** cryptographic library stored in `httpOnly`, `SameSite=Lax`, `Secure` cookies.

### Updated Tools Table

| Category | Technology | Purpose in System |
| :--- | :--- | :--- |
| **Full-Stack Framework** | Next.js 15+ (App Router) | Unified framework for responsive UI pages, SSR, and RESTful Route Handlers (`app/api/*`). |
| **Programming Language** | JavaScript (ES2022+ / Node.js) | Unified language across client components, server route handlers, and database scripts. |
| **Styling & Design System**| Tailwind CSS | Utility-first CSS framework implementing dark violet `#120f26`, frosted glass, and cream paper note UI. |
| **Database** | MongoDB Atlas (Cloud NoSQL) | Scalable, document-oriented database with flexible JSON-like documents and compound indexing. |
| **Object Data Modeling** | Mongoose 9+ | Schema declaration, data validation, lifecycle hooks, and serverless connection caching. |
| **Authentication & Tokens**| jose (JWT) + bcryptjs | Stateless, tamper-proof session tokens stored in secure `httpOnly` cookies; salted password hashing. |
| **Input Validation** | Zod | Runtime schema validation and boundary sanitization for all API requests. |
| **Hosting & CI/CD** | Vercel Edge Network | High-availability global deployment with automated CI/CD directly connected to GitHub. |

---

## 2. Database Design: Relational Tables to MongoDB Collections (Update for Chapter 3)

The relational schema (normalized tables with foreign keys) has been migrated to MongoDB document collections with schema validation and optimized indexing.

### A. `users` Collection
Stores registered user accounts, administrative privileges, and security flags.

```json
{
  "_id": { "$oid": "65f01a2b3c4d5e6f7a8b9c01" },
  "fullName": "Alex Morgan",
  "username": "alex_m",
  "email": "alex@example.com",
  "passwordHash": "$2a$10$e8w.Y7x9H0Zq1kL...",
  "role": "user",
  "isBlocked": false,
  "createdAt": { "$date": "2026-11-10T10:00:00Z" },
  "updatedAt": { "$date": "2026-11-10T10:00:00Z" }
}
```
- **Indexes**:
  - `{ username: 1 }` (Unique)
  - `{ email: 1 }` (Unique)
  - `{ role: 1 }`, `{ isBlocked: 1 }`

---

### B. `messages` Collection
Stores anonymous notes sent between users.
> **Privacy Invariant**: When queried by the recipient, `senderId` is strictly stripped using projection.

```json
{
  "_id": { "$oid": "65f01a2b3c4d5e6f7a8b9c02" },
  "senderId": { "$oid": "65f01a2b3c4d5e6f7a8b9c01" },
  "receiverId": { "$oid": "65f01a2b3c4d5e6f7a8b9c03" },
  "parentId": null,
  "content": "You did a fantastic job on the software architecture slides!",
  "isRead": true,
  "isDeleted": false,
  "createdAt": { "$date": "2026-11-10T10:15:00Z" },
  "updatedAt": { "$date": "2026-11-10T10:16:30Z" }
}
```
- **Indexes**:
  - `{ receiverId: 1, createdAt: -1 }` (Compound index for fast inbox queries)
  - `{ senderId: 1 }`
  - `{ parentId: 1 }`

---

### C. `reports` Collection
Stores user reports submitted against inappropriate or offensive messages.

```json
{
  "_id": { "$oid": "65f01a2b3c4d5e6f7a8b9c04" },
  "messageId": { "$oid": "65f01a2b3c4d5e6f7a8b9c02" },
  "reporterId": { "$oid": "65f01a2b3c4d5e6f7a8b9c03" },
  "reason": "Harassment and offensive language violating code of conduct",
  "status": "pending",
  "createdAt": { "$date": "2026-11-10T10:20:00Z" },
  "updatedAt": { "$date": "2026-11-10T10:20:00Z" }
}
```
- **Indexes**:
  - `{ status: 1, createdAt: -1 }`
  - `{ messageId: 1 }`
  - `{ reporterId: 1 }`

---

### D. `blocks` Collection
Maintains one-way blocking relationships between recipients and abusive senders.

```json
{
  "_id": { "$oid": "65f01a2b3c4d5e6f7a8b9c05" },
  "blockerId": { "$oid": "65f01a2b3c4d5e6f7a8b9c03" },
  "blockedSenderId": { "$oid": "65f01a2b3c4d5e6f7a8b9c01" },
  "createdAt": { "$date": "2026-11-10T10:20:00Z" },
  "updatedAt": { "$date": "2026-11-10T10:20:00Z" }
}
```
- **Indexes**:
  - `{ blockerId: 1, blockedSenderId: 1 }` (**Unique Compound Index** to prevent redundant block records)

---

## 3. Project Structure Tree (Update for Chapter 4)

```
anonymous-text/
├── app/                              # Next.js App Router root
│   ├── admin/
│   │   ├── reports/page.jsx          # Admin: pending moderation queue
│   │   └── users/page.jsx            # Admin: user directory with block toggle
│   ├── api/
│   │   ├── admin/
│   │   │   ├── reports/route.js      # GET pending reports
│   │   │   ├── reports/[id]/route.js # PATCH dismiss / delete / block
│   │   │   ├── users/route.js        # GET user list with search
│   │   │   └── users/[id]/toggle-block/route.js # PATCH toggle isBlocked
│   │   ├── auth/
│   │   │   ├── login/route.js        # POST login with rate limit
│   │   │   ├── logout/route.js       # POST clear auth cookie
│   │   │   ├── me/route.js           # GET current session user
│   │   │   ├── password/route.js     # POST change password
│   │   │   └── register/route.js     # POST new user registration
│   │   └── messages/
│   │       ├── route.js              # GET inbox / POST send message
│   │       └── [id]/
│   │           ├── route.js          # GET view note / DELETE soft delete
│   │           ├── block/route.js    # POST block sender
│   │           ├── reply/route.js    # POST reply anonymously
│   │           └── report/route.js   # POST report note
│   ├── compose/page.jsx              # Compose note with live character counter
│   ├── dashboard/page.jsx            # User inbox with glowing unread indicators
│   ├── message/[id]/page.jsx         # Note view, reply, report, block actions
│   ├── password/page.jsx             # User password management
│   ├── register/page.jsx             # Registration page
│   ├── globals.css                   # Tailwind theme styles and button gradients
│   ├── layout.jsx                    # Root layout, fonts (Fraunces & Plus Jakarta Sans)
│   └── page.jsx                      # Login landing page with seal emblem
├── components/
│   ├── BackgroundGlow.jsx            # Violet/pink radial ambient glows
│   ├── Modal.jsx                     # Accessible dialog component
│   ├── Navbar.jsx                    # Responsive header and navigation
│   ├── PaperNote.jsx                 # Authentic Cream Paper Note (#fbf7ef)
│   └── ToastProvider.jsx             # Accessible floating toast notification system
├── lib/
│   ├── badWords.js                   # Leetspeak-normalizing offensive word filter
│   ├── db.js                         # Mongoose connection with serverless global caching
│   ├── jwt.js                        # JOSE JWT generation, verification, and cookies
│   ├── rateLimit.js                  # In-memory sliding window rate limiter
│   ├── utils.js                      # Date formatters and CSS merge utility
│   └── validations.js                # Zod validation schemas
├── models/
│   ├── Block.js                      # Block model and compound index
│   ├── Message.js                    # Message model with receiverId index
│   ├── Report.js                     # Report model
│   ├── User.js                       # User model with unique username/email
│   └── index.js                      # Consolidated models export
├── scripts/
│   └── seed-admin.js                 # Standalone script to provision administrator
├── .env.example                      # Environment variables reference
├── jsconfig.json                     # Path alias mappings (@/*)
├── middleware.js                     # Edge route protection & RBAC
├── package.json                      # Dependencies and scripts
├── README.md                         # Project documentation and deployment guide
└── TESTING.md                        # Formal test plan and manual test cases
```

---

## 4. Key Code Snippets for Report Inclusion (Update for Chapter 5)

### Snippet 1: Globally Cached Serverless Database Connection (`lib/db.js`)
Prevents database connection exhaustion during serverless cold starts on Vercel:
```javascript
import mongoose from "mongoose";

let cached = global.mongooseCache || (global.mongooseCache = { conn: null, promise: null });

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set.");
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { bufferCommands: false, maxPoolSize: 10 });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
```

### Snippet 2: Leetspeak & Repetition Normalization Filter (`lib/badWords.js`)
Normalizes adversarial inputs before comparing against forbidden terms:
```javascript
export function normalizeText(text) {
  let normalized = text.toLowerCase();
  const leetMap = { "0":"o", "1":"i", "3":"e", "4":"a", "5":"s", "7":"t", "@":"a", "$":"s", "!":"i" };
  normalized = normalized.split("").map((c) => leetMap[c] ?? c).join("");
  normalized = normalized.replace(/(.)\1{2,}/g, "$1"); // Collapses 3+ repeats: "fuuuck" -> "fuck"
  const normalizedWithSpaces = normalized.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const normalizedStripped = normalized.replace(/[^a-z0-9]/g, "");
  return { normalizedWithSpaces, normalizedStripped };
}
```

### Snippet 3: Zero-Knowledge Sender Projection (`app/api/messages/route.js`)
Guarantees at the database query level that sender identities cannot leak to recipients:
```javascript
// Exclude senderId from projection and map to explicit DTO
const messages = await Message.find({ receiverId: payload.userId, isDeleted: false })
  .select("_id content isRead parentId createdAt")
  .sort({ createdAt: -1 })
  .lean();

const dtos = messages.map((m) => ({
  id: m._id.toString(),
  content: m.content,
  isRead: Boolean(m.isRead),
  parentId: m.parentId ? m.parentId.toString() : null,
  createdAt: m.createdAt,
}));
```

---

## 5. Security Architecture Comparison Table

| Security Aspect | Legacy PHP / MySQL Implementation | Modern Next.js / MongoDB Implementation |
| :--- | :--- | :--- |
| **Session Storage** | Server-side PHP Session files (`PHPSESSID`) vulnerable to file race conditions. | Stateless signed JWT (`HS256`) stored in `httpOnly`, `SameSite=Lax`, `Secure` cookies. |
| **SQL Injection** | Relies on manual PDO prepared statements (`$stmt->prepare`). | MongoDB BSON query objects and Mongoose type-casting eliminate SQL injection surface. |
| **Input Validation** | Ad-hoc PHP regex and `filter_var` checks scattered across files. | Unified runtime schema validation using `Zod` before database interaction. |
| **Cross-Site Scripting (XSS)** | Manual `htmlspecialchars()` on every output variable. | Automatic contextual HTML escaping in React JSX; `dangerouslySetInnerHTML` forbidden. |
| **Rate Limiting** | Requires custom MySQL logging tables or Redis cache. | In-memory sliding window rate limiter safeguarding `/api/auth/login` and message creation. |

