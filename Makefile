.PHONY: help start stop restart logs test build clean

help:
	@echo "UrbanSolver Development Commands"
	@echo ""
	@echo "Docker:"
	@echo "  make start       - Start all services with Docker Compose"
	@echo "  make stop        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make logs        - View logs from all services"
	@echo "  make build       - Build all Docker images"
	@echo ""
	@echo "Backend:"
	@echo "  make backend-dev - Start backend in development mode"
	@echo "  make backend-test - Run backend tests"
	@echo "  make migrate     - Run database migrations"
	@echo "  make migration   - Create new migration (usage: make migration msg='description')"
	@echo ""
	@echo "Frontend:"
	@echo "  make frontend-dev - Start frontend in development mode"
	@echo "  make frontend-build - Build frontend for production"
	@echo "  make frontend-lint - Run frontend linter"
	@echo ""
	@echo "Database:"
	@echo "  make db-shell    - Open PostgreSQL shell"
	@echo "  make db-reset    - Reset database (WARNING: destroys data)"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean       - Remove all containers, volumes, and images"

# Docker commands
start:
	docker-compose up -d

stop:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

build:
	docker-compose build

# Backend commands
backend-dev:
	cd backend && source .venv/bin/activate && uvicorn app.main:app --reload

backend-test:
	cd backend && source .venv/bin/activate && pytest

migrate:
	cd backend && source .venv/bin/activate && alembic upgrade head

migration:
	cd backend && source .venv/bin/activate && alembic revision --autogenerate -m "$(msg)"

# Frontend commands
frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

frontend-lint:
	cd frontend && npm run lint

# Database commands
db-shell:
	docker-compose exec db psql -U postgres -d urbansolver

db-reset:
	docker-compose down -v
	docker-compose up -d db
	@echo "Waiting for database..."
	@sleep 5
	docker-compose up -d backend

# Cleanup
clean:
	docker-compose down -v --rmi all
	docker system prune -f