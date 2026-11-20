# Zenshin Monitor

Read-only Ninja Zenshin clan monitor. Node 22+, npm install, copy .env.example to .env.local, npm run dev. npm test runs parser tests.

## Supabase setup
Create a dedicated Supabase project. Run database/schema.sql followed by database/optimized_snapshots.sql in SQL Editor on the new database. Set SUPABASE_URL and legacy SUPABASE_SERVICE_ROLE_KEY server-side, plus ZENSHIN_SEASON and a random SYNC_SECRET of at least 32 characters. Never commit secrets. Configure TRACKED_CLAN_IDS. 
With storage configured, the dashboard refresh button reads the latest stored snapshot, not the game. To collect a snapshot, call POST /api/sync?id=3 with Authorization: Bearer <SYNC_SECRET> from a trusted operator client. Without storage configured, dashboard uses manual live reads. No automatic scheduling is enabled. Latest observations are updated on every newer consistent collection; history is saved on changes or after 15 minutes. The progress endpoint uses the last observation at or before each requested window, so gains are estimates when observations are sparse. Retention is pending. Season is explicitly configured, not automatically discovered. No permanent player IDs or stamina are provided. Obtain permission before scheduled polling; cloud source access is not verified.
