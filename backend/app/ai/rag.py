import asyncio
from typing import List, Dict, Any, Optional
import json
from loguru import logger

from .router import router


class RAGService:
    """Retrieval-Augmented Generation service for civic documents."""

    def __init__(self):
        self.document_store = {}  # In production, use vector DB like pgvector
        self.embeddings_cache = {}
        self._ready = False
        self._init_error = None

    async def add_document(self, doc_id: str, content: str, metadata: Dict[str, Any]) -> bool:
        """Add a document to the store.
        Returns True if successful, False if embedding failed.
        """
        # Generate embedding
        try:
            embedding = await self._get_embedding(content)
        except Exception as e:
            logger.warning(f"Failed to generate embedding for document {doc_id}: {e}")
            return False
        self.document_store[doc_id] = {
            "content": content,
            "metadata": metadata,
            "embedding": embedding,
        }
        logger.info(f"Added document {doc_id} to RAG store")
        return True

    async def retrieve(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Retrieve relevant documents for a query."""
        query_embedding = await self._get_embedding(query)

        # Simple cosine similarity (in production, use vector DB)
        results = []
        for doc_id, doc in self.document_store.items():
            similarity = self._cosine_similarity(query_embedding, doc["embedding"])
            results.append({
                "id": doc_id,
                "content": doc["content"],
                "metadata": doc["metadata"],
                "score": similarity,
            })

        # Sort by score and return top_k
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    async def answer_with_sources(self, question: str, context_docs: List[Dict]) -> Dict[str, Any]:
        """Generate an answer with citations from retrieved documents."""
        context = "\n\n".join([
            f"[Source {i+1}: {doc['metadata'].get('title', 'Unknown')}] {doc['content'][:1000]}"
            for i, doc in enumerate(context_docs)
        ])

        messages = [
            {
                "role": "system",
                "content": """You are a civic information assistant. Answer questions using ONLY the provided sources.
Cite sources using [Source X] format.
If information is not in sources, say "Data unavailable".
Return JSON:
{
  "answer": "your answer with citations",
  "confidence": 0.0-1.0,
  "sources_used": [list of source indices]
}""",
            },
            {
                "role": "user",
                "content": f"Question: {question}\n\nSources:\n{context}",
            },
        ]

        try:
            response = await router.complete(messages, task="rag_answer")
            start = response.find("{")
            end = response.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(response[start:end])
        except Exception as e:
            logger.error(f"RAG answer generation failed: {e}")

        return {
            "answer": "Unable to generate answer from available sources.",
            "confidence": 0.0,
            "sources_used": [],
        }

    async def _get_embedding(self, text: str) -> List[float]:
        """Get embedding for text with caching."""
        if text in self.embeddings_cache:
            return self.embeddings_cache[text]

        embeddings = await router.embed([text], task="embedding")
        if not embeddings or len(embeddings) == 0 or len(embeddings[0]) == 0:
            raise ValueError("Empty embedding returned from provider")
        embedding = embeddings[0]
        self.embeddings_cache[text] = embedding
        return embedding

    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Compute cosine similarity between two vectors."""
        if not a or not b or len(a) != len(b):
            return 0.0

        dot_product = sum(x * y for x, y in zip(a, b))
        norm_a = sum(x * x for x in a) ** 0.5
        norm_b = sum(y * y for y in b) ** 0.5

        if norm_a == 0 or norm_b == 0:
            return 0.0

        return dot_product / (norm_a * norm_b)

    async def initialize_with_documents(self, documents: List[Dict[str, Any]]) -> bool:
        """Initialize RAG with a list of documents.
        Returns True if all documents were added successfully, False if any failed.
        """
        self._ready = False
        self._init_error = None
        success_count = 0
        for doc in documents:
            try:
                added = await self.add_document(
                    doc["id"],
                    doc["content"],
                    {k: v for k, v in doc.items() if k != "content"},
                )
                if added:
                    success_count += 1
                else:
                    logger.warning(f"Skipping document {doc['id']} due to embedding failure")
            except Exception as e:
                logger.error(f"Failed to add document {doc.get('id', 'unknown')}: {e}")
                self._init_error = str(e)
        if success_count == len(documents):
            self._ready = True
            self._init_error = None
            logger.info(f"Initialized RAG with {len(documents)} documents")
            return True
        else:
            logger.warning(
                f"Initialized RAG with {success_count}/{len(documents)} documents "
                f"(some documents failed to embed)"
            )
            return False

    @property
    def is_ready(self) -> bool:
        return self._ready

    @property
    def init_error(self) -> Optional[str]:
        return self._init_error


# Global RAG service instance
rag_service = RAGService()


async def initialize_rag_with_gov_documents():
    """Initialize RAG with sample government documents."""
    sample_docs = [
        {
            "id": "bbmp-dpr-majestic-drain",
            "title": "BBMP Majestic Stormwater Drain DPR",
            "type": "detailed_project_report",
            "authority": "BBMP",
            "department": "Stormwater Drains",
            "content": """
            Detailed Project Report for Upgradation of Stormwater Drains in Majestic Area, Bengaluru.
            
            Executive Summary:
            The Majestic area (Kempegowda Bus Station and surroundings) faces severe waterlogging during monsoon.
            Current drainage capacity: 25 mm/hr rainfall intensity.
            Required capacity: 50 mm/hr (as per CPHEEO norms).
            Deficit: 50% capacity shortfall.
            
            Proposed Solution:
            - Replace 2.3 km of existing 600mm diameter pipes with 1200mm diameter RCC pipes
            - Construct 3 new junction chambers with debris screens
            - Install 2 pump stations at low points (Majestic underpass, Tank Bund Road)
            - Estimated cost: ₹15 crores
            - Timeline: 12 months
            
            Beneficiaries:
            - 50,000 daily commuters at Majestic bus station
            - 15,000 residents in surrounding wards
            - Commercial establishments in Chickpet, Cottonpet areas
            """,
        },
        {
            "id": "bbmp-mg-road-resurfacing",
            "title": "MG Road Resurfacing Project Tender",
            "type": "tender_document",
            "authority": "BBMP",
            "department": "Road Infrastructure",
            "content": """
            Tender Notification: Resurfacing of MG Road from Trinity Circle to Anil Kumble Circle.
            
            Scope of Work:
            - Milling of existing bituminous surface (50mm depth)
            - Laying 50mm Dense Bituminous Macadam (DBM)
            - Laying 40mm Bituminous Concrete (BC) wearing course
            - Road marking and signage
            - Pedestrian crossing improvements at 8 locations
            
            Specifications:
            - Design life: 10 years
            - Traffic: 45,000 PCU/day
            - Pedestrian footfall: 25,000/day
            
            Budget: ₹8 crores
            Duration: 6 months
            Contractor: To be selected through e-procurement
            
            Note: Does not include utility ducting or stormwater drain upgrades.
            """,
        },
        {
            "id": "bda-silk-board-grade-separator",
            "title": "Silk Board Junction Grade Separator - EIA Report",
            "type": "environmental_impact_assessment",
            "authority": "BDA",
            "department": "Traffic Engineering",
            "content": """
            Environmental Impact Assessment for Grade Separator at Silk Board Junction.
            
            Project Description:
            - 2-level grade separator (flyover + underpass)
            - Flyover: 1.2 km on Hosur Road (NH-44)
            - Underpass: 0.8 km on ORR
            - 4 ramps for connectivity
            
            Traffic Analysis (Current):
            - Peak hour volume: 18,500 PCU
            - Level of Service: F (Failure)
            - Average delay: 12 minutes per vehicle
            - Annual fuel waste: 2.3 million liters
            
            Projected Benefits (Post-completion):
            - Peak hour LOS: C
            - Delay reduction: 75%
            - Fuel savings: 1.8 million liters/year
            - CO2 reduction: 4,200 tons/year
            
            Construction Impacts (24 months):
            - Temporary lane closures: 2 lanes on each approach
            - Expected congestion increase: 30-40% during construction
            - Detour routes identified: Hosa Road, BTM Layout, Madiwala
            - Dust and noise mitigation measures required
            
            Concerns:
            - Induced demand may fill capacity within 5-7 years
            - Adjacent junction congestion (Bommanahalli, HSR Layout) may worsen
            - Last-mile connectivity for metro not addressed
            """,
        },
    ]

    success = await rag_service.initialize_with_documents(sample_docs)
    if not success:
        logger.warning("RAG initialization completed with errors; some documents may not be searchable")
    else:
        logger.info("RAG initialized successfully with all government documents")