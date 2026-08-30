# Supabase Edge Function: AI Risk Assistant (Google Gemini 2.5 Flash Proxy)

This Supabase Edge Function acts as a secure server-side proxy between the Finance Risk Analytics frontend and the Google Gemini API.

## Security Architecture
- The frontend (deployed on static GitHub Pages) **NEVER** holds or exposes the Gemini API key.
- The Edge Function reads the API key securely from server-side environment secrets: `Deno.env.get("GEMINI_API_KEY")`.
- All requests are authenticated with the standard Supabase project URL and anon public key.

---

## How to Get & Set Your Free Google Gemini API Key

### Step 1: Get Free Gemini API Key from Google AI Studio
1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **"Get API Key"** in the top navigation or sidebar.
4. Click **"Create API Key"** (select an existing Google Cloud project or create a new free one).
5. Copy the generated API key (starts with `AIzaSy...`).

---

### Step 2: Set the Secret in Supabase

#### Option A: Via Supabase Web Dashboard (Easiest)
1. Go to your [Supabase Project Dashboard](https://supabase.com/dashboard/project/pxxqrrnpbpldyslseegy).
2. In the left sidebar, navigate to **Project Settings** -> **Edge Functions**.
3. Under **Function Secrets**, click **"Add new secret"**.
4. Set Name: `GEMINI_API_KEY`
5. Set Value: Paste your key (`AIzaSy...`).
6. Click **Save**.

#### Option B: Via Supabase CLI
```bash
supabase secrets set GEMINI_API_KEY=AIzaSyYourKeyHere
supabase functions deploy ai-assistant
```

---

## Endpoint Specification
- **URL**: `https://pxxqrrnpbpldyslseegy.supabase.co/functions/v1/ai-assistant`
- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <SUPABASE_ANON_KEY>`
- **Request Body**:
```json
{
  "prompt": "What is my current DTI risk and how can I lower it?",
  "user_context": {
    "personal": { ... },
    "portfolio": { ... },
    "credit": { ... }
  }
}
```
- **Response**:
```json
{
  "reply": "Your current DTI ratio is 28.5%...",
  "model": "gemini-2.5-flash",
  "grounded": true,
  "status": "success"
}
```
