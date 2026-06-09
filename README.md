# Campus Connect MERN App

Campus Connect is split into a React + Redux + Vite frontend and a Node/Express backend.

## Features

- User signup and login with JWT authentication.
- Course browser using the existing course assets.
- Add and save notes from a logged-in account.
- Uploader can edit or delete their own notes.
- Notes can be released publicly or kept private.
- Public notes are visible to logged-in users; private notes stay visible only to the owner.
- MongoDB support through Mongoose, with local JSON storage fallback when `MONGO_URI` is not set.

## Folder Structure

```
frontend/  React, Redux, Vite app
backend/   Express, MongoDB/Mongoose API
```

## Run Locally

Open two terminals.

Terminal 1:

```bash
cd backend
npm install
npm run dev
```

Backend API: `http://127.0.0.1:5000`

Terminal 2:

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://127.0.0.1:5173`

Yes, it is `npm run dev` for both folders, but you run it separately inside each folder.

## MongoDB Setup

Copy `backend/.env.example` to `backend/.env` and set:

```bash
MONGO_URI=mongodb://127.0.0.1:27017/campus-connect
JWT_SECRET=your-secret
```

If `MONGO_URI` is missing or MongoDB is unavailable, the backend stores development data in `backend/server/data/db.json`.

## Useful Scripts

```bash
cd frontend
npm run build

cd ../backend
npm start
```

## Setup Environment Variables

Rename:

- backend/.env.example → backend/.env
- frontend/.env.example → frontend/.env  ##(if present insinde the frontend.)

Then fill the required values.

## Local Database Setup

This project uses a fallback JSON database.

Before running:

1. Navigate to `backend/server/data`
2. Copy `db2.json`
3. Rename the copy to `db.json`

The `db.json` file is ignored by Git and stores local runtime data.
