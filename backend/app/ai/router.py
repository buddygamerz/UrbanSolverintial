import json
import asyncio
from typing import Dict, Any, Optional, List
from abc import ABC, abstractmethod
import httpx
from loguru import logger

from .config import ModelConfig, ModelProvider, get_model_for_task


class BaseModelClient(ABC):
    """Abstract base class for model clients."""

    @abstractmethod
    async def complete(self, messages: List[Dict[str, str]], config: ModelConfig) -> str:
        pass

    @abstractmethod
    async def embed(self, texts: List[str], config: ModelConfig) -> List[List[float]]:
        pass


class OpenAIClient(BaseModelClient):
    """OpenAI API client."""

    async def complete(self, messages: List[Dict[str, str]], config: ModelConfig) -> str:
        api_key = config.api_key
        if not api_key:
            raise ValueError("OpenAI API key not configured")

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": config.model,
            "messages": messages,
            "temperature": config.temperature,
            "max_tokens": config.max_tokens,
        }

        async with httpx.AsyncClient(timeout=config.timeout) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def embed(self, texts: List[str], config: ModelConfig) -> List[List[float]]:
        api_key = config.api_key
        if not api_key:
            raise ValueError("OpenAI API key not configured")

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": config.model,
            "input": texts,
        }

        async with httpx.AsyncClient(timeout=config.timeout) as client:
            response = await client.post(
                "https://api.openai.com/v1/embeddings",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return [item["embedding"] for item in data["data"]]


class OllamaClient(BaseModelClient):
    """Ollama local inference client."""

    def __init__(self, endpoint: str = "http://localhost:11434"):
        self.endpoint = endpoint

    async def complete(self, messages: List[Dict[str, str]], config: ModelConfig) -> str:
        endpoint = config.endpoint or self.endpoint

        # Convert messages to Ollama format
        prompt = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])

        payload = {
            "model": config.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": config.temperature,
                "num_predict": config.max_tokens,
            },
        }

        async with httpx.AsyncClient(timeout=config.timeout) as client:
            response = await client.post(
                f"{endpoint}/api/generate",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")

    async def embed(self, texts: List[str], config: ModelConfig) -> List[List[float]]:
        endpoint = config.endpoint or self.endpoint
        embeddings = []

        for text in texts:
            payload = {
                "model": config.model,
                "input": text,
            }

            async with httpx.AsyncClient(timeout=config.timeout) as client:
                response = await client.post(
                    f"{endpoint}/api/embed",
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                embedding = data.get("embeddings", [[]])[0] if data.get("embeddings") else []
                if not embedding:
                    raise ValueError(f"Empty embedding returned for model {config.model}")
                embeddings.append(embedding)

        return embeddings


class VLLMClient(BaseModelClient):
    """vLLM OpenAI-compatible client."""

    def __init__(self, endpoint: str):
        self.endpoint = endpoint

    async def complete(self, messages: List[Dict[str, str]], config: ModelConfig) -> str:
        endpoint = config.endpoint or self.endpoint

        payload = {
            "model": config.model,
            "messages": messages,
            "temperature": config.temperature,
            "max_tokens": config.max_tokens,
        }

        async with httpx.AsyncClient(timeout=config.timeout) as client:
            response = await client.post(
                f"{endpoint}/v1/chat/completions",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def embed(self, texts: List[str], config: ModelConfig) -> List[List[float]]:
        endpoint = config.endpoint or self.endpoint

        payload = {
            "model": config.model,
            "input": texts,
        }

        async with httpx.AsyncClient(timeout=config.timeout) as client:
            response = await client.post(
                f"{endpoint}/v1/embeddings",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return [item["embedding"] for item in data["data"]]


class ModelRouter:
    """Routes requests to appropriate model clients."""

    def __init__(self):
        self.clients: Dict[ModelProvider, BaseModelClient] = {
            ModelProvider.OPENAI: OpenAIClient(),
            ModelProvider.OLLAMA: OllamaClient(),
            ModelProvider.VLLM: VLLMClient("http://localhost:8001"),
        }

    def get_client(self, provider: ModelProvider) -> BaseModelClient:
        client = self.clients.get(provider)
        if not client:
            raise ValueError(f"No client configured for provider: {provider}")
        return client

    async def complete(
        self,
        messages: List[Dict[str, str]],
        task: str = "classification",
        config: Optional[ModelConfig] = None,
    ) -> str:
        """Complete a chat request with automatic model selection and fallback."""
        if config is None:
            config = get_model_for_task(task)

        client = self.get_client(config.provider)

        try:
            logger.info(f"Using model {config.model} ({config.provider}) for task: {task}")
            return await client.complete(messages, config)
        except Exception as e:
            logger.warning(f"Model {config.model} failed: {e}. Trying fallback...")
            if config.fallback:
                fallback_config = get_model_for_task(config.fallback)
                fallback_client = self.get_client(fallback_config.provider)
                try:
                    logger.info(f"Falling back to {fallback_config.model}")
                    return await fallback_client.complete(messages, fallback_config)
                except Exception as fallback_error:
                    logger.error(f"Fallback also failed: {fallback_error}")
                    raise
            raise

    async def embed(
        self,
        texts: List[str],
        task: str = "embedding",
        config: Optional[ModelConfig] = None,
    ) -> List[List[float]]:
        """Generate embeddings with automatic model selection."""
        if config is None:
            config = get_model_for_task(task)

        client = self.get_client(config.provider)

        try:
            return await client.embed(texts, config)
        except Exception as e:
            logger.error(f"Embedding failed: {e}")
            raise


# Global router instance
router = ModelRouter()


async def analyze_report_image(image_base64: str) -> Dict[str, Any]:
    """Analyze a report image using vision model."""
    messages = [
        {
            "role": "system",
            "content": """You are an AI assistant analyzing civic infrastructure photos. 
Extract structured information about the issue shown in the image.
Return ONLY valid JSON with these fields:
{
  "category": "pothole|waterlogging|congestion|footpath|drainage|traffic_signal|construction|road_damage|accessibility|garbage|other",
  "severity": "low|moderate|high|critical",
  "confidence": 0.0-1.0,
  "observations": ["list of observed details"],
  "possible_causes": ["list of possible causes"],
  "affected_users": ["pedestrians|cyclists|motorists|public_transport_users|elderly|children|disabled"],
  "recommended_actions": ["list of immediate actions"]
}""",
        },
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Analyze this civic infrastructure photo."},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}},
            ],
        },
    ]

    try:
        response = await router.complete(messages, task="image_analysis")
        # Parse JSON from response
        # Find JSON block in response
        start = response.find("{")
        end = response.rfind("}") + 1
        if start >= 0 and end > start:
            json_str = response[start:end]
            return json.loads(json_str)
        else:
            logger.error("No JSON found in vision response")
            return {"category": "other", "severity": "moderate", "confidence": 0.5, "observations": [], "possible_causes": [], "affected_users": [], "recommended_actions": []}
    except Exception as e:
        logger.error(f"Image analysis failed: {e}")
        return {"category": "other", "severity": "moderate", "confidence": 0.3, "observations": [], "possible_causes": [], "affected_users": [], "recommended_actions": []}


async def classify_report(text: str, image_analysis: Optional[Dict] = None) -> Dict[str, Any]:
    """Classify a report text with optional image analysis context."""
    context = ""
    if image_analysis:
        context = f"\nImage analysis: {json.dumps(image_analysis)}"

    messages = [
        {
            "role": "system",
            "content": """You are a civic issue classifier. Classify the report into category and severity.
Return ONLY valid JSON:
{
  "category": "pothole|waterlogging|congestion|footpath|drainage|traffic_signal|construction|road_damage|accessibility|garbage|other",
  "severity": "low|moderate|high|critical",
  "confidence": 0.0-1.0,
  "entities": {"location_mentions": [], "infrastructure_types": [], "time_references": []}
}""",
        },
        {
            "role": "user",
            "content": f"Classify this civic report:{context}\n\nReport: {text}",
        },
    ]

    try:
        response = await router.complete(messages, task="report_classification")
        start = response.find("{")
        end = response.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(response[start:end])
    except Exception as e:
        logger.error(f"Report classification failed: {e}")

    return {"category": "other", "severity": "moderate", "confidence": 0.5, "entities": {}}


async def generate_issue_summary(reports: List[Dict]) -> str:
    """Generate a human-readable summary of an issue from multiple reports."""
    reports_text = "\n".join([
        f"- {r.get('description', '')} (Severity: {r.get('severity', '')})"
        for r in reports[:10]
    ])

    messages = [
        {
            "role": "system",
            "content": "Write a concise 2-3 sentence summary of this civic issue based on multiple citizen reports. Focus on the core problem, location, and impact.",
        },
        {
            "role": "user",
            "content": f"Reports:\n{reports_text}",
        },
    ]

    try:
        return await router.complete(messages, task="summarization")
    except Exception as e:
        logger.error(f"Summary generation failed: {e}")
        return "Issue summary unavailable."


async def analyze_project_impact(project: Dict, nearby_issues: List[Dict]) -> Dict[str, Any]:
    """Analyze project impact on nearby issues."""
    messages = [
        {
            "role": "system",
            "content": """You are an urban planning analyst. Analyze whether a government project addresses nearby civic issues.
Return ONLY valid JSON:
{
  "intended_purpose": "What the project is supposed to solve",
  "compatibility": "high|medium|low - how well project addresses issues",
  "gaps": ["significant problems that may remain"],
  "unintended_consequences": ["potential negative side effects"],
  "recommendations": ["suggested improvements or additional measures"]
}""",
        },
        {
            "role": "user",
            "content": f"Project: {json.dumps(project)}\n\nNearby Issues: {json.dumps(nearby_issues[:5])}",
        },
    ]

    try:
        response = await router.complete(messages, task="project_comparison")
        start = response.find("{")
        end = response.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(response[start:end])
    except Exception as e:
        logger.error(f"Project impact analysis failed: {e}")

    return {
        "intended_purpose": "Analysis unavailable",
        "compatibility": "unknown",
        "gaps": [],
        "unintended_consequences": [],
        "recommendations": [],
    }


async def generate_recommendations(issue: Dict, context: Dict) -> List[Dict[str, Any]]:
    """Generate intervention recommendations for an issue."""
    messages = [
        {
            "role": "system",
            "content": """You are an urban planning expert. Generate specific, evidence-based intervention recommendations.
Return ONLY valid JSON array:
[
  {
    "title": "Short intervention name",
    "description": "Detailed description",
    "expected_benefit": "What problem this solves",
    "risks": "Potential negative outcomes",
    "complexity": "low|medium|high",
    "estimated_cost": "rough estimate or 'unknown'",
    "stakeholders": ["list of affected parties"],
    "evidence": "Supporting data or precedent"
  }
]""",
        },
        {
            "role": "user",
            "content": f"Issue: {json.dumps(issue)}\nContext: {json.dumps(context)}",
        },
    ]

    try:
        response = await router.complete(messages, task="recommendation_generation")
        start = response.find("[")
        end = response.rfind("]") + 1
        if start >= 0 and end > start:
            return json.loads(response[start:end])
    except Exception as e:
        logger.error(f"Recommendation generation failed: {e}")

    return []