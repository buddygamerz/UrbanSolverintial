#!/bin/bash
# UrbanSolver Development Startup Script

set -e

echo "🚀 Starting UrbanSolver Development Environment"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start services
echo "📦 Starting Docker services..."
docker-compose up -d db redis

# Wait for database to be ready
echo "⏳ Waiting for database..."
until docker-compose exec -T db pg_isready -U postgres > /dev/null 2>&1; do
    sleep 2
done

echo "✅ Database ready"

# Start backend
echo "🔧 Starting backend..."
docker-compose up -d backend

# Wait for backend
echo "⏳ Waiting for backend..."
until curl -s http://localhost:8000/health > /dev/null 2>&1; do
    sleep 2
done

echo "✅ Backend ready"

# Start frontend
echo "🎨 Starting frontend..."
docker-compose up -d frontend

echo ""
echo "🎉 UrbanSolver is running!"
echo ""
echo "📍 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "To stop: docker-compose down"
echo "To view logs: docker-compose logs -f"