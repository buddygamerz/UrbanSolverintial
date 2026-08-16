from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
import base64
import asyncio

from ..ai.router import (
    analyze_report_image,
    classify_report,
    generate_issue_summary,
    analyze_project_impact,
    generate_recommendations,
    router as ai_router,
)
from ..ai.rag import rag_service

router = APIRouter(prefix="/ai", tags=["ai"])


class ImageAnalysisRequest(BaseModel):
    image_base64: str


class ReportClassificationRequest(BaseModel):
    text: str
    image_analysis: Optional[dict] = None


class IssueSummaryRequest(BaseModel):
    reports: List[dict]


class ProjectImpactRequest(BaseModel):
    project: dict
    nearby_issues: List[dict]


class RecommendationsRequest(BaseModel):
    issue: dict
    context: dict


class RAGQueryRequest(BaseModel):
    question: str
    top_k: int = 5


class AIHealthResponse(BaseModel):
    llm_provider: str
    llm_status: str  # "ok" or "error"
    llm_detail: Optional[str] = None
    embedding_provider: str
    embedding_status: str  # "ok" or "error"
    embedding_detail: Optional[str] = None
    vector_store: str  # "ok" or "error"
    vector_store_detail: Optional[str] = None
    overall_status: str  # "ok" or "degraded"


@router.post("/analyze-image")
async def analyze_image_endpoint(request: ImageAnalysisRequest):
    """Analyze an uploaded image for civic infrastructure issues."""
    try:
        result = await analyze_report_image(request.image_base64)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-image-upload")
async def analyze_image_upload(file: UploadFile = File(None)):
    """Analyze an uploaded image file."""
    if not file or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    content = await file.read()
    image_base64 = base64.b64encode(content).decode("utf-8")
    
    try:
        result = await analyze_report_image(image_base64)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/classify-report")
async def classify_report_endpoint(request: ReportClassificationRequest):
    """Classify a report text with optional image analysis."""
    try:
        result = await classify_report(request.text, request.image_analysis)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize-issue")
async def summarize_issue_endpoint(request: IssueSummaryRequest):
    """Generate a summary from multiple reports."""
    try:
        summary = await generate_issue_summary(request.reports)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-project-impact")
async def analyze_project_impact_endpoint(request: ProjectImpactRequest):
    """Analyze project impact on nearby issues."""
    try:
        result = await analyze_project_impact(request.project, request.nearby_issues)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-recommendations")
async def generate_recommendations_endpoint(request: RecommendationsRequest):
    """Generate intervention recommendations for an issue."""
    try:
        recommendations = await generate_recommendations(request.issue, request.context)
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rag/query")
async def rag_query_endpoint(request: RAGQueryRequest):
    """Query the RAG system with a question."""
    try:
        docs = await rag_service.retrieve(request.question, request.top_k)
        answer = await rag_service.answer_with_sources(request.question, docs)
        return {
            "answer": answer["answer"],
            "confidence": answer["confidence"],
            "sources": [
                {
                    "id": doc["id"],
                    "title": doc["metadata"].get("title", "Unknown"),
                    "type": doc["metadata"].get("type", "Unknown"),
                    "score": doc["score"],
                }
                for doc in docs
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health", response_model=AIHealthResponse)
async def ai_health_endpoint():
    """Health check for AI services."""
    # Check LLM provider
    llm_status = "ok"
    llm_detail = None
    try:
        # Use a simple completion with the small model
        messages = [
            {"role": "user", "content": "Say 'ok' in one word."}
        ]
        # We'll use the small model config directly
        from ..ai.config import get_model_config
        config = get_model_config("small")
        # We'll use the router's complete method with a short timeout
        response = await ai_router.complete(
            messages,
            task="classification",  # uses small model
            config=config,
        )
        if not response or len(response.strip()) == 0:
            llm_status = "error"
            llm_detail = "Empty response from LLM"
    except Exception as e:
        llm_status = "error"
        llm_detail = str(e)

    # Check embedding provider
    embedding_status = "ok"
    embedding_detail = None
    try:
        test_text = "This is a test."
        embeddings = await ai_router.embed([test_text], task="embedding")
        if not embeddings or len(embeddings) == 0 or len(embeddings[0]) == 0:
            embedding_status = "error"
            embedding_detail = "Empty embedding returned"
    except Exception as e:
        embedding_status = "error"
        embedding_detail = str(e)

    # Check vector store (RAG service)
    vector_store_status = "ok"
    vector_store_detail = None
    try:
        # Test by adding a temporary document and retrieving it
        test_id = "health-check-test"
        test_content = "This is a test document for health check."
        test_meta = {"title": "Test", "type": "test"}
        added = await rag_service.add_document(test_id, test_content, test_meta)
        if not added:
            vector_store_status = "error"
            vector_store_detail = "Failed to add test document to vector store"
        else:
            # Try to retrieve it
            results = await rag_service.retrieve("test", top_k=1)
            if not any(r["id"] == test_id for r in results):
                vector_store_status = "error"
                vector_store_detail = "Failed to retrieve test document"
            else:
                # Clean up: we could delete, but for simplicity we'll leave it
                pass
    except Exception as e:
        vector_store_status = "error"
        vector_store_detail = str(e)

    # Determine overall status
    overall_status = "ok"
    if llm_status == "error" or embedding_status == "error" or vector_store_status == "error":
        overall_status = "degraded"

    return AIHealthResponse(
        llm_provider="ollama",
        llm_status=llm_status,
        llm_detail=llm_detail,
        embedding_provider="ollama",
        embedding_status=embedding_status,
        embedding_detail=embedding_detail,
        vector_store=vector_store_status,
        vector_store_detail=vector_store_detail,
        overall_status=overall_status,
    )