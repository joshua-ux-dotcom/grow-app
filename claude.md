# Grow App – Rules

## Context
React Native + Expo app (vertical video feed).
Backend: Supabase (DB/Auth), Cloudflare R2 (videos/thumbnails).
Videos + thumbnails from R2, metadata in Supabase (videos table, only is_active=true).

---

## Core
- Keep it simple
- No overengineering
- Only do what is requested
- Do not refactor unrelated code

---

## Tech
- Functional components only
- Use hooks
- expo-router navigation
- StyleSheet only (no inline styles)
- Reuse existing components

---

## Structure
/app (screens), /components, /features, /lib  
No new folders unless necessary

---

## Supabase
Use existing tables only:
profiles, videos, video_bookmarks, video_ratings, video_views, feedback, beta_access_codes

- No schema changes
- No new tables
- Never expose service role key

Auth:
- profiles.id = auth.users.id
- Use real user data only

---

## Video System
- No local video assets
- Always use R2 URLs
- Use thumbnail_url
- Only load is_active=true

---

## Features
Feed:
- Vertical, autoplay, pause on long press, reset on leave

Saved:
- video_bookmarks, must sync with feed

Ratings:
- 👎 👍 🔥 via video_ratings

Feedback:
- Supabase, image optional

---

## UI
- Dark mode only
- Minimal, clean
- Smooth + responsive interactions

---

## Language
- Code: English only
- Explanations: German

---

## Safety
- Do not silently change working code
- Explain changes before applying
- Prefer small changes
- Do not overwrite without permission
- For bigger changes: suggest new Git branch
- Use copy only if explicitly requested

---

## Behavior
- Be precise, minimal
- Do not guess → ask
- Follow instructions exactly