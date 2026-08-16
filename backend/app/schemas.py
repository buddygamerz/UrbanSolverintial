from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime
import uuid


class LocationCreate(BaseModel):
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")
    address: Optional[str] = None
    city: Optional[str] = None
    ward: Optional[str] = None
    locality: Optional[str] = None

    @field_validator('address')
    @classmethod
    def validate_address(cls, v):
        if not v:
            raise ValueError('address cannot be empty')
        return v


class ReportCreate(BaseModel):
    latitude: float
    longitude: float
    category: str = Field(..., description="Problem category")
    severity: str = Field(..., description="Severity level", pattern="^(low|moderate|high|critical)$")
    description: str = Field(..., min_length=10, max_length=500)
    impact_description: Optional[str] = None
    photos: Optional[List[str]] = None

    model_config = {
        "extra": "forbid",
    }


class ReportResponse(BaseModel):
    id: str
    category: str
    severity: str
    description: str
    impact_description: Optional[str]
    location: dict
    created_at: datetime
    status: str = "open"

    model_config = {
        "from_attributes": True,
    }


class IssueCreate(BaseModel):
    title: str
    description: str
    category: str
    severity: str
    priority_score: Optional[float] = None
    status: str = "open"


class IssueResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    severity: str
    priority_score: Optional[float]
    status: str
    recurrence: int
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }


class ProjectCreate(BaseModel):
    name: str
    authority: str
    department: Optional[str] = None
    contractor: Optional[str] = None
    estimated_cost: Optional[float] = None
    start_date: Optional[datetime] = None
    expected_completion: Optional[datetime] = None
    current_status: str
    geographic_coverage: Optional[str] = None
    stated_objective: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    authority: str
    current_status: str
    stated_objective: Optional[str]

    model_config = {
        "from_attributes": True,
    }