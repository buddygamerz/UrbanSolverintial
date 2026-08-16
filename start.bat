@echo off
echo 🚀 Starting UrbanSolver Development Environment

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker first.
    exit /b 1
)

echo 📦 Starting Docker services...
docker-compose up -d db redis

echo ⏳ Waiting for database...
:wait_db
docker-compose exec -T db pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    timeout /t 2 >nul
    goto wait_db
)

echo ✅ Database ready

echo 🔧 Starting backend...
docker-compose up -d backend

echo ⏳ Waiting for backend (max 60 seconds)...
set MAX_WAIT=30
set WAIT_COUNT=0

:wait_backend
REM Check if backend container is still running
docker-compose ps backend --format "{{.State}}" | findstr /i "running" >nul 2>&1
if errorlevel 1 (
    echo ❌ Backend container stopped unexpectedly!
    echo 📋 Backend logs:
    docker-compose logs backend --tail 50
    exit /b 1
)

curl -s http://localhost:8000/health >nul 2>&1
if errorlevel 1 (
    set /a WAIT_COUNT+=1
    if %WAIT_COUNT% geq %MAX_WAIT% (
        echo ❌ Backend health check timed out after %MAX_WAIT% attempts!
        echo 📋 Backend logs:
        docker-compose logs backend --tail 50
        exit /b 1
    )
    timeout /t 2 >nul
    goto wait_backend
)

echo ✅ Backend ready

echo 🎨 Starting frontend...
docker-compose up -d frontend

echo.
echo 🎉 UrbanSolver is running!
echo.
echo 📍 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo.
echo To stop: docker-compose down
echo To view logs: docker-compose logs -f