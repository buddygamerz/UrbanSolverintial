from pydantic import BaseModel
from typing import Optional, Dict, Any
from enum import Enum
import os


class ModelProvider(str, Enum):
    OPENAI = "openai"
    OLLAMA = "ollama"
    VLLM = "vllm"
    LLAMACPP = "llamacpp"


class ModelConfig(BaseModel):
    provider: ModelProvider
    model: str
    endpoint: Optional[str] = None
    api_key: Optional[str] = None
    temperature: float = 0.1
    max_tokens: int = 2048
    timeout: int = 30
    fallback: Optional[str] = None


# Ollama endpoint from environment (default to localhost for dev outside Docker)
OLLAMA_ENDPOINT = os.getenv("OLLAMA_HOST", "http://localhost:11434")

# Default model configurations
MODEL_CONFIGS: Dict[str, ModelConfig] = {
    "small": ModelConfig(
        provider=ModelProvider.OLLAMA,
        model="nemotron-3-nano",
        endpoint=OLLAMA_ENDPOINT,
        temperature=0.1,
        max_tokens=1024,
        fallback="medium",
    ),
    "medium": ModelConfig(
        provider=ModelProvider.OLLAMA,
        model="nemotron-3-medium",
        endpoint=OLLAMA_ENDPOINT,
        temperature=0.2,
        max_tokens=2048,
        fallback="large",
    ),
    "large": ModelConfig(
        provider=ModelProvider.OLLAMA,
        model="nemotron-3-30b",
        endpoint=OLLAMA_ENDPOINT,
        temperature=0.3,
        max_tokens=4096,
    ),
    "vision": ModelConfig(
        provider=ModelProvider.OLLAMA,
        model="llava:13b",
        endpoint=OLLAMA_ENDPOINT,
        temperature=0.1,
        max_tokens=2048,
    ),
    "embedding": ModelConfig(
        provider=ModelProvider.OLLAMA,
        model="nomic-embed-text",
        endpoint=OLLAMA_ENDPOINT,
        temperature=0.0,
        max_tokens=512,
    ),
    "openai_small": ModelConfig(
        provider=ModelProvider.OPENAI,
        model="gpt-3.5-turbo",
        temperature=0.1,
        max_tokens=1024,
    ),
    "openai_medium": ModelConfig(
        provider=ModelProvider.OPENAI,
        model="gpt-4-turbo",
        temperature=0.2,
        max_tokens=2048,
    ),
    "openai_vision": ModelConfig(
        provider=ModelProvider.OPENAI,
        model="gpt-4-vision-preview",
        temperature=0.1,
        max_tokens=2048,
    ),
}


def get_model_config(model_key: str) -> ModelConfig:
    """Get model configuration by key."""
    return MODEL_CONFIGS.get(model_key, MODEL_CONFIGS["small"])


class TaskComplexity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# Task to model mapping
TASK_MODEL_MAP: Dict[str, str] = {
    # Low complexity tasks
    "classification": "small",
    "summarization": "small",
    "metadata_extraction": "small",
    "entity_extraction": "small",
    "report_classification": "small",
    # Medium complexity tasks
    "image_analysis": "vision",
    "issue_clustering": "medium",
    "rag_answer": "medium",
    "duplicate_detection": "embedding",
    # High complexity tasks
    "urban_planning_analysis": "large",
    "project_comparison": "large",
    "multi_source_reasoning": "large",
    "evidence_verification": "medium",
    "recommendation_generation": "large",
}


def get_model_for_task(task: str) -> ModelConfig:
    """Get appropriate model configuration for a task."""
    model_key = TASK_MODEL_MAP.get(task, "small")
    return get_model_config(model_key)