from typing import Optional
from sqlalchemy import (
    BigInteger, Integer, String, Text, ForeignKey, CheckConstraint, UniqueConstraint, JSON, text, CHAR
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

# --- modules ---
class Module(Base):
    __tablename__ = "modules"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    # slug is a STORED generated column in DB; we just read it
    slug: Mapped[Optional[str]] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    # created_at / updated_at exist in DB; include as readable columns (optional)
    # You can add them as mapped fields if you want to read them.

    topics: Mapped[list["Topic"]] = relationship("Topic", back_populates="module", cascade="all,delete")

# --- topics ---
class Topic(Base):
    __tablename__ = "topics"
    __table_args__ = (UniqueConstraint("module_id", "name", name="topics_module_id_name_key"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    module_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    slug: Mapped[Optional[str]] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(Integer, server_default=text("0"))

    module: Mapped["Module"] = relationship("Module", back_populates="topics")
    subtopics: Mapped[list["Subtopic"]] = relationship("Subtopic", back_populates="topic", cascade="all,delete")

# --- subtopics ---
class Subtopic(Base):
    __tablename__ = "subtopics"
    __table_args__ = (
        UniqueConstraint("topic_id", "name", name="subtopics_topic_id_name_key"),
        CheckConstraint("difficulty_level in ('intro','basic','intermediate','advanced')",
                        name="subtopics_difficulty_level_check"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    topic_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    slug: Mapped[Optional[str]] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    definition: Mapped[Optional[str]] = mapped_column(Text)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    difficulty_level: Mapped[str] = mapped_column(Text, server_default=text("'basic'"))
    order_index: Mapped[int] = mapped_column(Integer, server_default=text("0"))

    topic: Mapped["Topic"] = relationship("Topic", back_populates="subtopics")
    blocks: Mapped[list["ContentBlock"]] = relationship("ContentBlock", back_populates="subtopic", cascade="all,delete")
    tags: Mapped[list["Tag"]] = relationship("Tag", secondary="subtopic_tags", back_populates="subtopics")
    study_groups: Mapped[list["StudyGroup"]] = relationship(
        "StudyGroup", secondary="subtopic_study_groups", back_populates="subtopics"
    )

# --- content_blocks ---
class ContentBlock(Base):
    __tablename__ = "content_blocks"
    __table_args__ = (
        CheckConstraint(
            "block_type in ('text','image','list','quote','table','link','html','code')",
            name="content_blocks_block_type_check"
        ),
        UniqueConstraint("subtopic_id", "position", name="uq_content_blocks_subtopic_position"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    subtopic_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("subtopics.id", ondelete="CASCADE"), nullable=False)
    block_type: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[dict] = mapped_column(JSONB, nullable=False)
    position: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    meta_data : Mapped[dict] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))

    subtopic: Mapped["Subtopic"] = relationship("Subtopic", back_populates="blocks")

# --- tags ---
class Tag(Base):
    __tablename__ = "tags"
    __table_args__ = (UniqueConstraint("name", name="tags_name_key"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)

    subtopics: Mapped[list["Subtopic"]] = relationship("Subtopic", secondary="subtopic_tags", back_populates="tags")

class SubtopicTag(Base):
    __tablename__ = "subtopic_tags"
    subtopic_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("subtopics.id", ondelete="CASCADE"), primary_key=True)
    tag_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)

# --- study groups ---
class StudyGroup(Base):
    __tablename__ = "study_groups"

    code: Mapped[str] = mapped_column(CHAR(1), primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)

    subtopics: Mapped[list["Subtopic"]] = relationship(
        "Subtopic", secondary="subtopic_study_groups", back_populates="study_groups"
    )

class SubtopicStudyGroup(Base):
    __tablename__ = "subtopic_study_groups"
    subtopic_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("subtopics.id", ondelete="CASCADE"), primary_key=True)
    group_code: Mapped[str] = mapped_column(CHAR(1), ForeignKey("study_groups.code", ondelete="RESTRICT"), primary_key=True)
