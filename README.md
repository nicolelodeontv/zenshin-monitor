# Zenshin Monitor

Read-only Ninja Zenshin clan profile and progress monitor. No game credentials or game modification.

## Local setup
Node.js 22+, `npm install`, copy `.env.example` to `.env.local`, then `npm run dev`. Run `npm test` for collector validation. Configure `TRACKED_CLAN_IDS` with approved clan IDs. The dashboard reads the public member endpoint on demand; automatic polling is not enabled. Historical persistence and cloud deployment are pending.

Source: `https://ninjazenshin.online/clan-ranking/members/{id}`. IGN is not a permanent identity; no stamina or exact attack data is available. Obtain operator approval before scheduling requests.
