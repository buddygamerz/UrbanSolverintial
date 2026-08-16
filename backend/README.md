# UrbanSolver Backend

FastAPI backend for the UrbanSolver civic infrastructure intelligence platform.

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env
# Edit .env with your settings
uvicorn app.main:app --reload
```

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Database Migrations

```bash
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

## Running Tests

```bash
pytest
```

## Background Tasks

Start Celery worker:
```bash
celery -A app.celery_app worker --loglevel=info
```

Start Celery beat (scheduler):
```bash
celery -A app.celery_app beat --loglevel=info
```

## AI Services

The backend uses a model router that supports:
- OpenAI API
- Ollama (local)
- vLLM (local)

Configure via environment variables:
```
AI_PROVIDER=ollama  # or openai, vllm
OPENAI_API_KEY=sk-...  # if using OpenAI
```

## Project Structure

```
app/
├── ai/              # AI services (router, RAG, config)
├── models.py        # SQLAlchemy models
├── database.py      # Database connection
├── schemas.py       # Pydantic schemas
├── main.py          # FastAPI app
├── routers/         # API routes
│   ├── reports.py
│   ├── issues.py
│   ├── projects.py
│   └── ai.py
├── tasks/           # Celery background tasks
│   ├── report_tasks.py
│   └── ai_tasks.py
└── celery_app.py    # Celery configuration
```