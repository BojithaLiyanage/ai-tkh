"""
Knowledge Base service for document management and RAG integration.
Provides semantic search, document chunking, and context building for chatbot.
"""

from typing import List, Dict, Optional, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, or_, and_, func, text, delete
from app.models.models import (
    KnowledgeBaseDocument, KnowledgeBaseEmbedding,
    KnowledgeBaseAttachment, KnowledgeBaseAuditLog,
    User
)
from openai import OpenAI
from app.core.config import settings
import re


class KnowledgeBaseService:
    """Service for knowledge base operations and semantic search"""

    def __init__(self, db: Session):
        self.db = db
        self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY) if hasattr(settings, 'OPENAI_API_KEY') else None
        self.chunk_size = 800  # Characters per chunk
        self.chunk_overlap = 200  # Overlap between chunks

    def chunk_document(self, content: str) -> List[str]:
        """
        Split document into overlapping chunks for better retrieval.
        Uses smart chunking by paragraphs and sentences.

        Args:
            content: Full document content

        Returns:
            List of text chunks
        """
        if not content:
            return []

        # First, split by paragraphs
        paragraphs = content.split('\n\n')

        chunks = []
        current_chunk = ""

        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue

            # If adding this paragraph would exceed chunk size
            if len(current_chunk) + len(paragraph) + 2 > self.chunk_size:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    # Start new chunk with overlap from previous chunk
                    overlap_text = current_chunk[-self.chunk_overlap:] if len(current_chunk) > self.chunk_overlap else current_chunk
                    current_chunk = overlap_text + "\n\n" + paragraph
                else:
                    # Paragraph itself is too long, split by sentences
                    sentences = re.split(r'(?<=[.!?])\s+', paragraph)
                    for sentence in sentences:
                        if len(current_chunk) + len(sentence) + 1 > self.chunk_size:
                            if current_chunk:
                                chunks.append(current_chunk.strip())
                                overlap_text = current_chunk[-self.chunk_overlap:] if len(current_chunk) > self.chunk_overlap else current_chunk
                                current_chunk = overlap_text + " " + sentence
                            else:
                                # Even single sentence is too long, just add it
                                chunks.append(sentence)
                                current_chunk = ""
                        else:
                            current_chunk += " " + sentence if current_chunk else sentence
            else:
                current_chunk += "\n\n" + paragraph if current_chunk else paragraph

        # Add the last chunk
        if current_chunk:
            chunks.append(current_chunk.strip())

        return chunks

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts using OpenAI.

        Args:
            texts: List of text strings

        Returns:
            List of embedding vectors
        """
        if not self.openai_client:
            raise Exception("OpenAI client not configured")

        try:
            response = self.openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=texts
            )
            return [item.embedding for item in response.data]
        except Exception as e:
            print(f"[KB SERVICE] Error generating embeddings: {e}")
            raise

    def create_document_with_embeddings(
        self,
        title: str,
        content: str,
        created_by: int,
        category: Optional[str] = None,
        subcategory: Optional[str] = None,
        fiber_ids: Optional[List[int]] = None,
        tags: Optional[List[str]] = None,
        is_published: bool = False
    ) -> KnowledgeBaseDocument:
        """
        Create a new knowledge base document with embeddings.

        Args:
            title: Document title
            content: Document content
            created_by: User ID of creator
            category: Document category
            subcategory: Document subcategory
            fiber_ids: Related fiber IDs
            tags: Document tags
            is_published: Whether to publish immediately

        Returns:
            Created KnowledgeBaseDocument
        """
        try:
            # Create document
            document = KnowledgeBaseDocument(
                title=title,
                content=content,
                category=category,
                subcategory=subcategory,
                fiber_ids=fiber_ids or [],
                tags=tags or [],
                is_published=is_published,
                created_by=created_by,
                updated_by=created_by
            )
            self.db.add(document)
            self.db.flush()  # Get document ID

            print(f"[KB SERVICE] Created document #{document.id}: {title}")

            # Chunk the content
            chunks = self.chunk_document(content)
            print(f"[KB SERVICE] Split into {len(chunks)} chunks")

            # Generate embeddings for all chunks
            if chunks and self.openai_client:
                embeddings = self.generate_embeddings(chunks)

                # Create embedding records
                for idx, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
                    kb_embedding = KnowledgeBaseEmbedding(
                        document_id=document.id,
                        chunk_text=chunk_text,
                        chunk_index=idx,
                        embedding=embedding
                    )
                    self.db.add(kb_embedding)

                print(f"[KB SERVICE] Created {len(embeddings)} embeddings")

            # Create audit log
            audit_log = KnowledgeBaseAuditLog(
                document_id=document.id,
                action='created',
                performed_by=created_by,
                changes={'title': title, 'category': category}
            )
            self.db.add(audit_log)

            self.db.commit()
            self.db.refresh(document)

            return document

        except Exception as e:
            self.db.rollback()
            print(f"[KB SERVICE] Error creating document: {e}")
            raise

    def update_document(
        self,
        document_id: int,
        updated_by: int,
        title: Optional[str] = None,
        content: Optional[str] = None,
        category: Optional[str] = None,
        subcategory: Optional[str] = None,
        fiber_ids: Optional[List[int]] = None,
        tags: Optional[List[str]] = None,
        is_published: Optional[bool] = None
    ) -> KnowledgeBaseDocument:
        """
        Update existing knowledge base document.
        Regenerates embeddings if content changes.

        Args:
            document_id: ID of document to update
            updated_by: User ID making the update
            ... other fields to update

        Returns:
            Updated KnowledgeBaseDocument
        """
        try:
            document = self.db.get(KnowledgeBaseDocument, document_id)
            if not document:
                raise ValueError(f"Document {document_id} not found")

            changes = {}
            content_changed = False

            # Update fields
            if title is not None and title != document.title:
                changes['title'] = {'old': document.title, 'new': title}
                document.title = title

            if content is not None and content != document.content:
                changes['content'] = {'old': len(document.content), 'new': len(content)}
                document.content = content
                content_changed = True

            if category is not None and category != document.category:
                changes['category'] = {'old': document.category, 'new': category}
                document.category = category

            if subcategory is not None:
                document.subcategory = subcategory

            if fiber_ids is not None:
                document.fiber_ids = fiber_ids

            if tags is not None:
                document.tags = tags

            if is_published is not None and is_published != document.is_published:
                changes['is_published'] = {'old': document.is_published, 'new': is_published}
                document.is_published = is_published

            document.updated_by = updated_by

            # If content changed, regenerate embeddings
            if content_changed and self.openai_client:
                print(f"[KB SERVICE] Content changed, regenerating embeddings for document #{document_id}")

                # Delete old embeddings
                self.db.execute(
                    delete(KnowledgeBaseEmbedding).where(
                        KnowledgeBaseEmbedding.document_id == document_id
                    )
                )

                # Create new chunks and embeddings
                chunks = self.chunk_document(document.content)
                if chunks:
                    embeddings = self.generate_embeddings(chunks)

                    for idx, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
                        kb_embedding = KnowledgeBaseEmbedding(
                            document_id=document.id,
                            chunk_text=chunk_text,
                            chunk_index=idx,
                            embedding=embedding
                        )
                        self.db.add(kb_embedding)

                    print(f"[KB SERVICE] Created {len(embeddings)} new embeddings")

            # Create audit log
            if changes:
                audit_log = KnowledgeBaseAuditLog(
                    document_id=document.id,
                    action='updated',
                    performed_by=updated_by,
                    changes=changes
                )
                self.db.add(audit_log)

            self.db.commit()
            self.db.refresh(document)

            return document

        except Exception as e:
            self.db.rollback()
            print(f"[KB SERVICE] Error updating document: {e}")
            raise

    def delete_document(self, document_id: int, deleted_by: int) -> bool:
        """
        Delete a knowledge base document and all its embeddings.

        Args:
            document_id: ID of document to delete
            deleted_by: User ID performing the deletion

        Returns:
            True if successful
        """
        try:
            document = self.db.get(KnowledgeBaseDocument, document_id)
            if not document:
                raise ValueError(f"Document {document_id} not found")

            # Create audit log before deletion
            audit_log = KnowledgeBaseAuditLog(
                document_id=document.id,
                action='deleted',
                performed_by=deleted_by,
                changes={'title': document.title}
            )
            self.db.add(audit_log)

            # Delete document (cascade will handle embeddings and attachments)
            self.db.delete(document)
            self.db.commit()

            print(f"[KB SERVICE] Deleted document #{document_id}")
            return True

        except Exception as e:
            self.db.rollback()
            print(f"[KB SERVICE] Error deleting document: {e}")
            raise

    def semantic_search(
        self,
        query: str,
        limit: int = 5,
        similarity_threshold: float = 0.6,
        category: Optional[str] = None,
        fiber_ids: Optional[List[int]] = None,
        published_only: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Perform semantic search on knowledge base using embeddings.

        Args:
            query: Search query
            limit: Maximum results
            similarity_threshold: Minimum similarity score (0-1)
            category: Filter by category
            fiber_ids: Filter by related fiber IDs
            published_only: Only search published documents

        Returns:
            List of matching documents with similarity scores
        """
        if not self.openai_client:
            print("[KB SERVICE] OpenAI client not configured")
            return []

        try:
            print(f"[KB SERVICE] Semantic search for: '{query}'")

            # Generate query embedding
            response = self.openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=query
            )
            query_embedding = response.data[0].embedding
            embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"

            # Build SQL query with filters
            where_clauses = []
            if published_only:
                where_clauses.append("d.is_published = true")
            if category:
                where_clauses.append(f"d.category = '{category}'")

            where_clause = " AND " + " AND ".join(where_clauses) if where_clauses else ""

            # Perform vector similarity search
            query_sql = f"""
                WITH ranked_chunks AS (
                    SELECT
                        e.document_id,
                        e.chunk_text,
                        e.chunk_index,
                        1 - (e.embedding <=> '{embedding_str}'::vector) as similarity,
                        d.id,
                        d.title,
                        d.category,
                        d.subcategory,
                        d.tags,
                        d.fiber_ids,
                        d.created_at,
                        d.updated_at,
                        ROW_NUMBER() OVER (PARTITION BY e.document_id ORDER BY (e.embedding <=> '{embedding_str}'::vector)) as rank
                    FROM knowledge_base_embeddings e
                    JOIN knowledge_base_documents d ON e.document_id = d.id
                    WHERE 1 - (e.embedding <=> '{embedding_str}'::vector) >= :threshold
                    {where_clause}
                )
                SELECT *
                FROM ranked_chunks
                WHERE rank = 1
                ORDER BY similarity DESC
                LIMIT :limit
            """

            result = self.db.execute(
                text(query_sql),
                {"threshold": similarity_threshold, "limit": limit}
            )

            results = []
            for row in result:
                # If fiber_ids filter provided, check if document relates to those fibers
                if fiber_ids:
                    doc_fiber_ids = row.fiber_ids or []
                    if not any(fid in fiber_ids for fid in doc_fiber_ids):
                        continue

                results.append({
                    "document_id": row.id,
                    "title": row.title,
                    "category": row.category,
                    "subcategory": row.subcategory,
                    "tags": row.tags or [],
                    "fiber_ids": row.fiber_ids or [],
                    "similarity": float(row.similarity),
                    "matched_chunk": row.chunk_text,
                    "chunk_index": row.chunk_index,
                    "created_at": row.created_at,
                    "updated_at": row.updated_at
                })

            print(f"[KB SERVICE] Found {len(results)} matching documents")
            return results

        except Exception as e:
            print(f"[KB SERVICE] Semantic search error: {e}")
            import traceback
            traceback.print_exc()
            return []

    def get_relevant_knowledge(
        self,
        query: str,
        fiber_ids: Optional[List[int]] = None,
        limit: int = 3
    ) -> str:
        """
        Get relevant knowledge base context for chatbot responses.

        Args:
            query: User's question
            fiber_ids: Related fiber IDs from fiber search
            limit: Maximum number of documents to include

        Returns:
            Formatted context string for LLM
        """
        # Search knowledge base
        results = self.semantic_search(
            query=query,
            limit=limit,
            similarity_threshold=0.5,
            fiber_ids=fiber_ids,
            published_only=True
        )

        if not results:
            return ""

        # Build context string
        context_parts = ["\n=== Knowledge Base Information ===\n"]

        for idx, result in enumerate(results, 1):
            context_parts.append(f"\n**Source {idx}: {result['title']}**")
            if result.get('category'):
                context_parts.append(f"Category: {result['category']}")
            context_parts.append(f"Relevance: {result['similarity']:.2f}")
            context_parts.append(f"\n{result['matched_chunk']}\n")

        context_parts.append("\nUse the above knowledge base information to provide accurate, detailed answers.\n")

        return "\n".join(context_parts)


def get_knowledge_base_service(db: Session) -> KnowledgeBaseService:
    """Factory function to create KnowledgeBaseService instance."""
    return KnowledgeBaseService(db)
