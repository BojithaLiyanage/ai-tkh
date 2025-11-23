from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional, Literal, Any, List
from datetime import datetime
from decimal import Decimal

# ---- users
UserType = Literal["super_admin", "admin", "client"]
ClientType = Literal["researcher", "industry_expert", "student", "undergraduate"]

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    user_type: UserType = "client"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    full_name: str
    user_type: UserType
    is_active: bool
    created_at: datetime

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    user_type: Optional[UserType] = None
    is_active: Optional[bool] = None

class UserStats(BaseModel):
    total_users: int
    active_users: int
    admin_users: int
    client_users: int
    super_admin_users: int

# ---- clients
class ClientCreate(BaseModel):
    client_type: ClientType
    organization: Optional[str] = None
    specialization: Optional[str] = None

class ClientRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    client_type: ClientType
    organization: Optional[str] = None
    specialization: Optional[str] = None
    created_at: datetime

class ClientUpdate(BaseModel):
    client_type: Optional[ClientType] = None
    organization: Optional[str] = None
    specialization: Optional[str] = None

class UserWithClientCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    user_type: UserType = "client"
    client_type: ClientType
    organization: Optional[str] = None
    specialization: Optional[str] = None

class UserWithClientRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    full_name: str
    user_type: UserType
    is_active: bool
    created_at: datetime
    client: Optional[ClientRead] = None

class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    user_type: Optional[UserType] = None
    is_active: Optional[bool] = None
    client_type: Optional[ClientType] = None
    organization: Optional[str] = None
    specialization: Optional[str] = None

# ---- client onboarding
class OnboardingAnswer(BaseModel):
    question: str
    answer: str
    score: Optional[int] = None

class ClientOnboardingCreate(BaseModel):
    answers: List[OnboardingAnswer]
    knowledge_level: str

class ClientOnboardingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    client_id: int
    answers: List[OnboardingAnswer]
    knowledge_level: str
    is_completed: bool
    created_at: datetime

class ClientOnboardingUpdate(BaseModel):
    answers: Optional[List[OnboardingAnswer]] = None
    knowledge_level: Optional[str] = None
    is_completed: Optional[bool] = None

class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: Optional[int] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class TokenData(BaseModel):
    email: Optional[str] = None
    token_type: Optional[str] = None  # "access" or "refresh"

# ---- modules
class ModuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    order_index: int = 0

class ModuleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    slug: Optional[str] = None
    name: str
    description: Optional[str] = None
    order_index: int
    created_at: datetime
    updated_at: datetime

# ---- topics
class TopicCreate(BaseModel):
    name: str
    description: Optional[str] = None
    order_index: int = 0

class TopicRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    slug: Optional[str] = None
    name: str
    description: Optional[str] = None
    order_index: int
    module_id: int
    created_at: datetime
    updated_at: datetime

# ---- subtopics
Difficulty = Literal["intro","basic","intermediate","advanced"]

class SubtopicCreate(BaseModel):
    name: str
    definition: Optional[str] = None
    notes: Optional[str] = None
    difficulty_level: Difficulty = "basic"
    order_index: int = 0

class SubtopicRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    slug: Optional[str] = None
    name: str
    definition: Optional[str] = None
    notes: Optional[str] = None
    difficulty_level: Difficulty
    order_index: int
    topic_id: int
    created_at: datetime
    updated_at: datetime

class TopicWithSubtopics(BaseModel):
    """Topic with nested subtopics"""
    model_config = ConfigDict(from_attributes=True)
    id: int
    slug: Optional[str] = None
    name: str
    description: Optional[str] = None
    order_index: int
    module_id: int
    created_at: datetime
    updated_at: datetime
    subtopics: List[SubtopicRead] = Field(default_factory=list)

class ModuleWithTopicsAndSubtopics(BaseModel):
    """Module with nested topics and subtopics"""
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: Optional[str] = None
    order_index: int
    created_at: datetime
    updated_at: datetime
    topics: List[TopicWithSubtopics] = Field(default_factory=list)

class ContentStatsResponse(BaseModel):
    """Content statistics response"""
    total_modules: int
    total_topics: int
    total_subtopics: int

# ---- content blocks
BlockType = Literal["text","image","list","quote","table","link","html","code"]

class ContentBlockCreate(BaseModel):
    block_type: BlockType
    body: dict
    position: int = 0
    meta_data: dict = Field(default_factory=dict)

class ContentBlockRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    subtopic_id: int
    block_type: BlockType
    body: dict
    position: int
    meta_data: dict
    created_at: datetime
    updated_at: datetime

# ---- tags
class TagCreate(BaseModel):
    name: str

class TagRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str

# ---- study groups
class StudyGroupRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    code: str
    name: str
    description: Optional[str] = None

# ---- fiber related schemas
class FiberClassCreate(BaseModel):
    name: str = Field(..., max_length=50)
    description: Optional[str] = None

class FiberClassRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class FiberClassUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None

class FiberSubtypeCreate(BaseModel):
    class_id: int
    name: str = Field(..., max_length=100)
    description: Optional[str] = None

class FiberSubtypeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    class_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class FiberSubtypeUpdate(BaseModel):
    class_id: Optional[int] = None
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None

class SyntheticTypeCreate(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None

class SyntheticTypeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime

class SyntheticTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None

class PolymerizationTypeCreate(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None

class PolymerizationTypeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime

class PolymerizationTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None

class FiberCreate(BaseModel):
    fiber_id: str = Field(..., max_length=50)
    name: str = Field(..., max_length=200)
    class_id: Optional[int] = None
    subtype_id: Optional[int] = None
    synthetic_type_id: Optional[int] = None
    polymerization_type_id: Optional[int] = None
    trade_names: Optional[List[str]] = []
    sources: Optional[List[str]] = []
    applications: Optional[List[str]] = []
    manufacturing_process: Optional[List[str]] = []
    spinning_method: Optional[List[str]] = []
    post_treatments: Optional[List[str]] = []
    functional_groups: Optional[List[str]] = []
    dye_affinity: Optional[List[str]] = []
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
    polymer_composition: Optional[str] = None
    degree_of_polymerization: Optional[str] = None
    acid_resistance: Optional[str] = None
    alkali_resistance: Optional[str] = None
    microbial_resistance: Optional[str] = None
    thermal_properties: Optional[str] = None
    glass_transition_temp_c: Optional[float] = None
    melting_point_c: Optional[float] = None
    decomposition_temp_c: Optional[float] = None
    elastic_modulus_min_gpa: Optional[float] = None
    elastic_modulus_max_gpa: Optional[float] = None
    repeating_unit: Optional[str] = None
    molecular_structure_smiles: Optional[str] = None
    structure_image_cms_id: Optional[str] = None
    structure_image_url: Optional[str] = None
    biodegradability: Optional[bool] = None
    sustainability_notes: Optional[str] = None
    environmental_impact_score: Optional[int] = None
    identification_methods: Optional[str] = None
    property_analysis_methods: Optional[str] = None
    data_source: str = "Manual Entry"
    data_quality_score: int = Field(default=3, ge=1, le=5)
    is_active: bool = True

class FiberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    fiber_id: str
    name: str
    class_id: Optional[int] = None
    subtype_id: Optional[int] = None
    synthetic_type_id: Optional[int] = None
    polymerization_type_id: Optional[int] = None
    fiber_class: Optional[FiberClassRead] = None
    subtype: Optional[FiberSubtypeRead] = None
    synthetic_type: Optional[SyntheticTypeRead] = None
    polymerization_type: Optional[PolymerizationTypeRead] = None
    trade_names: Optional[List[str]] = []
    sources: Optional[List[str]] = []
    applications: Optional[List[str]] = []
    manufacturing_process: Optional[List[str]] = []
    spinning_method: Optional[List[str]] = []
    post_treatments: Optional[List[str]] = []
    functional_groups: Optional[List[str]] = []
    dye_affinity: Optional[List[str]] = []
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
    polymer_composition: Optional[str] = None
    degree_of_polymerization: Optional[str] = None
    acid_resistance: Optional[str] = None
    alkali_resistance: Optional[str] = None
    microbial_resistance: Optional[str] = None
    thermal_properties: Optional[str] = None
    glass_transition_temp_c: Optional[float] = None
    melting_point_c: Optional[float] = None
    decomposition_temp_c: Optional[float] = None
    elastic_modulus_min_gpa: Optional[float] = None
    elastic_modulus_max_gpa: Optional[float] = None
    repeating_unit: Optional[str] = None
    molecular_structure_smiles: Optional[str] = None
    structure_image_cms_id: Optional[str] = None
    structure_image_url: Optional[str] = None
    biodegradability: Optional[bool] = None
    sustainability_notes: Optional[str] = None
    environmental_impact_score: Optional[int] = None
    identification_methods: Optional[str] = None
    property_analysis_methods: Optional[str] = None
    data_source: str
    data_quality_score: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

class FiberUpdate(BaseModel):
    fiber_id: Optional[str] = Field(None, max_length=50)
    name: Optional[str] = Field(None, max_length=200)
    class_id: Optional[int] = None
    subtype_id: Optional[int] = None
    synthetic_type_id: Optional[int] = None
    polymerization_type_id: Optional[int] = None
    trade_names: Optional[List[str]] = None
    sources: Optional[List[str]] = None
    applications: Optional[List[str]] = None
    manufacturing_process: Optional[List[str]] = None
    spinning_method: Optional[List[str]] = None
    post_treatments: Optional[List[str]] = None
    functional_groups: Optional[List[str]] = None
    dye_affinity: Optional[List[str]] = None
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
    polymer_composition: Optional[str] = None
    degree_of_polymerization: Optional[str] = None
    acid_resistance: Optional[str] = None
    alkali_resistance: Optional[str] = None
    microbial_resistance: Optional[str] = None
    thermal_properties: Optional[str] = None
    glass_transition_temp_c: Optional[float] = None
    melting_point_c: Optional[float] = None
    decomposition_temp_c: Optional[float] = None
    elastic_modulus_min_gpa: Optional[float] = None
    elastic_modulus_max_gpa: Optional[float] = None
    repeating_unit: Optional[str] = None
    molecular_structure_smiles: Optional[str] = None
    structure_image_cms_id: Optional[str] = None
    structure_image_url: Optional[str] = None
    biodegradability: Optional[bool] = None
    sustainability_notes: Optional[str] = None
    environmental_impact_score: Optional[int] = None
    identification_methods: Optional[str] = None
    property_analysis_methods: Optional[str] = None
    data_source: Optional[str] = None
    data_quality_score: Optional[int] = Field(None, ge=1, le=5)
    is_active: Optional[bool] = None

class FiberSummaryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    fiber_id: str
    name: str
    fiber_class: Optional[FiberClassRead] = None
    subtype: Optional[FiberSubtypeRead] = None
    applications: Optional[List[str]] = []
    created_at: datetime
    is_active: bool

# ---- chatbot
class MessageInConversation(BaseModel):
    role: str  # 'user' or 'ai'
    content: str

class ChatMessage(BaseModel):
    message: str
    conversation_id: int

class FiberCard(BaseModel):
    """Concise fiber card for display"""
    name: str
    fiber_class: Optional[str] = None
    subtype: Optional[str] = None
    description: Optional[str] = None  # Short 1-2 sentence description
    applications: Optional[List[str]] = None  # Top 3-5 applications
    trade_names: Optional[List[str]] = None  # Top 3 trade names
    key_properties: Optional[dict] = None  # {property_name: value} - only key ones

class ChatResponse(BaseModel):
    response: str  # Main AI text response
    conversation_id: int
    # Optional fiber cards for visual display
    fiber_cards: Optional[List[FiberCard]] = []
    # Structure images when user requests fiber structure diagrams
    structure_images: Optional[List[dict]] = []  # [{fiber_name: str, image_url: str, fiber_id: str}]
    # Related videos when available
    related_videos: Optional[List['VideoPreview']] = []

class StartConversationResponse(BaseModel):
    conversation_id: int
    message: str

class EndConversationResponse(BaseModel):
    conversation_id: int
    message: str
    total_messages: int

class ChatbotConversationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    messages: List[MessageInConversation]
    model_used: Optional[str] = None
    is_active: bool
    started_at: datetime
    ended_at: Optional[datetime] = None
    created_at: datetime

# ---- fiber video links
class FiberVideoLinkCreate(BaseModel):
    fiber_id: int
    video_link: str
    description: Optional[str] = None
    title: Optional[str] = None

class FiberVideoLinkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    fiber_id: int
    video_link: str
    description: Optional[str] = None
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class FiberVideoLinkUpdate(BaseModel):
    video_link: Optional[str] = None
    description: Optional[str] = None
    title: Optional[str] = None

class VideoPreview(BaseModel):
    """Video preview for chatbot responses"""
    id: int
    fiber_id: int
    fiber_name: str
    video_link: str
    title: Optional[str] = None
    description: Optional[str] = None


# ---- questions (assessments/question bank)
class QuestionCreate(BaseModel):
    fiber_id: int
    study_group_code: str = Field(..., min_length=1, max_length=1)
    question: str
    options: List[str] = Field(..., min_items=2)
    correct_answer: str

class QuestionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    fiber_id: int
    study_group_code: str
    question: str
    options: List[str]
    correct_answer: str
    created_at: datetime
    updated_at: datetime

class QuestionUpdate(BaseModel):
    question: Optional[str] = None
    options: Optional[List[str]] = Field(None, min_items=2)
    correct_answer: Optional[str] = None
    study_group_code: Optional[str] = Field(None, min_length=1, max_length=1)

class QuestionWithFiberRead(BaseModel):
    """Question with fiber details for admin view"""
    model_config = ConfigDict(from_attributes=True)
    id: int
    fiber_id: int
    fiber_name: str
    study_group_code: str
    study_group_name: str
    question: str
    options: List[str]
    correct_answer: str
    created_at: datetime
    updated_at: datetime


# ---- quiz attempts and answers
class QuizAnswerCreate(BaseModel):
    question_id: int
    selected_answer: Optional[str] = None


class QuizAnswerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    quiz_attempt_id: int
    question_id: int
    selected_answer: Optional[str] = None
    is_correct: bool
    correct_answer: Optional[str] = None
    created_at: datetime


class QuizAttemptCreate(BaseModel):
    fiber_id: int
    study_group_code: str = Field(..., min_length=1, max_length=1)


class QuizAttemptStart(BaseModel):
    """Response when starting a quiz"""
    attempt_id: int
    fiber_id: int
    fiber_name: str
    study_group_code: str
    study_group_name: str
    total_questions: int
    questions: List[dict]  # List of {id, question, options}


class QuizAnswerSubmit(BaseModel):
    """Submit quiz answers"""
    answers: List[QuizAnswerCreate]


class QuizAttemptRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    fiber_id: int
    study_group_code: str
    score: Optional[int] = None
    total_questions: int
    correct_answers: int
    is_completed: bool
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class QuizAttemptDetailRead(BaseModel):
    """Detailed quiz attempt with answers for review"""
    model_config = ConfigDict(from_attributes=True)
    id: int
    fiber_id: int
    fiber_name: str
    study_group_code: str
    study_group_name: str
    score: Optional[int] = None
    total_questions: int
    correct_answers: int
    is_completed: bool
    submitted_at: Optional[datetime] = None
    created_at: datetime
    answers: List[QuizAnswerRead]


class QuizResultsResponse(BaseModel):
    """Quiz completion response"""
    attempt_id: int
    score: int
    total_questions: int
    correct_answers: int
    percentage: float
    message: str


class FiberQuizCard(BaseModel):
    """Card representation of a fiber quiz"""
    fiber_id: int
    fiber_name: str
    study_group_code: str
    study_group_name: str
    question_count: int
    is_completed: bool
    last_score: Optional[int] = None
    last_attempt_date: Optional[datetime] = None


class QuizListResponse(BaseModel):
    """List of available quizzes for a user"""
    quizzes: List[FiberQuizCard]
    total_available: int
    completed_count: int