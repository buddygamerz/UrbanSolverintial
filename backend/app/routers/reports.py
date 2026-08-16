from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from ..database import get_db
from ..models import Report, Location, ReportMedia
from ..schemas import ReportCreate, ReportResponse

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(report_data: ReportCreate, db: AsyncSession = Depends(get_db)):
    # Create location
    location = Location(
        id=str(uuid.uuid4()),
        latitude=report_data.latitude,
        longitude=report_data.longitude,
        address=None,  # Will be filled by reverse geocoding later
        city=None,
        ward=None,
        locality=None
    )
    db.add(location)
    await db.flush()

    # Create report
    report = Report(
        id=str(uuid.uuid4()),
        location_id=location.id,
        reporter_id="anonymous",  # Will be replaced with actual user ID when auth is implemented
        category=report_data.category,
        severity=report_data.severity,
        description=report_data.description,
        impact_description=report_data.impact_description
    )
    db.add(report)
    await db.flush()

    # Add photos if provided
    if report_data.photos:
        for photo_url in report_data.photos:
            media = ReportMedia(
                id=str(uuid.uuid4()),
                report_id=report.id,
                file_url=photo_url,
                media_type="image"
            )
            db.add(media)

    await db.commit()
    await db.refresh(report)
    await db.refresh(location)

    return ReportResponse(
        id=report.id,
        category=report.category,
        severity=report.severity,
        description=report.description,
        impact_description=report.impact_description,
        location={
            "latitude": location.latitude,
            "longitude": location.longitude,
            "address": location.address,
            "city": location.city,
            "ward": location.ward,
            "locality": location.locality
        },
        created_at=report.created_at
    )


@router.get("/", response_model=List[ReportResponse])
async def list_reports(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Report).offset(skip).limit(limit))
    reports = result.scalars().all()
    
    response = []
    for report in reports:
        # Load location
        loc_result = await db.execute(select(Location).where(Location.id == report.location_id))
        location = loc_result.scalar_one_or_none()
        
        response.append(ReportResponse(
            id=report.id,
            category=report.category,
            severity=report.severity,
            description=report.description,
            impact_description=report.impact_description,
            location={
                "latitude": location.latitude if location else None,
                "longitude": location.longitude if location else None,
                "address": location.address if location else None,
                "city": location.city if location else None,
                "ward": location.ward if location else None,
                "locality": location.locality if location else None
            },
            created_at=report.created_at
        ))
    return response


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    loc_result = await db.execute(select(Location).where(Location.id == report.location_id))
    location = loc_result.scalar_one_or_none()
    
    return ReportResponse(
        id=report.id,
        category=report.category,
        severity=report.severity,
        description=report.description,
        impact_description=report.impact_description,
        location={
            "latitude": location.latitude if location else None,
            "longitude": location.longitude if location else None,
            "address": location.address if location else None,
            "city": location.city if location else None,
            "ward": location.ward if location else None,
            "locality": location.locality if location else None
        },
        created_at=report.created_at
    )