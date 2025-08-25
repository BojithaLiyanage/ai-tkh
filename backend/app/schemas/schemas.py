from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional, Literal, Any
from datetime import datetime

# ---- users
UserType = Literal["admin", "normal"]

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    user_type: UserType = "normal"

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

# ---- content blocks
BlockType = Literal["text","image","list","quote","table","link","html","code"]

class ContentBlockCreate(BaseModel):
    block_type: BlockType
    body: dict
    position: int = 0
    metadata: dict = Field(default_factory=dict)

class ContentBlockRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    subtopic_id: int
    block_type: BlockType
    body: dict
    position: int
    metadata: dict

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