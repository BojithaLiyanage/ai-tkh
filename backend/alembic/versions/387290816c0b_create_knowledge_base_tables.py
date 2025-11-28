"""create_knowledge_base_tables

Revision ID: 387290816c0b
Revises: s7t8u9v0w1x2
Create Date: 2025-11-28 00:22:39.838868

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from pgvector.sqlalchemy import Vector


# revision identifiers, used by Alembic.
revision: str = '387290816c0b'
down_revision: Union[str, None] = 's7t8u9v0w1x2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create knowledge_base_documents table
    op.create_table(
        'knowledge_base_documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('subcategory', sa.String(length=100), nullable=True),
        sa.Column('fiber_ids', ARRAY(sa.Integer()), nullable=True),
        sa.Column('tags', ARRAY(sa.String(100)), nullable=True),
        sa.Column('is_published', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_by', sa.BigInteger(), nullable=True),
        sa.Column('updated_by', sa.BigInteger(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], name='fk_kb_docs_created_by'),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], name='fk_kb_docs_updated_by')
    )

    # Create indexes for knowledge_base_documents
    op.create_index('idx_kb_docs_category', 'knowledge_base_documents', ['category'])
    op.create_index('idx_kb_docs_is_published', 'knowledge_base_documents', ['is_published'])
    op.create_index('idx_kb_docs_created_at', 'knowledge_base_documents', ['created_at'])

    # Create knowledge_base_embeddings table
    op.create_table(
        'knowledge_base_embeddings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=False),
        sa.Column('chunk_text', sa.Text(), nullable=False),
        sa.Column('chunk_index', sa.Integer(), nullable=False),
        sa.Column('embedding', Vector(1536), nullable=True),
        sa.Column('embedding_model', sa.String(length=100), server_default='text-embedding-3-small', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['document_id'], ['knowledge_base_documents.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('document_id', 'chunk_index', name='uq_kb_embeddings_doc_chunk')
    )

    # Create vector index for embeddings (using ivfflat for performance)
    op.execute('CREATE INDEX idx_kb_embeddings_vector ON knowledge_base_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)')

    # Create knowledge_base_attachments table
    op.create_table(
        'knowledge_base_attachments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_type', sa.String(length=50), nullable=True),
        sa.Column('file_url', sa.Text(), nullable=False),
        sa.Column('cloudinary_id', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['document_id'], ['knowledge_base_documents.id'], ondelete='CASCADE')
    )

    # Create knowledge_base_audit_log table
    op.create_table(
        'knowledge_base_audit_log',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('performed_by', sa.BigInteger(), nullable=True),
        sa.Column('changes', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['document_id'], ['knowledge_base_documents.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['performed_by'], ['users.id'], ondelete='SET NULL')
    )

    # Create index for audit log
    op.create_index('idx_kb_audit_document_id', 'knowledge_base_audit_log', ['document_id'])
    op.create_index('idx_kb_audit_created_at', 'knowledge_base_audit_log', ['created_at'])


def downgrade() -> None:
    # Drop tables in reverse order (to handle foreign keys)
    op.drop_table('knowledge_base_audit_log')
    op.drop_table('knowledge_base_attachments')
    op.drop_table('knowledge_base_embeddings')
    op.drop_table('knowledge_base_documents')
