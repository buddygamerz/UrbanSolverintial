# UrbanSolver Frontend

Next.js 14 frontend for the UrbanSolver civic infrastructure intelligence platform.

## Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local  # Create if needed
npm run dev
```

## Development

- Start dev server: `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm start`
- Lint: `npm run lint`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |
| `NEXT_PUBLIC_MAP_STYLE` | MapLibre style URL | `https://demotiles.maplibre.org/style.json` |

## Project Structure

```
app/
├── api/              # API routes (Next.js route handlers)
├── components/       # React components
├── lib/              # Utilities and API client
├── explore/          # Explore page with map
├── report/           # Report issue page
├── projects/         # Projects listing page
├── issues/[id]/      # Issue detail page
├── layout.tsx        # Root layout
├── page.tsx          # Home page
└── globals.css       # Global styles (Tailwind)
```

## Key Components

- `Map` - Interactive MapLibre GL map with markers
- `Sidebar` - Filterable list of reports/issues/projects
- `ReportCard` - Display card for reports, issues, projects

## Map Integration

Uses MapLibre GL JS with OpenStreetMap tiles. Configure map style via `NEXT_PUBLIC_MAP_STYLE`.

## API Client

Centralized in `lib/api.ts` with typed interfaces for all entities.

## Styling

Tailwind CSS with custom color palette for severity levels:
- Critical: Red (`#991b1b`)
- High: Red (`#ef4444`)
- Moderate: Yellow (`#f59e0b`)
- Low: Green (`#22c55e`)