from celery import shared_task
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
import os

from ..models import Issue, Project
from ..ai.router import (
    analyze_project_impact,
    generate_recommendations,
    generate_issue_summary,
)
from ..ai.rag import rag_service


# Create engine for tasks
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/urbansolver")
engine = create_async_engine(DATABASE_URL)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@shared_task
async def update_all_issue_priorities():
    """Update priority scores for all open issues."""
    async with async_session() as db:
        result = await db.execute(select(Issue).where(Issue.status.in_(["open", "in_progress"])))
        issues = result.scalars().all()

        for issue in issues:
            # Trigger individual priority update
            from .report_tasks import update_issue_priority
            update_issue_priority.delay(issue.id)

        return {"status": "triggered", "count": len(issues)}


@shared_task
async def cluster_new_reports():
    """Cluster unclustered reports with existing issues."""
    async with async_session() as db:
        from ..models import Report
        result = await db.execute(select(Report).where(Report.issue_id.is_(None)))
        reports = result.scalars().all()

        for report in reports:
            from .report_tasks import cluster_report_with_issues
            cluster_report_with_issues.delay(report.id)

        return {"status": "triggered", "count": len(reports)}


@shared_task
async def analyze_project_impacts(project_id: str):
    """Analyze a project's impact on nearby issues."""
    async with async_session() as db:
        # Get project
        result = await db.execute(select(Project).where(Project.id == project_id))
        project = result.scalar_one_or_none()
        if not project:
            return {"error": "Project not found"}

        # Get nearby issues (within 1km)
        from sqlalchemy import text
        query = text("""
            SELECT i.id, i.title, i.category, i.severity, i.description,
                   ST_Distance(l.geom, ST_GeomFromText(:project_geom, 4326)::geography) as distance
            FROM issues i
            JOIN locations l ON i.location_id = l.id
            WHERE ST_DWithin(l.geom, ST_GeomFromText(:project_geom, 4326)::geography, 1000)
            AND i.status IN ('open', 'in_progress')
            ORDER BY distance
            LIMIT 20
        """)
        # Parse project geographic_coverage as WKT
        geom = project.geographic_coverage or "POINT(0 0)"
        result = await db.execute(query, {"project_geom": geom})
        nearby_issues = [dict(row) for row in result.mappings().fetchall()]

        if not nearby_issues:
            return {"status": "no_nearby_issues"}

        # Analyze impact
        project_dict = {
            "id": project.id,
            "name": project.name,
            "authority": project.authority,
            "stated_objective": project.stated_objective,
            "current_status": project.current_status,
        }

        impact = await analyze_project_impact(project_dict, nearby_issues)

        # Store impact analysis
        from ..models import ProjectImpact
        for gap in impact.get("gaps", []):
            pi = ProjectImpact(
                id=str(__import__('uuid').uuid4()),
                project_id=project.id,
                description=gap,
                type="gap",
            )
            db.add(pi)

        for consequence in impact.get("unintended_consequences", []):
            pi = ProjectImpact(
                id=str(__import__('uuid').uuid4()),
                project_id=project.id,
                description=consequence,
                type="unintended_consequence",
            )
            db.add(pi)

        await db.commit()

        # Generate recommendations
        recommendations = await generate_recommendations(
            {"id": project.id, "title": project.name, "description": impact.get("gaps", [])[0] if impact.get("gaps") else "Project impact analysis"},
            {"project": project_dict, "issues": nearby_issues}
        )

        from ..models import Recommendation
        for rec in recommendations:
            recommendation = Recommendation(
                id=str(__import__('uuid').uuid4()),
                project_id=project.id,
                **rec
            )
            db.add(recommendation)

        await db.commit()

        return {"status": "analyzed", "impact": impact, "recommendations_count": len(recommendations)}


@shared_task
async def generate_issue_summaries():
    """Generate summaries for issues with multiple reports."""
    async with async_session() as db:
        from ..models import Report
        result = await db.execute(select(Issue).where(Issue.recurrence > 1))
        issues = result.scalars().all()

        for issue in issues:
            reports_result = await db.execute(select(Report).where(Report.issue_id == issue.id))
            reports = reports_result.scalars().all()
            
            reports_data = [
                {"description": r.description, "severity": r.severity, "category": r.category}
                for r in reports
            ]

            summary = await generate_issue_summary(reports_data)
            
            # Update issue description with summary
            issue.description = summary
            await db.commit()

        return {"status": "updated", "count": len(issues)}


@shared_task
async def refresh_rag_index():
    """Refresh RAG index with latest government documents."""
    # In production, fetch from government portals
    # For now, just re-initialize with sample docs
    from ..ai.rag import initialize_rag_with_gov_documents
    await initialize_rag_with_gov_documents()
    return {"status": "refreshed"}