from sqlalchemy import (
    BigInteger, Integer, String, Text, ForeignKey, CheckConstraint, UniqueConstraint, text, CHAR, Boolean, DateTime,
    Column, DECIMAL, ARRAY, Index, func
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from datetime import datetime, timezone
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from pgvector.sqlalchemy import Vector

# --- users ---
class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("email", name="users_email_key"),
        CheckConstraint("user_type in ('super_admin','admin','client')", name="users_user_type_check"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    user_type: Mapped[str] = mapped_column(String(15), server_default=text("'client'"))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=lambda: datetime.now(timezone.utc))

    client: Mapped[Optional["Client"]] = relationship("Client", back_populates="user", uselist=False)

# --- clients ---
class Client(Base):
    __tablename__ = "clients"
    __table_args__ = (
        CheckConstraint("client_type in ('researcher','industry_expert','student','undergraduate')", name="clients_client_type_check"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    client_type: Mapped[str] = mapped_column(String(20), nullable=False)
    organization: Mapped[Optional[str]] = mapped_column(String(255))
    specialization: Mapped[Optional[str]] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates="client")
    onboarding: Mapped[Optional["ClientOnboarding"]] = relationship("ClientOnboarding", back_populates="client", uselist=False)

# --- client onboarding ---
class ClientOnboarding(Base):
    __tablename__ = "client_onboarding"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    client_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("clients.id", ondelete="CASCADE"), unique=True, nullable=False)
    answers: Mapped[dict] = mapped_column(JSONB, nullable=False)
    knowledge_level: Mapped[str] = mapped_column(String(20), nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=lambda: datetime.now(timezone.utc))

    client: Mapped["Client"] = relationship("Client", back_populates="onboarding")

# --- modules ---
class Module(Base):
    __tablename__ = "modules"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    # slug is a STORED generated column in DB; we just read it - exclude from mapped columns

    topics: Mapped[list["Topic"]] = relationship("Topic", back_populates="module", cascade="all,delete")

# --- topics ---
class Topic(Base):
    __tablename__ = "topics"
    __table_args__ = (UniqueConstraint("module_id", "name", name="topics_module_id_name_key"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    module_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("CURRENT_TIMESTAMP"))

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
    name: Mapped[str] = mapped_column(Text, nullable=False)
    definition: Mapped[Optional[str]] = mapped_column(Text)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    difficulty_level: Mapped[str] = mapped_column(Text, server_default=text("'basic'"))
    order_index: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("CURRENT_TIMESTAMP"))

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
    meta_data: Mapped[dict] = mapped_column("metadata", JSONB, server_default=text("'{}'::jsonb"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("CURRENT_TIMESTAMP"))

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


class FiberClass(Base):
    __tablename__ = "fiber_classes"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=func.current_timestamp())
    updated_at = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    fibers = relationship("Fiber", back_populates="fiber_class")
    subtypes = relationship("FiberSubtype", back_populates="fiber_class")


class FiberSubtype(Base):
    __tablename__ = "fiber_subtypes"
    
    id = Column(Integer, primary_key=True)
    class_id = Column(Integer, ForeignKey("fiber_classes.id", ondelete="CASCADE"))
    name = Column(String(100), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=func.current_timestamp())
    updated_at = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    fiber_class = relationship("FiberClass", back_populates="subtypes")
    fibers = relationship("Fiber", back_populates="subtype")
    
    __table_args__ = (
        Index('idx_fiber_subtypes_unique', 'class_id', 'name', unique=True),
    )


class SyntheticType(Base):
    __tablename__ = "synthetic_types"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=func.current_timestamp())
    
    # Relationships
    fibers = relationship("Fiber", back_populates="synthetic_type")


class PolymerizationType(Base):
    __tablename__ = "polymerization_types"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=func.current_timestamp())
    
    # Relationships
    fibers = relationship("Fiber", back_populates="polymerization_type")


class Fiber(Base):
    __tablename__ = "fibers"
    
    id = Column(Integer, primary_key=True)
    fiber_id = Column(String(50), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    
    # Classification Foreign Keys
    class_id = Column(Integer, ForeignKey("fiber_classes.id"))
    subtype_id = Column(Integer, ForeignKey("fiber_subtypes.id"))
    synthetic_type_id = Column(Integer, ForeignKey("synthetic_types.id"))
    polymerization_type_id = Column(Integer, ForeignKey("polymerization_types.id"))
    
    # Array Fields (PostgreSQL arrays)
    trade_names = Column(ARRAY(Text))
    sources = Column(ARRAY(Text))
    applications = Column(ARRAY(Text))
    manufacturing_process = Column(ARRAY(Text))
    spinning_method = Column(ARRAY(Text))
    post_treatments = Column(ARRAY(Text))
    functional_groups = Column(ARRAY(Text))
    dye_affinity = Column(ARRAY(Text))
    
    # Physical Properties (Separate min/max for ranges)
    density_g_cm3 = Column(DECIMAL(8, 3))
    fineness_min_um = Column(DECIMAL(8, 2))
    fineness_max_um = Column(DECIMAL(8, 2))
    staple_length_min_mm = Column(DECIMAL(10, 2))
    staple_length_max_mm = Column(DECIMAL(10, 2))
    tenacity_min_cn_tex = Column(DECIMAL(8, 2))
    tenacity_max_cn_tex = Column(DECIMAL(8, 2))
    elongation_min_percent = Column(DECIMAL(6, 2))
    elongation_max_percent = Column(DECIMAL(6, 2))
    moisture_regain_percent = Column(DECIMAL(5, 2))
    absorption_capacity_percent = Column(DECIMAL(6, 2))
    
    # Chemical Properties
    polymer_composition = Column(Text)
    degree_of_polymerization = Column(String(100))
    acid_resistance = Column(String(100))
    alkali_resistance = Column(String(100))
    microbial_resistance = Column(String(100))
    
    # Thermal Properties
    thermal_properties = Column(Text)
    glass_transition_temp_c = Column(DECIMAL(6, 2))
    melting_point_c = Column(DECIMAL(6, 2))
    decomposition_temp_c = Column(DECIMAL(6, 2))

    # Mechanical Properties
    elastic_modulus_min_gpa = Column(DECIMAL(8, 2))
    elastic_modulus_max_gpa = Column(DECIMAL(8, 2))

    # Structure
    repeating_unit = Column(Text)
    molecular_structure_smiles = Column(Text)
    structure_image_cms_id = Column(String(255))
    structure_image_url = Column(Text)
    
    # Sustainability
    biodegradability = Column(Boolean)
    sustainability_notes = Column(Text)
    environmental_impact_score = Column(Integer)
    
    # Identification and Testing
    identification_methods = Column(Text)
    property_analysis_methods = Column(Text)
    
    # Metadata
    data_source = Column(String(100), default="Excel Import")
    data_quality_score = Column(Integer, default=3)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.current_timestamp())
    updated_at = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationships
    fiber_class = relationship("FiberClass", back_populates="fibers")
    subtype = relationship("FiberSubtype", back_populates="fibers")
    synthetic_type = relationship("SyntheticType", back_populates="fibers")
    polymerization_type = relationship("PolymerizationType", back_populates="fibers")
    embeddings = relationship("FiberEmbedding", back_populates="fiber")
    properties = relationship("FiberProperty", back_populates="fiber")
    applications_rel = relationship("FiberApplication", back_populates="fiber")


class ApplicationCategory(Base):
    __tablename__ = "application_categories"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    parent_id = Column(Integer, ForeignKey("application_categories.id"))
    level = Column(Integer, default=1)
    description = Column(Text)
    industry_sector = Column(String(100))
    created_at = Column(DateTime, default=func.current_timestamp())
    
    # Self-referential relationship
    parent = relationship("ApplicationCategory", remote_side=[id])
    children = relationship("ApplicationCategory")
    
    # Relationships
    fiber_applications = relationship("FiberApplication", back_populates="application")


class FiberApplication(Base):
    __tablename__ = "fiber_applications"
    
    id = Column(Integer, primary_key=True)
    fiber_id = Column(Integer, ForeignKey("fibers.id", ondelete="CASCADE"))
    application_id = Column(Integer, ForeignKey("application_categories.id"))
    performance_rating = Column(Integer)
    market_share_percent = Column(DECIMAL(5, 2))
    usage_notes = Column(Text)
    advantages = Column(ARRAY(Text))
    limitations = Column(ARRAY(Text))
    created_at = Column(DateTime, default=func.current_timestamp())
    
    # Relationships
    fiber = relationship("Fiber", back_populates="applications_rel")
    application = relationship("ApplicationCategory", back_populates="fiber_applications")
    
    __table_args__ = (
        Index('idx_fiber_application_unique', 'fiber_id', 'application_id', unique=True),
    )


class PropertyCategory(Base):
    __tablename__ = "property_categories"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    unit_type = Column(String(50))  # 'numeric', 'text', 'range', 'categorical'
    
    # Relationships
    properties = relationship("PropertyDefinition", back_populates="category")


class PropertyDefinition(Base):
    __tablename__ = "property_definitions"
    
    id = Column(Integer, primary_key=True)
    category_id = Column(Integer, ForeignKey("property_categories.id"))
    property_name = Column(String(100), unique=True, nullable=False)
    display_name = Column(String(150))
    unit = Column(String(20))
    data_type = Column(String(20), default="numeric")
    min_value = Column(DECIMAL(15, 6))
    max_value = Column(DECIMAL(15, 6))
    allowed_values = Column(ARRAY(Text))
    description = Column(Text)
    test_method = Column(String(200))
    standard_reference = Column(String(100))
    
    # Relationships
    category = relationship("PropertyCategory", back_populates="properties")
    fiber_properties = relationship("FiberProperty", back_populates="property_definition")


class FiberProperty(Base):
    __tablename__ = "fiber_properties"
    
    id = Column(Integer, primary_key=True)
    fiber_id = Column(Integer, ForeignKey("fibers.id", ondelete="CASCADE"))
    property_id = Column(Integer, ForeignKey("property_definitions.id"))
    
    # Different value types
    numeric_value = Column(DECIMAL(15, 6))
    range_min = Column(DECIMAL(15, 6))
    range_max = Column(DECIMAL(15, 6))
    text_value = Column(Text)
    boolean_value = Column(Boolean)
    
    # Metadata
    measurement_conditions = Column(Text)
    test_method_used = Column(String(200))
    source = Column(String(200))
    confidence_level = Column(Integer, default=3)
    created_at = Column(DateTime, default=func.current_timestamp())
    
    # Relationships
    fiber = relationship("Fiber", back_populates="properties")
    property_definition = relationship("PropertyDefinition", back_populates="fiber_properties")
    
    __table_args__ = (
        Index('idx_fiber_property_unique', 'fiber_id', 'property_id', unique=True),
    )


class FiberEmbedding(Base):
    __tablename__ = "fiber_embeddings"
    
    id = Column(Integer, primary_key=True)
    fiber_id = Column(Integer, ForeignKey("fibers.id", ondelete="CASCADE"))
    content_type = Column(String(50), nullable=False)
    content_text = Column(Text, nullable=False)
    embedding = Column(Vector(1536))  # OpenAI embeddings
    embedding_model = Column(String(100), default="text-embedding-3-small")
    created_at = Column(DateTime, default=func.current_timestamp())
    
    # Relationships
    fiber = relationship("Fiber", back_populates="embeddings")
    
    __table_args__ = (
        Index('idx_fiber_embedding_unique', 'fiber_id', 'content_type', unique=True),
    )


class UserInteraction(Base):
    __tablename__ = "user_interactions"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)  # Reference to external user system
    session_id = Column(String(100))
    interaction_type = Column(String(50))  # 'search', 'view', 'compare', etc.
    target_type = Column(String(50))  # 'fiber', 'module', 'property'
    target_id = Column(Integer)
    interaction_data = Column(Text)  # JSON data as text
    response_time_ms = Column(Integer)
    created_at = Column(DateTime, default=func.current_timestamp())


class ChatbotConversation(Base):
    __tablename__ = "chatbot_conversations"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    session_id = Column(String(100), nullable=False, unique=True)
    messages = Column(JSONB, nullable=False, default=[])  # Array of {role: 'user'|'ai', content: string}
    model_used = Column(String(100))
    is_active = Column(Boolean, default=True)  # True if conversation is ongoing
    started_at = Column(DateTime, default=func.current_timestamp())
    ended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.current_timestamp())


class FiberVideoLink(Base):
    __tablename__ = "fiber_video_links"

    id = Column(Integer, primary_key=True)
    fiber_id = Column(Integer, ForeignKey("fibers.id", ondelete="CASCADE"), nullable=False)
    video_link = Column(Text, nullable=False)
    description = Column(Text)
    title = Column(String(255))
    created_at = Column(DateTime, default=func.current_timestamp())
    updated_at = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    # Relationships
    fiber = relationship("Fiber", backref="video_links")

    __table_args__ = (
        Index('idx_fiber_video_unique', 'fiber_id', 'video_link', unique=True),
    )


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True)
    fiber_id = Column(Integer, ForeignKey("fibers.id", ondelete="CASCADE"), nullable=False)
    study_group_code = Column(String(1), ForeignKey("study_groups.code"), nullable=False)
    question = Column(Text, nullable=False)
    options = Column(ARRAY(String), nullable=False)
    correct_answer = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=func.current_timestamp())
    updated_at = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    # Relationships
    fiber = relationship("Fiber", backref="questions")
    study_group = relationship("StudyGroup", backref="questions")

    __table_args__ = (
        Index('idx_questions_fiber_id', 'fiber_id'),
        Index('idx_questions_study_group_code', 'study_group_code'),
        UniqueConstraint('fiber_id', 'question', name='uq_questions_fiber_question'),
    )


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    __table_args__ = (
        Index('idx_quiz_attempts_user_id', 'user_id'),
        Index('idx_quiz_attempts_fiber_id', 'fiber_id'),
        Index('idx_quiz_attempts_user_fiber', 'user_id', 'fiber_id'),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    fiber_id = Column(Integer, ForeignKey("fibers.id", ondelete="CASCADE"), nullable=False)
    study_group_code = Column(String(1), ForeignKey("study_groups.code"), nullable=False)
    score = Column(Integer, nullable=True)  # Score out of 100
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, nullable=False, default=0)
    is_completed = Column(Boolean, default=False)
    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.current_timestamp())
    updated_at = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    # Relationships
    user = relationship("User", backref="quiz_attempts")
    fiber = relationship("Fiber", backref="quiz_attempts")
    study_group = relationship("StudyGroup", backref="quiz_attempts")
    answers = relationship("QuizAnswer", back_populates="quiz_attempt", cascade="all,delete")


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"
    __table_args__ = (
        Index('idx_quiz_answers_attempt_id', 'quiz_attempt_id'),
        Index('idx_quiz_answers_question_id', 'question_id'),
    )

    id = Column(Integer, primary_key=True)
    quiz_attempt_id = Column(Integer, ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    selected_answer = Column(String(500), nullable=True)
    is_correct = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.current_timestamp())

    # Relationships
    quiz_attempt = relationship("QuizAttempt", back_populates="answers")
    question = relationship("Question", backref="quiz_answers")


# ==================================================
# Pydantic Response Models
# ==================================================

class FiberClassResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime


class FiberSubtypeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    description: Optional[str] = None
    fiber_class: Optional[FiberClassResponse] = None


class SyntheticTypeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    description: Optional[str] = None


class PolymerizationTypeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    description: Optional[str] = None


class FiberDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    fiber_id: str
    name: str
    
    # Classifications
    fiber_class: Optional[FiberClassResponse] = None
    subtype: Optional[FiberSubtypeResponse] = None
    synthetic_type: Optional[SyntheticTypeResponse] = None
    polymerization_type: Optional[PolymerizationTypeResponse] = None
    
    # Arrays
    trade_names: Optional[List[str]] = []
    sources: Optional[List[str]] = []
    applications: Optional[List[str]] = []
    manufacturing_process: Optional[List[str]] = []
    spinning_method: Optional[List[str]] = []
    post_treatments: Optional[List[str]] = []
    functional_groups: Optional[List[str]] = []
    dye_affinity: Optional[List[str]] = []
    
    # Physical Properties
    density_g_cm3: Optional[float] = None
    fineness_min_um: Optional[float] = None
    fineness_max_um: Optional[float] = None
    staple_length_min_mm: Optional[float] = None
    staple_length_max_mm: Optional[float] = None
    tenacity_min_cn_tex: Optional[float] = None
    tenacity_max_cn_tex: Optional[float] = None
    elongation_min_percent: Optional[float] = None
    elongation_max_percent: Optional[float] = None
    moisture_regain_percent: Optional[float] = None
    absorption_capacity_percent: Optional[float] = None
    
    # Chemical Properties
    polymer_composition: Optional[str] = None
    degree_of_polymerization: Optional[str] = None
    acid_resistance: Optional[str] = None
    alkali_resistance: Optional[str] = None
    microbial_resistance: Optional[str] = None
    
    # Thermal Properties
    thermal_properties: Optional[str] = None
    glass_transition_temp_c: Optional[float] = None
    melting_point_c: Optional[float] = None
    decomposition_temp_c: Optional[float] = None

    # Mechanical Properties
    elastic_modulus_min_gpa: Optional[float] = None
    elastic_modulus_max_gpa: Optional[float] = None

    # Structure
    repeating_unit: Optional[str] = None
    molecular_structure_smiles: Optional[str] = None
    structure_image_cms_id: Optional[str] = None
    structure_image_url: Optional[str] = None
    
    # Sustainability
    biodegradability: Optional[bool] = None
    sustainability_notes: Optional[str] = None
    environmental_impact_score: Optional[int] = None
    
    # Identification
    identification_methods: Optional[str] = None
    property_analysis_methods: Optional[str] = None
    
    # Metadata
    data_quality_score: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class FiberSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    fiber_id: str
    name: str
    class_name: Optional[str] = None
    subtype_name: Optional[str] = None
    applications: Optional[List[str]] = []
    density_g_cm3: Optional[float] = None
    biodegradability: Optional[bool] = None


# ==================================================
# Pydantic Request Models
# ==================================================

class FiberSearchRequest(BaseModel):
    search_term: Optional[str] = None
    fiber_class: Optional[str] = None
    fiber_subtype: Optional[str] = None
    application_filter: Optional[str] = None
    min_density: Optional[float] = None
    max_density: Optional[float] = None
    biodegradable_only: Optional[bool] = None
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class SemanticSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    similarity_threshold: float = Field(default=0.7, ge=0.0, le=1.0)
    limit: int = Field(default=10, ge=1, le=50)


class ChatbotRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None
    user_id: Optional[int] = None
    context_fibers: Optional[List[int]] = []


class ChatbotResponse(BaseModel):
    answer: str
    confidence_score: Optional[float] = None
    related_fibers: Optional[List[FiberSummaryResponse]] = []
    session_id: str
    response_time_ms: Optional[int] = None


class UserInteractionRequest(BaseModel):
    interaction_type: str = Field(..., max_length=50)
    target_type: str = Field(..., max_length=50)
    target_id: int
    interaction_data: Optional[Dict[str, Any]] = {}
    session_id: Optional[str] = None


# ==================================================
# Search and Filter Models
# ==================================================

class FilterOption(BaseModel):
    value: str
    label: str
    count: Optional[int] = None


class SearchFilters(BaseModel):
    classes: List[FilterOption]
    subtypes: List[FilterOption]
    applications: List[FilterOption]
    synthetic_types: List[FilterOption]


class SearchResponse(BaseModel):
    fibers: List[FiberSummaryResponse]
    total_count: int
    filters: Optional[SearchFilters] = None
    search_time_ms: Optional[int] = None


class SimilarFiber(BaseModel):
    fiber_id: str
    name: str
    similarity_score: float
    content_type: str


class SimilaritySearchResponse(BaseModel):
    query: str
    similar_fibers: List[SimilarFiber]
    search_time_ms: Optional[int] = None


# ==================================================
# Analytics and Statistics Models
# ==================================================

class FiberStatistics(BaseModel):
    class_name: str
    subtype_name: Optional[str] = None
    fiber_count: int
    avg_density: Optional[float] = None
    avg_moisture_regain: Optional[float] = None
    biodegradable_count: int
    non_biodegradable_count: int


class AnalyticsResponse(BaseModel):
    total_fibers: int
    total_classes: int
    total_applications: int
    statistics_by_class: List[FiberStatistics]
    popular_searches: Optional[List[str]] = []
    recent_interactions: Optional[int] = None