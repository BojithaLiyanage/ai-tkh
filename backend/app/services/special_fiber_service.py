import logging
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import SpecialFiber, SpecialFiberEmbedding
from app.core.config import settings
import os

logger = logging.getLogger(__name__)


def _build_basic_content(special_fiber: SpecialFiber) -> str:
    """Build basic content for embedding"""
    parts = [f"Special Fiber: {special_fiber.name}"]
    if special_fiber.properties:
        prop_count = len(special_fiber.properties)
        parts.append(f"Properties: {prop_count} specialized attributes")
    return ". ".join(parts)


def _build_properties_content(special_fiber: SpecialFiber) -> str:
    """Build properties content for embedding"""
    parts = [f"{special_fiber.name} Properties:"]
    if special_fiber.properties and isinstance(special_fiber.properties, dict):
        for key, value in special_fiber.properties.items():
            formatted_key = key.replace('_', ' ').replace('.', ' - ')
            parts.append(f"{formatted_key}: {value}")
    return ". ".join(parts)


def _build_complete_content(special_fiber: SpecialFiber) -> str:
    """Build complete content for embedding"""
    sections = []
    basic = _build_basic_content(special_fiber)
    sections.append(basic)

    if special_fiber.properties and isinstance(special_fiber.properties, dict):
        props_parts = [f"{special_fiber.name} comprehensive properties:"]
        for key, value in special_fiber.properties.items():
            formatted_key = key.replace('_', ' ').replace('.', ' - ')
            props_parts.append(f"{formatted_key}: {value}")
        sections.append(". ".join(props_parts))

    return " | ".join(sections)


def _generate_embedding_vector(text: str) -> Optional[List[float]]:
    """Generate embedding vector using OpenAI API"""
    try:
        from openai import OpenAI

        if not hasattr(settings, 'OPENAI_API_KEY') or not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not set, skipping embedding generation")
            return None

        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        logger.warning(f"Failed to generate embedding: {str(e)}")
        return None


def _auto_generate_embeddings(db: Session, special_fiber: SpecialFiber) -> None:
    """Automatically generate embeddings for a special fiber"""
    try:
        embeddings_to_create = []

        # Basic Info Embedding
        basic_content = _build_basic_content(special_fiber)
        if basic_content and len(basic_content) > 20:
            basic_embedding = _generate_embedding_vector(basic_content)
            embeddings_to_create.append({
                "content_type": "basic_info",
                "content": basic_content,
                "embedding": basic_embedding
            })

        # Properties Embedding
        props_content = _build_properties_content(special_fiber)
        if props_content and len(props_content) > 30:
            props_embedding = _generate_embedding_vector(props_content)
            embeddings_to_create.append({
                "content_type": "properties",
                "content": props_content,
                "embedding": props_embedding
            })

        # Complete Embedding
        complete_content = _build_complete_content(special_fiber)
        if complete_content and len(complete_content) > 50:
            complete_embedding = _generate_embedding_vector(complete_content)
            embeddings_to_create.append({
                "content_type": "complete",
                "content": complete_content,
                "embedding": complete_embedding
            })

        # Save embeddings
        for emb_data in embeddings_to_create:
            embedding_record = SpecialFiberEmbedding(
                special_fiber_id=special_fiber.id,
                content_type=emb_data["content_type"],
                content_text=emb_data["content"],
                embedding=emb_data["embedding"],
                embedding_model="text-embedding-3-small"
            )
            db.add(embedding_record)

        if embeddings_to_create:
            db.commit()
            logger.info(f"Auto-generated {len(embeddings_to_create)} embeddings for special fiber: {special_fiber.name}")

    except Exception as e:
        logger.warning(f"Error auto-generating embeddings: {str(e)}")
        # Don't raise - embeddings are optional


def _regenerate_embeddings(db: Session, special_fiber: SpecialFiber) -> None:
    """Regenerate embeddings for a special fiber (delete old ones and create new ones)"""
    try:
        # Delete existing embeddings for this fiber
        db.query(SpecialFiberEmbedding).filter(
            SpecialFiberEmbedding.special_fiber_id == special_fiber.id
        ).delete()
        db.commit()
        logger.info(f"Deleted existing embeddings for special fiber: {special_fiber.id}")

        # Generate new embeddings
        _auto_generate_embeddings(db, special_fiber)
    except Exception as e:
        db.rollback()
        logger.warning(f"Error regenerating embeddings: {str(e)}")
        # Don't raise - embeddings are optional


class SpecialFiberService:
    """Service for managing special fibers with JSON properties"""

    @staticmethod
    def create_special_fiber(db: Session, fiber_data: Dict[str, Any], auto_embed: bool = True) -> SpecialFiber:
        """
        Create a new special fiber with JSON properties

        Args:
            db: Database session
            fiber_data: Dict with name and properties
            auto_embed: Whether to auto-generate embeddings (default True)

        Returns:
            Created SpecialFiber instance
        """
        try:
            # Create special fiber with JSON properties
            special_fiber = SpecialFiber(
                name=fiber_data.get('name'),
                properties=fiber_data.get('properties', {}),
            )

            db.add(special_fiber)
            db.commit()
            db.refresh(special_fiber)

            logger.info(f"Created special fiber: {special_fiber.id} - {special_fiber.name}")

            # Auto-generate embeddings
            if auto_embed:
                _auto_generate_embeddings(db, special_fiber)

            return special_fiber

        except Exception as e:
            db.rollback()
            logger.error(f"Error creating special fiber: {str(e)}")
            raise

    @staticmethod
    def get_special_fiber(db: Session, special_fiber_id: int) -> Optional[SpecialFiber]:
        """
        Get a special fiber by ID

        Args:
            db: Database session
            special_fiber_id: ID of the special fiber

        Returns:
            SpecialFiber instance or None
        """
        return db.query(SpecialFiber).filter(SpecialFiber.id == special_fiber_id).first()

    @staticmethod
    def update_special_fiber(
        db: Session,
        special_fiber_id: int,
        fiber_data: Dict[str, Any]
    ) -> Optional[SpecialFiber]:
        """
        Update a special fiber's name and/or properties

        Args:
            db: Database session
            special_fiber_id: ID of the special fiber
            fiber_data: Dict with updated name and/or properties

        Returns:
            Updated SpecialFiber instance or None
        """
        try:
            special_fiber = db.query(SpecialFiber).filter(SpecialFiber.id == special_fiber_id).first()
            if not special_fiber:
                return None

            # Track if properties or name changed (for embedding regeneration)
            properties_changed = False
            name_changed = False

            # Update name if provided
            if 'name' in fiber_data and fiber_data['name']:
                if special_fiber.name != fiber_data['name']:
                    name_changed = True
                special_fiber.name = fiber_data['name']

            # Update properties if provided
            if 'properties' in fiber_data:
                if special_fiber.properties != fiber_data['properties']:
                    properties_changed = True
                special_fiber.properties = fiber_data['properties']

            # Update is_active if provided
            if 'is_active' in fiber_data and fiber_data['is_active'] is not None:
                special_fiber.is_active = fiber_data['is_active']

            db.commit()
            db.refresh(special_fiber)

            # Regenerate embeddings if name or properties changed
            if properties_changed or name_changed:
                _regenerate_embeddings(db, special_fiber)

            logger.info(f"Updated special fiber: {special_fiber_id}")
            return special_fiber

        except Exception as e:
            db.rollback()
            logger.error(f"Error updating special fiber: {str(e)}")
            raise

    @staticmethod
    def delete_special_fiber(db: Session, special_fiber_id: int) -> bool:
        """
        Delete a special fiber and all associated data (cascade)

        Args:
            db: Database session
            special_fiber_id: ID of the special fiber

        Returns:
            True if deletion was successful
        """
        try:
            special_fiber = db.query(SpecialFiber).filter(SpecialFiber.id == special_fiber_id).first()
            if not special_fiber:
                return False

            db.delete(special_fiber)
            db.commit()

            logger.info(f"Deleted special fiber: {special_fiber_id}")
            return True

        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting special fiber: {str(e)}")
            raise

    @staticmethod
    def list_special_fibers(
        db: Session,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[SpecialFiber], int]:
        """
        List all special fibers with pagination

        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            Tuple of (list of SpecialFiber instances, total count)
        """
        query = db.query(SpecialFiber)
        total = query.count()
        fibers = query.offset(skip).limit(limit).all()

        return fibers, total


class SpecialFiberEmbeddingService:
    """Service for managing embeddings for special fibers"""

    @staticmethod
    def create_embedding(
        db: Session,
        special_fiber_id: int,
        content_type: str,
        content_text: str,
        embedding_vector: Optional[List[float]] = None
    ) -> SpecialFiberEmbedding:
        """
        Create an embedding for a special fiber

        Args:
            db: Database session
            special_fiber_id: ID of the special fiber
            content_type: Type of content (e.g., 'full_description', 'properties')
            content_text: The text that was embedded
            embedding_vector: The embedding vector

        Returns:
            Created SpecialFiberEmbedding instance
        """
        try:
            # Check if embedding already exists
            existing = db.query(SpecialFiberEmbedding).filter(
                SpecialFiberEmbedding.special_fiber_id == special_fiber_id,
                SpecialFiberEmbedding.content_type == content_type
            ).first()

            if existing:
                # Update existing embedding
                existing.content_text = content_text
                existing.embedding = embedding_vector
                embedding = existing
            else:
                # Create new embedding
                embedding = SpecialFiberEmbedding(
                    special_fiber_id=special_fiber_id,
                    content_type=content_type,
                    content_text=content_text,
                    embedding=embedding_vector,
                )
                db.add(embedding)

            db.commit()
            db.refresh(embedding)

            logger.info(f"Created/updated embedding for special fiber {special_fiber_id}")
            return embedding

        except Exception as e:
            db.rollback()
            logger.error(f"Error creating embedding: {str(e)}")
            raise

    @staticmethod
    def get_embedding(db: Session, embedding_id: int) -> Optional[SpecialFiberEmbedding]:
        """
        Get an embedding by ID

        Args:
            db: Database session
            embedding_id: ID of the embedding

        Returns:
            SpecialFiberEmbedding instance or None
        """
        return db.query(SpecialFiberEmbedding).filter(SpecialFiberEmbedding.id == embedding_id).first()

    @staticmethod
    def get_embedding_by_type(
        db: Session,
        special_fiber_id: int,
        content_type: str
    ) -> Optional[SpecialFiberEmbedding]:
        """
        Get embedding by special fiber ID and content type

        Args:
            db: Database session
            special_fiber_id: ID of the special fiber
            content_type: Type of content

        Returns:
            SpecialFiberEmbedding instance or None
        """
        return db.query(SpecialFiberEmbedding).filter(
            SpecialFiberEmbedding.special_fiber_id == special_fiber_id,
            SpecialFiberEmbedding.content_type == content_type
        ).first()

    @staticmethod
    def list_embeddings(
        db: Session,
        special_fiber_id: int
    ) -> List[SpecialFiberEmbedding]:
        """
        List all embeddings for a special fiber

        Args:
            db: Database session
            special_fiber_id: ID of the special fiber

        Returns:
            List of SpecialFiberEmbedding instances
        """
        return db.query(SpecialFiberEmbedding).filter(
            SpecialFiberEmbedding.special_fiber_id == special_fiber_id
        ).all()

    @staticmethod
    def delete_embedding(db: Session, embedding_id: int) -> bool:
        """
        Delete an embedding

        Args:
            db: Database session
            embedding_id: ID of the embedding

        Returns:
            True if deletion was successful
        """
        embedding = db.query(SpecialFiberEmbedding).filter(
            SpecialFiberEmbedding.id == embedding_id
        ).first()
        if not embedding:
            return False

        db.delete(embedding)
        db.commit()
        return True
