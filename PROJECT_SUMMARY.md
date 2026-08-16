# UrbanSolver - Project Summary

## Overview
UrbanSolver is an AI-powered civic infrastructure intelligence platform that transforms citizen observations into verified, location-aware, evidence-backed civic issues with transparent accountability.

## Project Structure (74 files)

```
UrbanSolver/
├── docker-compose.yml          # Service orchestration (PostgreSQL+PostGIS, Redis, Backend, Frontend, Worker)
├── docker-compose.override.yml # Local overrides (optional)
├── .env                        # Environment variables (local)
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
├── README.md                   # Main documentation
├── Makefile                    # Development commands
├── start.bat                   # Windows startup script
├── start.sh                    # Linux/macOS startup script
│
├── backend/                    # FastAPI Backend
│   ├── Dockerfile              # Backend container
│   ├── requirements.txt        # Python dependencies
│   ├── pytest.ini              # Test configuration
│   ├── README.md               # Backend docs
│   ├── alembic.ini             # Migration config
│   ├── alembic/
│   │   ├── env.py              # Migration environment
│   │   └── versions/           # Migration files
│   └── app/
│       ├── __init__.py
│       ├── main.py             # FastAPI app entry
│       ├── database.py         # SQLAlchemy async setup
│       ├── models.py           # SQLAlchemy models (11 tables)
│       ├── schemas.py          # Pydantic schemas
│       ├── celery_app.py       # Celery configuration
│       ├── ai/
│       │   ├── __init__.py
│       │   ├── config.py       # Model configuration & routing
│       │   ├── router.py       # Model router & AI functions
│       │   └── rag.py          # RAG service for gov documents
│       ├── routers/
│       │   ├── __init__.py
│       │   ├── reports.py      # Report CRUD endpoints
│       │   ├── issues.py       # Issue CRUD endpoints
│       │   ├── projects.py     # Project CRUD endpoints
│       │   └── ai.py           # AI analysis endpoints
│       └── tasks/
│           ├── __init__.py
│           ├── report_tasks.py # Report processing tasks
│           └── ai_tasks.py     # AI analysis tasks
│
├── frontend/                   # Next.js 14 Frontend
│   ├── Dockerfile              # Frontend container
│   ├── package.json            # Dependencies
│   ├── tsconfig.json           # TypeScript config
│   ├── next.config.js          # Next.js config
│   ├── tailwind.config.js      # Tailwind config
│   ├── postcss.config.js       # PostCSS config
│   ├── .eslintrc.js            # ESLint config
│   ├── .env.local              # Frontend env vars
│   ├── next-env.d.ts           # TypeScript declarations
│   ├── README.md               # Frontend docs
│   └── app/
│       ├── globals.css         # Global styles (Tailwind)
│       ├── layout.tsx          # Root layout
│       ├── page.tsx            # Home page with hero & map
│       ├── api/
│       │   └── reports/route.ts # Next.js API proxy
│       ├── components/
│       │   ├── index.ts        # Component exports
│       │   ├── Map.tsx         # MapLibre GL map component
│       │   ├── ReportCard.tsx  # Report/Issue/Project cards
│       │   └── Sidebar.tsx     # Filterable sidebar
│       ├── lib/
│       │   └── api.ts          # Typed API client
│       ├── explore/page.tsx    # Explore page with map & sidebar
│       ├── report/page.tsx     # Multi-step report form
│       ├── projects/page.tsx   # Projects listing
│       └── issues/[id]/page.tsx # Issue detail page
│
└── database/
    └── init.sql                # PostGIS schema + demo data (Bengaluru)
```

## Key Features Implemented

### 1. Citizen Reporting System
- Multi-step report form (Category → Location → Photo → Impact → Submit)
- GPS auto-detection with manual override
- Image upload with preview
- AI-assisted classification (category, severity)

### 2. Interactive Map (MapLibre GL + OpenStreetMap)
- Report markers with severity colors
- Issue clusters with recurrence count
- Project markers with status
- City selector (Bengaluru, Mumbai, Delhi, Hyderabad, Chennai)
- Legend and map controls

### 3. Issue Management
- Automatic clustering of nearby reports
- Priority scoring (severity × recurrence × population × duration)
- Status tracking (open → in_progress → resolved → verified)
- Public timeline/history

### 4. Government Projects
- Project CRUD with geographic coverage
- Stated objectives and documents
- Impact analysis (intended purpose, gaps, unintended consequences)
- AI-generated recommendations

### 5. AI Services (Model Router Architecture)
- **Small model** (classification, summarization, metadata extraction)
- **Medium model** (RAG answers, issue clustering)
- **Large model** (urban planning analysis, recommendations)
- **Vision model** (image analysis)
- **Embedding model** (duplicate detection, RAG)
- Fallback chain: small → medium → large
- Provider support: Ollama (local), OpenAI, vLLM

### 6. RAG System
- Government document ingestion
- Vector similarity search
- Cited answers with source references
- Sample documents: BBMP drain DPR, MG Road tender, Silk Board EIA

### 7. Background Processing (Celery)
- Report classification & image analysis
- Issue clustering & priority updates
- Project impact analysis
- Periodic RAG index refresh

### 8. Database (PostgreSQL + PostGIS)
- 11 core tables with proper relationships
- Spatial indexes for location queries
- Demo data for Bengaluru (5 locations, 5 reports, 3 issues, 3 projects)
- PostGIS geography types for distance queries

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, MapLibre GL JS |
| Backend | FastAPI, SQLAlchemy 2.0 (async), Pydantic v2 |
| Database | PostgreSQL 16, PostGIS 3.4 |
| Cache/Queue | Redis 7, Celery |
| AI | OpenAI-compatible router, Ollama/vLLM local models |
| Maps | OpenStreetMap, MapLibre GL JS |
| Containerization | Docker Compose |

## API Endpoints

### Reports
- `POST /reports/` - Create report
- `GET /reports/` - List reports
- `GET /reports/{id}` - Get report

### Issues
- `POST /issues/` - Create issue
- `GET /issues/` - List issues
- `GET /issues/{id}` - Get issue

### Projects
- `POST /projects/` - Create project
- `GET /projects/` - List projects
- `GET /projects/{id}` - Get project

### AI
- `POST /ai/analyze-image` - Analyze image
- `POST /ai/classify-report` - Classify text
- `POST /ai/analyze-project-impact` - Project impact
- `POST /ai/generate-recommendations` - Interventions
- `POST /ai/rag/query` - RAG query

## Development Commands

```bash
# Start all services
make start          # or ./start.bat on Windows

# View logs
make logs

# Stop services
make stop

# Backend development
make backend-dev
make backend-test
make migrate

# Frontend development
make frontend-dev
make frontend-build

# Database
make db-shell
make db-reset

# Cleanup
make clean
```

## Deployment Notes

1. **Environment Variables**: Copy `.env.example` to `.env` and configure:
   - `DATABASE_URL`, `REDIS_URL`
   - `JWT_SECRET` (required for production)
   - `AI_PROVIDER` (ollama/openai/vllm)
   - `OPENAI_API_KEY` (if using OpenAI)

2. **Local AI Models** (Ollama):
   ```bash
   ollama pull nemotron-3-nano
   ollama pull nemotron-3-medium
   ollama pull llava:13b
   ollama pull nomic-embed-text
   ```

3. **Production Considerations**:
   - Use proper SSL termination (nginx/Traefik)
   - Configure CORS origins
   - Set up monitoring (Prometheus/Grafana)
   - Use managed PostgreSQL (RDS/Cloud SQL)
   - Enable database connection pooling
   - Set up backup strategy

## Next Steps (Phase 2+)

1. **Authentication**: JWT auth, Google OAuth, anonymous reporting
2. **Advanced AI**: Waterlogging analysis, congestion detection, better image classification
3. **Notifications**: Email/push for issue updates
4. **Admin Panel**: Moderation, spam detection, data management
5. **External Integrations**: Government APIs, weather data, traffic feeds
6. **Mobile App**: React Native / Flutter
7. **Analytics**: Dashboard with trends, comparisons, exports
8. **Internationalization**: Multi-language support
9. **Accessibility**: WCAG 2.1 compliance
10. **Performance**: CDN, caching, database optimization

## License
MIT License - Open source civic technology for transparent cities.