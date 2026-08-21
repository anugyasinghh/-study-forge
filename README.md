# Study Forge — Full Stack

A polished student study-room app with:
- Registration + login
- JWT authentication
- MongoDB Atlas persistence
- Personal sticky notes
- Personal subject timers
- Local whiteboard
- Responsive black-and-white UI
- Vercel frontend + Render/Node backend deployment support

## Project structure

```text
study-forge/
├── frontend/
│   ├── api/[...path].js
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   ├── vercel.json
│   └── .gitignore
├── backend/
│   ├── middleware/auth.js
│   ├── models/User.js
│   ├── models/Note.js
│   ├── models/Timer.js
│   ├── routes/auth.js
│   ├── routes/notes.js
│   ├── routes/timers.js
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
└── README.md
```

## The only setup you need

### 1. Open the project
Unzip this folder and open **`study-forge`** in VS Code.

### 2. Backend install
Open a VS Code terminal:

```bash
cd backend
npm install
```

Create a file named **`.env`** inside `backend` by copying `.env.example` and fill in:

```env
PORT=5000
MONGO_URI=YOUR_MONGODB_ATLAS_CONNECTION_STRING
JWT_SECRET=YOUR_LONG_RANDOM_SECRET
FRONTEND_URL=http://localhost:5500
```

### 3. Run the backend

```bash
npm run dev
```

You should see MongoDB connected and the API on:
`http://localhost:5000`

### 4. Run the frontend locally

The easiest VS Code method is to open `frontend/index.html` with the **Live Server** extension.
It will normally open around:
`http://127.0.0.1:5500`

The frontend automatically uses `http://localhost:5000/api` locally.

### 5. Deploy

**Backend:** Create a Render Web Service from `study-forge/backend`.
- Build command: `npm install`
- Start command: `npm start`
- Add environment variables: `MONGO_URI`, `JWT_SECRET`, and `FRONTEND_URL`.

**Frontend:** Import the repository into Vercel and set the project root to `frontend`.
Add one Vercel environment variable:

```text
BACKEND_URL=https://YOUR-RENDER-BACKEND-URL
```

Redeploy. The included Vercel proxy means the frontend continues using `/api` and you do not have to edit the JavaScript after deployment.

## GitHub
Push the entire `study-forge` folder as one repository. Do not upload `backend/.env` — it is ignored by Git.

## Important

The whiteboard is intentionally local-browser storage. Notes and timers are account-based and stored in MongoDB.
