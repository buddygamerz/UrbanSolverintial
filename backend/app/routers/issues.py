from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from ..database import get_db
from ..models import Issue, IssueStatusHistory
from ..schemas import IssueCreate, IssueResponse

router = APIRouter(prefix="/issues", tags=["issues"])


@router.post("/", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
async def create_issue(issue_data: IssueCreate, db: AsyncSession = Depends(get_db)):
    issue = Issue(
        id=str(uuid.uuid4()),
        title=issue_data.title,
        description=issue_data.description,
        category=issue_data.category,
        severity=issue_data.severity,
        priority_score=issue_data.priority_score,
        status=issue_data.status
    )
    db.add(issue)
    
    # Create initial status history
    history = IssueStatusHistory(
        id=str(uuid.uuid4()),
        issue_id=issue.id,
        status=issue_data.status,
        changed_by="system"
    )
    db.add(history)
    
    await db.commit()
    await db.refresh(issue)
    
    return IssueResponse(
        id=issue.id,
        title=issue.title,
        description=issue.description,
        category=issue.category,
        severity=issue.severity,
        priority_score=issue.priority_score,
        status=issue.status,
        recurrence=issue.recurrence,
        created_at=issue.created_at
    )


@router.get("/", response_model=List[IssueResponse])
async def list_issues(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Issue).offset(skip).limit(limit))
    issues = result.scalars().all()
    
    return [
        IssueResponse(
            id=issue.id,
            title=issue.title,
            description=issue.description,
            category=issue.category,
            severity=issue.severity,
            priority_score=issue.priority_score,
            status=issue.status,
            recurrence=issue.recurrence,
            created_at=issue.created_at
        )
        for issue in issues
    ]


@router.get("/{issue_id}", response_model=IssueResponse)
async def get_issue(issue_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Issue).where(Issue.id == issue_id))
    issue = result.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    return IssueResponse(
        id=issue.id,
        title=issue.title,
        description=issue.description,
        category=issue.category,
        severity=issue.severity,
        priority_score=issue.priority_score,
        status=issue.status,
        recurrence=issue.recurrence,
        created_at=issue.created_at
    )