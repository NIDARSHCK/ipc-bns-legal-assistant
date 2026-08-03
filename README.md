# NyayaSetu IPC-BNS Legal Assistant

Full-stack legal-tech app for the Indian Penal Code to Bharatiya Nyaya Sanhita transition.

## Stack

- Frontend: React + Vite, custom CSS component system, Supabase Auth client
- Backend: Python FastAPI
- Auth and history: Supabase
- Vector search: Pinecone integrated embedding index
- LLM: Groq OpenAI-compatible chat API
- Deployment targets: Vercel frontend, Render backend

The app also includes a local demo mode. If Supabase, Pinecone, or Groq keys are missing, you can still sign in with demo mode, ask questions, get structured mapping-backed answers, and see in-memory chat history for the current backend run.

## Local Run

Backend:

```bash
cd backend
copy .env.example .env
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase_setup.sql` in the SQL editor.
3. Add these backend variables on Render or `backend/.env` locally:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Add these frontend variables on Vercel or `frontend/.env` locally:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. Seed mapping rows:

```bash
cd backend
python seed_mappings.py
```

6. Create your first user from the app, then optionally mark it admin:

```sql
update public.profiles set role = 'admin' where email = 'your-email@example.com';
```

## Pinecone Ingestion

Create or let the script create a Pinecone integrated embedding index. Then ingest the provided legal PDFs:

```bash
cd backend
python ingest.py --file "C:\Users\lenovo\Downloads\a202345.pdf" --act bns
python ingest.py --file "C:\Users\lenovo\Downloads\repealedfileopen.pdf" --act ipc
```

Required variables:

- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME`
- `PINECONE_CLOUD`
- `PINECONE_REGION`
- `PINECONE_EMBED_MODEL`

## Render Backend Deployment

1. Create a Render Web Service from this repo.
2. Root directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add all backend environment variables from `backend/.env.example`.
6. Set `ALLOWED_ORIGINS` to your Vercel URL, for example:

```text
https://your-vercel-app.vercel.app
```

Use comma-separated origins for preview or local origins.

## Vercel Frontend Deployment

1. Create a Vercel project.
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add:
   - `VITE_API_BASE_URL=https://your-render-service.onrender.com`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

## Smoke Test

1. Sign up or use demo mode.
2. Ask: `What is the BNS equivalent of IPC 420 cheating?`
3. Confirm answer, legal era, source citations, and saved history.
4. Open Section Mapping and search `murder`, `420`, `theft`, and `defamation`.
5. Confirm backend `/health`, `/mapping`, and `/chat` work from the deployed frontend origin.
