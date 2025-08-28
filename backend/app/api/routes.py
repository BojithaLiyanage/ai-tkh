from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import timedelta
from app.db.session import get_db
from app.models.models import Module, Topic, Subtopic, ContentBlock, Tag, SubtopicTag, StudyGroup, SubtopicStudyGroup, User
from app.schemas.schemas import (
    ModuleCreate, ModuleRead, TopicCreate, TopicRead,
    SubtopicCreate, SubtopicRead, ContentBlockCreate, ContentBlockRead,
    TagCreate, TagRead, StudyGroupRead, UserCreate, UserLogin, UserRead, Token,
    UserUpdate, UserStats
)
from typing import List
from app.core.auth import (
    get_password_hash, verify_password, create_access_token, get_user_by_email,
    get_current_active_user, get_current_admin_user, get_current_super_admin_user
)

router = APIRouter()

@router.get("/test")
def health():
    return {"status": "ok"}

# --- Authentication ---
@router.post("/auth/signup", response_model=UserRead, status_code=201)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Only allow client signups through public endpoint
    if user_data.user_type != "client":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only client accounts can be created through signup"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        full_name=user_data.full_name,
        user_type=user_data.user_type
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/auth/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = get_user_by_email(db, user_credentials.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/auth/me", response_model=UserRead)
def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    return current_user

# Super admin only route to create admin users
@router.post("/auth/create-user", response_model=UserRead, status_code=201)
def create_user_by_super_admin(
    user_data: UserCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin_user)
):
    # Check if user already exists
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user (super admin can create any type)
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        full_name=user_data.full_name,
        user_type=user_data.user_type
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/auth/stats", response_model=UserStats)
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin_user)
):
    total_users = db.execute(select(User)).scalars().all()
    total_count = len(total_users)
    
    active_count = len([u for u in total_users if u.is_active])
    admin_count = len([u for u in total_users if u.user_type == 'admin'])
    client_count = len([u for u in total_users if u.user_type == 'client'])
    super_admin_count = len([u for u in total_users if u.user_type == 'super_admin'])
    
    return UserStats(
        total_users=total_count,
        active_users=active_count,
        admin_users=admin_count,
        client_users=client_count,
        super_admin_users=super_admin_count
    )

# List all users (Super Admin only)
@router.get("/auth/users", response_model=List[UserRead])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin_user)
):
    users = db.execute(select(User).order_by(User.created_at.desc())).scalars().all()
    return users

# Update user (Super Admin only)
@router.put("/auth/users/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin_user)
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update only provided fields
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user

# Deactivate user (Super Admin only)
@router.patch("/auth/users/{user_id}/deactivate")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin_user)
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent deactivating super admin
    if user.user_type == 'super_admin':
        raise HTTPException(status_code=400, detail="Cannot deactivate super admin")
    
    user.is_active = False
    db.commit()
    return {"message": "User deactivated successfully"}

# Activate user (Super Admin only)
@router.patch("/auth/users/{user_id}/activate")
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin_user)
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = True
    db.commit()
    return {"message": "User activated successfully"}

@router.get("/modules", response_model=list[ModuleRead])
def list_modules(db: Session = Depends(get_db)):
    rows = db.execute(select(Module).order_by(Module.order_index, Module.id)).scalars().all()
    return rows

@router.post("/modules", response_model=ModuleRead, status_code=201)
def create_module(payload: ModuleCreate, db: Session = Depends(get_db)):
    m = Module(name=payload.name, description=payload.description, order_index=payload.order_index)
    db.add(m); db.commit(); db.refresh(m)
    return m

@router.get("/modules/{module_id}/topics", response_model=list[TopicRead])
def list_topics(module_id: int, db: Session = Depends(get_db)):
    rows = db.execute(
        select(Topic).where(Topic.module_id == module_id).order_by(Topic.order_index, Topic.id)
    ).scalars().all()
    return rows

@router.post("/modules/{module_id}/topics", response_model=TopicRead, status_code=201)
def create_topic(module_id: int, payload: TopicCreate, db: Session = Depends(get_db)):
    if not db.get(Module, module_id):
        raise HTTPException(404, "Module not found")
    t = Topic(module_id=module_id, name=payload.name, description=payload.description, order_index=payload.order_index)
    db.add(t); db.commit(); db.refresh(t)
    return t

@router.get("/topics/{topic_id}/subtopics", response_model=list[SubtopicRead])
def list_subtopics(topic_id: int, db: Session = Depends(get_db)):
    rows = db.execute(
        select(Subtopic).where(Subtopic.topic_id == topic_id).order_by(Subtopic.order_index, Subtopic.id)
    ).scalars().all()
    return rows

@router.post("/topics/{topic_id}/subtopics", response_model=SubtopicRead, status_code=201)
def create_subtopic(topic_id: int, payload: SubtopicCreate, db: Session = Depends(get_db)):
    if not db.get(Topic, topic_id):
        raise HTTPException(404, "Topic not found")
    s = Subtopic(topic_id=topic_id, **payload.model_dump())
    db.add(s); db.commit(); db.refresh(s)
    return s

@router.get("/subtopics/{subtopic_id}/blocks", response_model=list[ContentBlockRead])
def list_blocks(subtopic_id: int, db: Session = Depends(get_db)):
    rows = db.execute(
        select(ContentBlock).where(ContentBlock.subtopic_id == subtopic_id).order_by(ContentBlock.position, ContentBlock.id)
    ).scalars().all()
    return rows

@router.post("/subtopics/{subtopic_id}/blocks", response_model=ContentBlockRead, status_code=201)
def create_block(subtopic_id: int, payload: ContentBlockCreate, db: Session = Depends(get_db)):
    if not db.get(Subtopic, subtopic_id):
        raise HTTPException(404, "Subtopic not found")
    b = ContentBlock(subtopic_id=subtopic_id, **payload.model_dump())
    db.add(b); db.commit(); db.refresh(b)
    return b

@router.get("/tags", response_model=list[TagRead])
def list_tags(db: Session = Depends(get_db)):
    rows = db.execute(select(Tag).order_by(Tag.id)).scalars().all()
    return rows

@router.post("/tags", response_model=TagRead, status_code=201)
def create_tag(payload: TagCreate, db: Session = Depends(get_db)):
    t = Tag(name=payload.name)
    db.add(t)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(400, "Tag may already exist")
    db.refresh(t)
    return t

@router.post("/subtopics/{subtopic_id}/tags/{tag_id}", status_code=204)
def attach_tag(subtopic_id: int, tag_id: int, db: Session = Depends(get_db)):
    if not db.get(Subtopic, subtopic_id):
        raise HTTPException(404, "Subtopic not found")
    if not db.get(Tag, tag_id):
        raise HTTPException(404, "Tag not found")
    db.merge(SubtopicTag(subtopic_id=subtopic_id, tag_id=tag_id))
    db.commit()
    return

@router.get("/study-groups", response_model=list[StudyGroupRead])
def list_groups(db: Session = Depends(get_db)):
    rows = db.execute(select(StudyGroup).order_by(StudyGroup.code)).scalars().all()
    return rows

@router.post("/subtopics/{subtopic_id}/study-groups/{code}", status_code=204)
def attach_group(subtopic_id: int, code: str, db: Session = Depends(get_db)):
    if not db.get(Subtopic, subtopic_id):
        raise HTTPException(404, "Subtopic not found")
    if not db.get(StudyGroup, code):
        raise HTTPException(404, "Study group not found")
    db.merge(SubtopicStudyGroup(subtopic_id=subtopic_id, group_code=code))
    db.commit()
    return