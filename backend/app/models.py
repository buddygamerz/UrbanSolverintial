import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Float,
    Enum,
    Table,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .database import Base
import enum


# Association table for Issue-Project many-to-many relationship
issue_project_links = Table(
    "issue_project_links",
    Base.metadata,
    Column("issue_id", UUID(as_uuid=True), ForeignKey("issues.id"), primary_key=True),
    Column("project_id", UUID(as_uuid=True), ForeignKey("projects.id"), primary_key=True),
)


class IssueStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    VERIFIED = "verified"
    REJECTED = "rejected"


class IssuePriority(str, enum.Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DELETED = "deleted"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    status = Column(Enum(UserStatus), server_default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # relationships
    reports = relationship("Report", back_populates="reporter")
    # other relations can be added later


class Location(Base):
    __tablename__ = "locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(Text, nullable=True)
    city = Column(String, nullable=True)
    ward = Column(String, nullable=True)
    locality = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # relationships
    reports = relationship("Report", back_populates="location")


class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    reporter_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    category = Column(String, nullable=False)  # e.g., "waterlogging", "pothole"
    severity = Column(Enum(IssuePriority), nullable=False, default=IssuePriority.MODERATE)
    description = Column(Text, nullable=False)
    impact_description = Column(Text, nullable=True)
    photos = relationship("ReportMedia", back_populates="report")
    issue_id = Column(UUID(as_uuid=True), ForeignKey("issues.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # relationships
    reporter = relationship("User", back_populates="reports")
    location = relationship("Location", back_populates="reports")
    issue = relationship("Issue", back_populates="reports")
    media = relationship("ReportMedia", back_populates="report")


class ReportMedia(Base):
    __tablename__ = "report_media"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("reports.id"), nullable=False)
    file_url = Column(String, nullable=False)  # S3 or local path
    media_type = Column(String, nullable=False)  # image, video
    caption = Column(Text, nullable=True)

    report = relationship("Report", back_populates="media")


class Issue(Base):
    __tablename__ = "issues"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)  # same as report category
    severity = Column(Enum(IssuePriority), nullable=False)
    priority_score = Column(Float, nullable=True)  # calculated
    status = Column(Enum(IssueStatus), default=IssueStatus.OPEN)
    recurrence = Column(Integer, default=0)  # number of reports
    affected_population_estimate = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # relationships
    reports = relationship("Report", back_populates="issue")
    projects = relationship("Project", secondary="issue_project_links")
    evidence = relationship("EvidenceSource", back_populates="issue")
    recommendations = relationship("Recommendation", back_populates="issue")
    # timeline
    history = relationship("IssueStatusHistory", back_populates="issue")


class IssueStatusHistory(Base):
    __tablename__ = "issue_status_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    issue_id = Column(UUID(as_uuid=True), ForeignKey("issues.id"), nullable=False)
    status = Column(Enum(IssueStatus), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)
    changed_by = Column(UUID(as_uuid=True), nullable=True)  # user id or system

    issue = relationship("Issue", back_populates="history")


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    authority = Column(String, nullable=False)  # gov dept
    department = Column(String, nullable=True)
    contractor = Column(String, nullable=True)
    estimated_cost = Column(Float, nullable=True)
    start_date = Column(DateTime, nullable=True)
    expected_completion = Column(DateTime, nullable=True)
    current_status = Column(String, nullable=False)  # e.g., "planning", "underway", "completed"
    geographic_coverage = Column(Text, nullable=True)  # GeoJSON or WKT
    stated_objective = Column(Text, nullable=True)
    affected_areas = Column(Text, nullable=True)  # list of area ids
    source_documents = relationship("ProjectDocument", back_populates="project")
    impact_analysis = relationship("ProjectImpact", back_populates="project")
    recommendations = relationship("Recommendation", back_populates="project")


class ProjectDocument(Base):
    __tablename__ = "project_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    title = Column(String, nullable=False)
    document_type = Column(String, nullable=False)  # e.g., "tender", "report", "permit"
    url = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="source_documents")


class ProjectImpact(Base):
    __tablename__ = "project_impact"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    issue_id = Column(UUID(as_uuid=True), ForeignKey("issues.id"), nullable=True)
    description = Column(Text, nullable=False)
    type = Column(String, nullable=False)  # e.g., "intended", "gap", "unintended_consequence"
    evidence = Column(Text, nullable=True)  # reference to source

    project = relationship("Project", back_populates="impact_analysis")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    issue_id = Column(UUID(as_uuid=True), ForeignKey("issues.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    expected_benefit = Column(Text, nullable=True)
    risks = Column(Text, nullable=True)
    complexity = Column(String, nullable=True)  # e.g., "low", "medium", "high"
    estimated_cost = Column(Float, nullable=True)
    stakeholders = Column(Text, nullable=True)
    evidence = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="recommendations")
    issue = relationship("Issue", back_populates="recommendations")


class EvidenceSource(Base):
    __tablename__ = "evidence_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    issue_id = Column(UUID(as_uuid=True), ForeignKey("issues.id"), nullable=False)
    source_type = Column(String, nullable=False)  # e.g., "government_document", "openstreetmap", "citizen_report", "news"
    url = Column(String, nullable=False)
    retrieval_date = Column(DateTime, default=datetime.utcnow)
    supporting_text = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)  # 0-1

    issue = relationship("Issue", back_populates="evidence")