# Silent Partner (devHacks 2026 Project) — LinkedIn Data Receiver

A lightweight service that receives LinkedIn-related payloads, validates/transforms them, and forwards them into the Silent Partner system for storage and analysis. This keeps ingestion isolated from the main app so it can scale independently and remain resilient to bursts of incoming events.
It also has an AI agent for matching people with each other.

## Tech Stack
- Node.js
- TypeScript
- Firebase
- Webhooks / HTTP endpoints

## Related Repositories
- LinkedIn data receiver (this repo): https://github.com/Arobce/silentpartner-linkedin-data-reciever
- Main app: https://github.com/DevKS-07/uofm-silent-partner
- Dashboard: https://github.com/Arobce/silentpartner-dashboard
