# 🟣 PulseBoard — Real-Time Collaborative Task Manager

A Kanban-style task board where every drag, comment, and status change syncs
**instantly** across all connected users via WebSockets. Built with the MERN
stack + Socket.io, JWT auth with role-based access control, a live activity
feed, in-app notifications, and a classic light/dark theme.

<p align="center">
  <em>React · Node · Express · MongoDB · Socket.io · JWT · Tailwind CSS · Framer Motion</em>
</p>

---

## ✨ Features

- **Real-time Kanban** — drag & drop cards between columns; moves broadcast to
  everyone on the board through Socket.io **WebSocket rooms** (one room per board).
- **JWT authentication** with **role-based access control** (Admin / Member),
  **per-board permissions**, and **protected client-side routes**.
- **Live activity feed** — task creation, moves, assignments and comments appear
  instantly, no refresh.
- **In-app notifications** — get alerted when a task is assigned to you, its
  status changes, or someone comments on it.
- **Live presence** — see who else is currently viewing a board.
- **Comments** on every task, in real time.
- **Classic light & dark themes** — muted, professional palette (no neon), with
  smooth transitions everywhere (Framer Motion).
- **Invite codes** — share a board with a code, or add members by email.

---

## 🧱 Tech stack

| Layer      | Tech                                                          |
| ---------- | ------------------------------------------------------------ |
| Frontend   | React 18, Vite, React Router, Tailwind CSS, Framer Motion, `@hello-pangea/dnd`, socket.io-client, axios |
| Backend    | Node.js, Express, Socket.io, Mongoose, JWT, bcrypt           |
| Database   | MongoDB (local or free MongoDB Atlas)                        |

---

## 📁 Project structure

```
pulseboard/
├── server/                 # Express + Socket.io API
│   ├── src/
│   │   ├── config/db.js
│   │   ├── models/         # User, Board, Task, Comment, Activity, Notification
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/     # auth (JWT + RBAC), error handling
│   │   ├── socket/         # Socket.io rooms, presence, broadcasts
│   │   ├── utils/          # token + event helpers
│   │   ├── seed.js         # demo data
│   │   └── server.js
│   └── .env.example
└── client/                 # React (Vite) app
    ├── src/
    │   ├── context/        # Auth, Theme, Socket providers
    │   ├── components/     # Navbar, Kanban, ActivityFeed, modals, UI kit
    │   ├── pages/          # Login, Register, Dashboard, BoardView
    │   └── lib/            # axios, socket, formatters
    └── .env.example
```

---

## 🚀 Run it locally

You need **Node.js 18+** and a **MongoDB** connection string (local install or a
free Atlas cluster — see below).

### 1. Backend

```bash
cd server
npm install
cp .env.example .env        # then edit .env (Windows: copy .env.example .env)
npm run seed                # loads demo users, a board and tasks
npm run dev                 # starts API on http://localhost:5000
```

### 2. Frontend (in a second terminal)

```bash
cd client
npm install
npm run dev                 # starts the app on http://localhost:5173
```

Open **http://localhost:5173** and sign in with a demo account 👇

### 🔑 Demo accounts (password: `password123`)

| Email                   | Name         | Role   |
| ----------------------- | ------------ | ------ |
| `admin@pulseboard.dev`  | Alex Rivera  | Admin  |
| `maya@pulseboard.dev`   | Maya Chen    | Member |
| `dev@pulseboard.dev`    | Jordan Lee   | Member |

> 💡 **See real-time in action:** open the app in two browser windows, log in as
> two different users, open the same board, and drag a card in one window —
> watch it move in the other instantly.

---

## 🍃 Free MongoDB in the cloud (MongoDB Atlas)

Atlas gives you a **free forever M0 cluster** (512 MB) — perfect for this app.

1. Go to **https://www.mongodb.com/cloud/atlas/register** and create an account.
2. **Create a Deployment** → choose the **M0 (Free)** tier → pick a cloud
   provider/region near you → **Create**.
3. **Create a database user:** Security → *Database Access* → *Add New Database
   User* → set a username + password (save them).
4. **Allow network access:** Security → *Network Access* → *Add IP Address* →
   **Allow access from anywhere** (`0.0.0.0/0`) for now (tighten later).
5. **Get the connection string:** *Database* → *Connect* → *Drivers* → copy the
   URI. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Put it in `server/.env` as `MONGODB_URI`, adding the database name
   (`pulseboard`) before the `?`:
   ```
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/pulseboard?retryWrites=true&w=majority
   ```
7. Run `npm run seed` again to populate your Atlas database.

---

## 🌍 Deploy it live (100% free tiers)

The cleanest free split: **API on Render**, **client on Vercel**, **DB on Atlas**.

### Step 1 — Database
Use the **MongoDB Atlas** URI from the section above.

### Step 2 — Backend on Render (free Web Service)

1. Push this repo to GitHub.
2. On **https://render.com** → *New* → *Web Service* → connect your repo.
3. Configure:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add **Environment Variables**:
   | Key              | Value                                             |
   | ---------------- | ------------------------------------------------- |
   | `MONGODB_URI`    | your Atlas connection string                      |
   | `JWT_SECRET`     | a long random string                              |
   | `NODE_ENV`       | `production`                                       |
   | `CLIENT_URL`     | your Vercel URL (add after Step 3, e.g. `https://pulseboard.vercel.app`) |
5. Deploy. Note the API URL, e.g. `https://pulseboard-api.onrender.com`.

> Render's free tier supports WebSockets, so Socket.io works out of the box.
> (Free instances sleep after inactivity and take ~30s to wake on first request.)

### Step 3 — Frontend on Vercel (free)

1. On **https://vercel.com** → *Add New Project* → import the repo.
2. Configure:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite (auto-detected)
   - **Build Command:** `npm run build` · **Output Directory:** `dist`
3. Add an **Environment Variable**:
   | Key             | Value                                       |
   | --------------- | ------------------------------------------- |
   | `VITE_API_URL`  | your Render API URL (e.g. `https://pulseboard-api.onrender.com`) |
4. Deploy. Then go back to Render and set `CLIENT_URL` to your Vercel URL so CORS
   and Socket.io accept it. Redeploy the backend.

That's it — your board is live. 🎉

> **Alternative one-platform option:** Railway or Render can host both the API
> and a static site. The Atlas + Render + Vercel split above is the most generous
> free combination.

---

## 🔌 How the real-time layer works

- On login the client opens **one authenticated Socket.io connection** (JWT is
  verified in the socket handshake).
- Opening a board emits `board:join`, placing that socket in the room
  `board:<id>`. Every task/comment/activity mutation on the REST API broadcasts
  to that room, so only people viewing the board receive updates.
- Each user also has a personal room `user:<id>` used to deliver notifications
  across all their tabs/devices.
- Drag & drop does an **optimistic** local update for a snappy feel, then the
  server echoes the authoritative move to everyone (including the mover).

---

## 📜 Scripts

**server/**
| Command         | Description                       |
| --------------- | --------------------------------- |
| `npm run dev`   | Start API with nodemon (reload)   |
| `npm start`     | Start API (production)            |
| `npm run seed`  | Reset + load demo data            |

**client/**
| Command           | Description                     |
| ----------------- | ------------------------------- |
| `npm run dev`     | Start Vite dev server           |
| `npm run build`   | Production build → `dist/`      |
| `npm run preview` | Preview the production build    |

---

## 🔐 Roles & permissions (RBAC)

- **Global role** (`admin` / `member`) — the first user to register becomes a
  platform admin.
- **Per-board role** — you can be an *Admin* on one board and a *Member* on
  another. Board admins manage members, roles and settings; the board **owner**
  can delete the board. Task creators (or board admins) can delete tasks.
- **Protected routes** — the React app guards `/` and `/boards/:id`; the API
  guards every route with JWT middleware and checks board membership on each
  request.

---

Built as a portfolio project to demonstrate real-time full-stack engineering. Enjoy! 🟣
