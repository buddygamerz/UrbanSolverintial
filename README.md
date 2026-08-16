# UrbanSolver

**UrbanSolver** is an open-source, AI-powered civic infrastructure intelligence platform designed to transform citizen observations into verified, location-aware, evidence-backed civic issues and actionable solutions. The architecture is built for scalability and transparency, supporting cities globally with an initial focus on Indian cities.

## Core Vision
Turn everyday urban problems into structured public records with clear evidence, prioritization, and accountability.

## Primary Features
- Interactive map-first UI with OpenStreetMap/MapLibre
- Citizen reporting system (photo, GPS, description)
- AI-assisted image and issue analysis
- Issue clustering and deduplication
- Priority scoring engine
- Government project integration and impact analysis
- Evidence-based recommendations
- Public accountability timeline

## Technology Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, MapLibre GL JS
- **Backend**: Python FastAPI
- **Database**: PostgreSQL 16 + PostGIS 3.4
- **Cache/Queue**: Redis 7
- **AI**: OpenAI-compatible abstraction, local models via Ollama/vLLM/llama.cpp
- **Background Jobs**: Celery
- **Containerization**: Docker Compose

## Project Structure
```
UrbanSolver/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── ai/             # AI services (router, RAG, config)
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── database.py     # Database connection
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── main.py         # FastAPI app
│   │   ├── routers/        # API routes
│   │   └── tasks/          # Celery background tasks
│   ├── requirements.txt
│   ├── Dockerfile
│   └── alembic/            # Database migrations
├── frontend/               # Next.js frontend
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── lib/              # Utilities
│   ├── package.json
│   └── Dockerfile
├── database/              # Database initialization
│   └── init.sql          # PostGIS schema + demo data
├── docker-compose.yml     # Service orchestration
├── .env.example          # Environment template
└── start.bat / start.sh  # Startup scripts
```

## Quick Start

### Prerequisites
- Docker Desktop / Docker Engine + Docker Compose
- Git (for cloning)

### Windows
```cmd
git clone <repo-url> UrbanSolver
cd UrbanSolver
start.bat
```

### Linux/macOS
```bash
git clone <repo-url> UrbanSolver
cd UrbanSolver
chmod +x start.sh
./start.sh
```

### Manual Docker Compose
```bash
# Start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Access Points
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Documentation | http://localhost:8000/docs |
| Database | postgresql://postgres:postgres@localhost:5432/urbansolver |
| Redis | redis://localhost:6379 |

## Development

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env
# Edit .env with your settings
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local  # Create if needed
npm run dev
```

### Database Migrations
```bash
cd backend
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

## AI Model Configuration

UrbanSolver supports multiple AI providers:

### Local Models (Ollama)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull models
ollama pull nemotron-3-nano
ollama pull nemotron-3-medium
ollama pull llava:13b
ollama pull nomic-embed-text
```

Set in `.env`:
```
AI_PROVIDER=ollama
```

### OpenAI
```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
```

### vLLM
```
AI_PROVIDER=vllm
# Start vLLM server separately
```

## Demo Data
The database initializes with sample data for Bengaluru:
- 5 locations (Majestic, MG Road, Cubbon Park, Silk Board, Koramangala)
- 5 citizen reports (waterlogging, pothole, footpath, congestion, drainage)
- 3 clustered issues
- 3 government projects (drain upgrade, road resurfacing, grade separator)
- Project impact analysis and recommendations
- Evidence sources

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
- `POST /ai/analyze-image` - Analyze uploaded image
- `POST /ai/classify-report` - Classify report text
- `POST /ai/analyze-project-impact` - Analyze project impact
- `POST /ai/generate-recommendations` - Generate interventions
- `POST /ai/rag/query` - Query RAG system

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://postgres:postgres@db:5432/urbansolver` |
| `REDIS_URL` | Redis connection string | `redis://redis:6379/0` |
| `JWT_SECRET` | JWT signing secret | Required in production |
| `AI_PROVIDER` | Model provider (`openai`, `ollama`, `vllm`) | `ollama` |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `BACKEND_PORT` | Backend port | `8000` |
| `FRONTEND_PORT` | Frontend port | `3000` |

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pytest` (backend), `npm test` (frontend)
5. Submit a pull request

## License
MIT License - see LICENSE file for details.

## Acknowledgments
- OpenStreetMap contributors
- MapLibre GL JS
- NVIDIA Nemotron models
- Ollama project
- All civic tech activists working for transparent cities