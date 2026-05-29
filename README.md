# FocusTube 🎯
Distraction-free YouTube learning. No recommendations. No comments. No rabbit holes.

## Pages
| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | Sign in |
| `/signup` | Public | Create account |
| `/library` | Protected | Your video library |
| `/watch/[id]` | Protected | Distraction-free player |
| `/completed` | Protected | Finished videos |
| `/notes` | Protected | All your notes |

## Setup

### 1. Get a YouTube API Key
1. Go to https://console.cloud.google.com
2. Create a project → APIs & Services → Library → YouTube Data API v3 → Enable
3. Credentials → Create Credentials → API Key → copy it

### 2. Configure environment
```bash
cp .env.local.example .env.local
```
Edit `.env.local`:
```
YOUTUBE_API_KEY=AIza...your_key
JWT_SECRET=any-long-random-string-you-choose
```

### 3. Install and run
```bash
npm install
npm run dev
```
Open http://localhost:3000

## How auth works
- Signup/login creates a JWT stored as an **httpOnly cookie** (7-day expiry)
- `middleware.js` checks the cookie on every request to protected routes
- Unauthenticated users are redirected to `/login?from=<original-path>`
- Users are stored in `data/users.json` (swap for a real DB later)
- Passwords are hashed with **bcryptjs** (12 rounds)

## Project structure
```
FocusTube/
├── middleware.js          # Route protection
├── data/users.json        # User store (gitignore this in production)
├── lib/
│   ├── auth.js            # JWT sign/verify, password hashing
│   ├── users.js           # User CRUD (JSON file)
│   └── storage.js         # localStorage helpers (client-side)
├── app/
│   ├── page.js            # Landing page (public)
│   ├── login/             # Sign in
│   ├── signup/            # Create account
│   ├── library/           # Video library (protected)
│   ├── watch/[videoId]/   # Player (protected)
│   ├── completed/         # Completed videos (protected)
│   ├── notes/             # All notes (protected)
│   └── api/
│       ├── auth/login/    # POST - authenticate
│       ├── auth/signup/   # POST - create account
│       ├── auth/logout/   # POST - clear cookie
│       ├── search/        # GET - YouTube search
│       └── video/         # GET - single video details
└── components/
    ├── AuthForm.jsx        # Shared login/signup form
    ├── Navbar.jsx
    ├── Sidebar.jsx
    ├── VideoCard.jsx
    ├── SearchModal.jsx
    └── NotesPanel.jsx
```

## Version 1.0

Focus-Tube / Focusflow v1.0 is the initial public release. Highlights:

- Resume playback at the exact timestamp you left (local storage + server sync)
- Per-user notes with timestamps saved to the server
- Library to save and track videos, mark complete
- Simple auth (JWT cookie), MongoDB-backed server storage for notes/progress

### Quick start (dev)

```bash
npm install
npm run dev
```

Environment variables used by the project (examples):

```
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=focusflow
JWT_SECRET=replace-with-secure-secret
YOUTUBE_API_KEY=your_key_here
```

### Notes about progress persistence
- Client-side `lib/storage.js` still persists locally (fallback)
- Server-side per-user progress is stored in the `progress` collection. Consider adding an index:

```js
db.progress.createIndex({ user_id: 1, video_id: 1 }, { unique: true })
```

If you'd like, I can add a migration script to create that index and commit it.
