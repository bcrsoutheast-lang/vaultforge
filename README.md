# VaultForge Mobile Upload Build

This is a lean, mobile-upload-friendly VaultForge V1 rebuild designed so you can bulk upload to GitHub instead of editing one file at a time.

## What is included
- Premium dark/gold homepage
- Simple dashboard shell
- One smart submission form
- State network stats cards for GA / TN / FL
- Member directory shell
- Billing page with Stripe link hook
- Routing preview logic
- Supabase client file
- Starter schema

## Fast setup
1. Upload this whole project to a new GitHub repo.
2. In Vercel, import the repo.
3. Add the variables from `.env.example`.
4. Connect your real Supabase tables in `lib/supabase-queries.ts`.
5. Replace demo counts with live counts.
6. Replace the Stripe payment link.

## Recommended repo
Create a fresh repo like `vaultforge-v1`.
Do not mix this into the old broken patchwork build.

## Mobile-friendly upload
- Download the zip from ChatGPT.
- Open the Files app.
- Tap the zip once to unzip it.
- In GitHub, upload the unzipped project files in one batch.

## Important
This package is intentionally lean. It gives you a premium foundation and the right structure for a real launch. It does not guess your live Supabase column names.
