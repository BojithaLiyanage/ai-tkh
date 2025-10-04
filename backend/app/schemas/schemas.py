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
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None

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
class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str