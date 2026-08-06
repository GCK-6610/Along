# Along - Project Setup & Deployment Guide

This document contains all the steps required to get the Along project running from scratch, including database migrations and AI edge function deployments.

## 1. Local Environment Variables
For the React Native Expo app to communicate with Supabase, you must create a `.env` file in the root of the project with the following keys.

1. Go to your Supabase Dashboard -> **Project Settings** -> **API**.
2. Copy the **Project URL** and the **`anon` `public`** key.
3. Add them to your `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```
> **Security Note:** NEVER put your `service_role` / `secret` key in this file. It is a frontend client, and the secret key bypasses all Row Level Security (RLS) rules.

## 2. Database Migration (Schema Setup)
To set up the tables, Row Level Security (RLS) policies, and database functions:
1. Open the Supabase **SQL Editor** in your dashboard.
2. Copy the entire contents of `supabase/schema.sql`.
3. Paste it into the SQL Editor and click **Run**.
This creates all necessary tables (`profiles`, `plans`, `plan_participants`, `chat_messages`, `sponsored_hotspots`).

## 3. Deploying the AI Edge Function
The "Smart Plan Auto-Fill" feature relies on a secure Supabase Edge Function to communicate with OpenAI. This keeps your OpenAI API keys hidden from the client app.

Run the following commands in your terminal to deploy the function:

1. **Log in to Supabase CLI:**
   ```bash
   npx supabase login
   ```
2. **Link your local project to your live Supabase project:**
   ```bash
   npx supabase link --project-ref your-project-ref-id
   ```
   *(You can find your project ref ID in your Supabase URL: `https://[PROJECT_REF].supabase.co`)*

3. **Set your OpenAI Secret Key:**
   Get this from the [OpenAI Developer Platform](https://platform.openai.com/api-keys) and save it securely to your Supabase cloud environment:
   ```bash
   npx supabase secrets set OPENAI_API_KEY=sk-your-actual-openai-key-here
   ```

4. **Deploy the Edge Function:**
   ```bash
   npx supabase functions deploy parse-plan-text
   ```

## 4. Running the App
Once your environment variables are set and the backend is deployed:
```bash
npx expo start -c
```
*(The `-c` flag clears the cache to ensure your new `.env` variables are picked up.)*
