# TuCuervo Social Suite Setup

## Brand and Positioning

- Primary brand: `TuCuervo`
- Intended use: personal daily operations, product demos, recorded walkthroughs, and client meetings.
- Current commercial posture: polished enough to demonstrate the workflow, the Instagram live connection, and the editorial calendar workflow safely.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- `shadcn/ui`-style component organization
- Server-side Instagram Graph fetches using environment variables
- Server-side RSS aggregation for live niche news
- Local browser persistence for planning, comments, and verified competitor notes

## Live Connection Status

The app now uses live data in these modules:

- `Instagram Manager`: real Instagram profile and posts from Graph API
- `Analytics`: calculated from real Instagram post history returned by the API
- `Content Calendar`: real Instagram published posts plus editable planner items saved locally
- `News Consolidator`: live RSS feeds only, without seeded fallback stories

Environment variables:

```env
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_BUSINESS_ACCOUNT_ID=
FACEBOOK_PAGE_ID=
```

Notes:
- Only `INSTAGRAM_ACCESS_TOKEN` and `INSTAGRAM_BUSINESS_ACCOUNT_ID` are required by the current code.
- `FACEBOOK_PAGE_ID` is included because it is useful for future Instagram/Facebook flows and documentation.
- Never commit real tokens to Git.

## Important Decisions

- Branding was updated to `TuCuervo Social Suite` to make the app presentation-ready.
- Instagram data is fetched only on the server so tokens do not reach the browser bundle.
- The planner is shared between Instagram Manager and Content Calendar through local browser storage.
- Calendar comments are also persisted locally so the daily workflow is usable without adding a database yet.
- Competitor tracking no longer shows fake seeded metrics. It now stores only user-entered public observations and URLs.
- Competitor analytics are not auto-fetched yet because official platform access is inconsistent for third-party competitor insights.

## Git and Deployment

1. Copy `.env.example` to `.env.local`.
2. Add your real Instagram token and business account id.
3. Ensure `.env.local` is ignored by Git.
4. Configure the same variables in your hosting provider before deployment.

## Operational Caveats

- Instagram history depends on what the Graph API returns for the connected account and token scopes.
- RSS requires internet access in the deployed environment.
- Planner items, calendar comments, and competitor observations are stored per browser because there is no shared database yet.

## TikTok Recommendation

Do not connect TikTok in the same release unless you want to spend extra time on a second OAuth and API review cycle right now.

Best path:
1. Ship Instagram first.
2. Validate demos and daily use.
3. Add TikTok as phase two with a dedicated connection/settings flow.