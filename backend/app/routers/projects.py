from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from ..database import get_db
from ..models import Project
from ..schemas import ProjectCreate, ProjectResponse

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(project_data: ProjectCreate, db: AsyncSession = Depends(get_db)):
    project = Project(
        id=str(uuid.uuid4()),
        name=project_data.name,
        authority=project_data.authority,
        department=project_data.department,
        contractor=project_data.contractor,
        estimated_cost=project_data.estimated_cost,
        start_date=project_data.start_date,
        expected_completion=project_data.expected_completion,
        current_status=project_data.current_status,
        geographic_coverage=project_data.geographic_coverage,
        stated_objective=project_data.stated_objective
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        authority=project.authority,
        current_status=project.current_status,
        stated_objective=project.stated_objective
    )


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).offset(skip).limit(limit))
    projects = result.scalars().all()
    
    return [
        ProjectResponse(
            id=project.id,
            name=project.name,
            authority=project.authority,
            current_status=project.current_status,
            stated_objective=project.stated_objective
        )
        for project in projects
    ]


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        authority=project.authority,
        current_status=project.current_status,
        stated_objective=project.stated_objective
    )