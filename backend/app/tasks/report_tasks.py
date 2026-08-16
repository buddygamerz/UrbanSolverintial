from celery import shared_task
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
import os
import uuid

from ..models import Report, Location, Issue, IssueStatusHistory
from ..ai.router import classify_report, analyze_report_image
from ..database import Base


# Create engine for tasks
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/urbansolver")
engine = create_async_engine(DATABASE_URL)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@shared_task
async def process_new_report(report_id: str):
    """Process a newly submitted report: classify, analyze image, cluster."""
    async with async_session() as db:
        # Get report
        result = await db.execute(select(Report).where(Report.id == report_id))
        report = result.scalar_one_or_none()
        if not report:
            return {"error": "Report not found"}

        # Analyze image if present
        image_analysis = None
        # In production, fetch image from storage and analyze
        # For now, use text classification
        classification = await classify_report(report.description)
        
        # Update report with classification
        report.category = classification.get("category", report.category)
        report.severity = classification.get("severity", report.severity)
        await db.commit()

        # Try to cluster with existing issues
        await cluster_report_with_issues(report_id)

        return {"status": "processed", "classification": classification}


@shared_task
async def cluster_report_with_issues(report_id: str):
    """Cluster a report with existing issues based on proximity and category."""
    async with async_session() as db:
        result = await db.execute(select(Report).where(Report.id == report_id))
        report = result.scalar_one_or_none()
        if not report:
            return {"error": "Report not found"}

        # Get location
        loc_result = await db.execute(select(Location).where(Location.id == report.location_id))
        location = loc_result.scalar_one_or_none()
        if not location:
            return {"error": "Location not found"}

        # Find nearby issues of same category (within 100m)
        # Using PostGIS ST_DWithin
        from sqlalchemy import text
        query = text("""
            SELECT i.id, i.title, i.category, i.severity, i.recurrence,
                   ST_Distance(l.geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) as distance
            FROM issues i
            JOIN locations l ON i.location_id = l.id
            WHERE i.category = :category
            AND ST_DWithin(l.geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, 100)
            ORDER BY distance
            LIMIT 5
        """)
        result = await db.execute(query, {
            "lng": location.longitude,
            "lat": location.latitude,
            "category": report.category
        })
        nearby_issues = result.fetchall()

        if nearby_issues:
            # Link to closest issue
            closest_issue = nearby_issues[0]
            report.issue_id = closest_issue.id
            
            # Update issue recurrence
            issue_result = await db.execute(select(Issue).where(Issue.id == closest_issue.id))
            issue = issue_result.scalar_one_or_none()
            if issue:
                issue.recurrence += 1
                issue.updated_at = __import__('datetime').datetime.utcnow()
                
                # Add status history
                history = IssueStatusHistory(
                    id=str(uuid.uuid4()),
                    issue_id=issue.id,
                    status=issue.status,
                    changed_by="system"
                )
                db.add(history)
            
            await db.commit()
            return {"status": "clustered", "issue_id": closest_issue.id}
        else:
            # Create new issue
            issue = Issue(
                id=str(uuid.uuid4()),
                title=f"{report.category.replace('_', ' ').title()} near {location.address or 'unknown location'}",
                description=report.description,
                category=report.category,
                severity=report.severity,
                status=IssueStatus.OPEN,
                recurrence=1,
            )
            db.add(issue)
            await db.flush()
            
            report.issue_id = issue.id
            
            history = IssueStatusHistory(
                id=str(uuid.uuid4()),
                issue_id=issue.id,
                status=IssueStatus.OPEN,
                changed_by="system"
            )
            db.add(history)
            
            await db.commit()
            return {"status": "new_issue_created", "issue_id": issue.id}


@shared_task
async def update_issue_priority(issue_id: str):
    """Update priority score for an issue based on various factors."""
    async with async_session() as db:
        result = await db.execute(select(Issue).where(Issue.id == issue_id))
        issue = result.scalar_one_or_none()
        if not issue:
            return {"error": "Issue not found"}

        # Get linked reports count
        reports_result = await db.execute(select(Report).where(Report.issue_id == issue_id))
        reports = reports_result.scalars().all()

        # Calculate priority score
        # Priority = severity * recurrence * affected_population * safety_risk * duration
        severity_weights = {"low": 1, "moderate": 2, "high": 3, "critical": 4}
        severity_score = severity_weights.get(issue.severity, 2)
        
        recurrence_factor = min(issue.recurrence / 10.0, 2.0)  # Cap at 2x
        population_factor = min(issue.affected_population_estimate / 10000.0, 3.0)  # Cap at 3x
        
        # Duration factor (days since creation)
        from datetime import datetime
        duration_days = (datetime.utcnow() - issue.created_at).days
        duration_factor = min(duration_days / 30.0, 2.0)  # Cap at 2x after 60 days
        
        priority = severity_score * recurrence_factor * population_factor * duration_factor * 10
        issue.priority_score = round(priority, 1)
        
        await db.commit()
        return {"status": "updated", "priority_score": issue.priority_score}