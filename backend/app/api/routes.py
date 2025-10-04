from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from datetime import timedelta
from app.db.session import get_db
from app.models.models import (
    Module, Topic, Subtopic, ContentBlock, Tag, SubtopicTag, StudyGroup, SubtopicStudyGroup, User, Client, ClientOnboarding,
    FiberClass, FiberSubtype, SyntheticType, PolymerizationType, Fiber, ChatbotConversation
)
from app.schemas.schemas import (
    ModuleCreate, ModuleRead, TopicCreate, TopicRead,
    SubtopicCreate, SubtopicRead, ContentBlockCreate, ContentBlockRead,
    TagCreate, TagRead, StudyGroupRead, UserCreate, UserLogin, UserRead, Token,
    UserUpdate, UserStats, ClientCreate, ClientRead, ClientUpdate, UserWithClientCreate, UserWithClientRead, AdminUserUpdate,
    ClientOnboardingCreate, ClientOnboardingRead, ClientOnboardingUpdate,
    FiberClassCreate, FiberClassRead, FiberClassUpdate,
    FiberSubtypeCreate, FiberSubtypeRead, FiberSubtypeUpdate,
    SyntheticTypeCreate, SyntheticTypeRead, SyntheticTypeUpdate,
    PolymerizationTypeCreate, PolymerizationTypeRead, PolymerizationTypeUpdate,
    FiberCreate, FiberRead, FiberUpdate, FiberSummaryRead,
    ChatMessage, ChatResponse, ChatbotConversationRead, StartConversationResponse, EndConversationResponse
)
from typing import List
from app.core.auth import (
    get_password_hash, verify_password, create_access_token, get_user_by_email,
    get_current_active_user, get_current_admin_user, get_current_super_admin_user
)
from app.services.cloudinary import get_cloudinary_service
from app.core.config import settings

router = APIRouter()

@router.get("/test")
def health():
    return {"status": "ok"}

# --- Authentication ---
@router.post("/auth/signup", response_model=UserWithClientRead, status_code=201)
def signup(user_data: UserWithClientCreate, db: Session = Depends(get_db)):
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
    
    # Create client record
    db_client = Client(
        user_id=db_user.id,
        client_type=user_data.client_type,
        organization=user_data.organization,
        specialization=user_data.specialization
    )
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    
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
@router.post("/auth/create-user", response_model=UserWithClientRead, status_code=201)
def create_user_by_super_admin(
    user_data: UserWithClientCreate, 
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
    
    # Create client record if user is a client
    if user_data.user_type == "client":
        db_client = Client(
            user_id=db_user.id,
            client_type=user_data.client_type,
            organization=user_data.organization,
            specialization=user_data.specialization
        )
        db.add(db_client)
        db.commit()
        db.refresh(db_client)
    
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
@router.get("/auth/users", response_model=List[UserWithClientRead])
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

# Update user with client data (Admin and Super Admin)
@router.put("/auth/users/{user_id}/admin-update", response_model=UserWithClientRead)
def admin_update_user(
    user_id: int,
    user_update: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update user fields
    user_fields = {'full_name', 'user_type', 'is_active'}
    update_data = user_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field in user_fields:
            setattr(user, field, value)

    # Handle client data
    client_fields = {'client_type', 'organization', 'specialization'}
    client_data = {k: v for k, v in update_data.items() if k in client_fields}

    if client_data:
        # Get or create client record
        client = user.client
        if not client and user.user_type == "client":
            # Create client record if user is client but no client record exists
            client = Client(user_id=user.id)
            db.add(client)

        if client:
            for field, value in client_data.items():
                setattr(client, field, value)

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

# Client management routes
@router.get("/auth/clients", response_model=List[ClientRead])
def list_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    clients = db.execute(select(Client).order_by(Client.created_at.desc())).scalars().all()
    return clients

@router.get("/auth/clients/{client_id}", response_model=ClientRead)
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client

@router.put("/auth/clients/{client_id}", response_model=ClientRead)
def update_client(
    client_id: int,
    client_update: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Update only provided fields
    update_data = client_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)
    
    db.commit()
    db.refresh(client)
    return client

@router.get("/modules", response_model=list[ModuleRead])
def list_modules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    rows = db.execute(select(Module).order_by(Module.order_index, Module.id)).scalars().all()
    return rows

@router.post("/modules", response_model=ModuleRead, status_code=201)
def create_module(
    payload: ModuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    # Auto-assign order_index if not provided or is 0
    order_index = payload.order_index
    if order_index == 0:
        max_order = db.execute(select(Module.order_index).order_by(Module.order_index.desc())).first()
        order_index = (max_order[0] + 1) if max_order and max_order[0] is not None else 1

    m = Module(name=payload.name, description=payload.description, order_index=order_index)
    db.add(m); db.commit(); db.refresh(m)
    return m

@router.put("/modules/{module_id}", response_model=ModuleRead)
def update_module(
    module_id: int,
    payload: ModuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    module = db.get(Module, module_id)
    if not module:
        raise HTTPException(404, "Module not found")

    module.name = payload.name
    module.description = payload.description
    module.order_index = payload.order_index
    db.commit()
    db.refresh(module)
    return module

@router.delete("/modules/{module_id}", status_code=204)
def delete_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    module = db.get(Module, module_id)
    if not module:
        raise HTTPException(404, "Module not found")

    db.delete(module)
    db.commit()
    return

@router.get("/modules/{module_id}/topics", response_model=list[TopicRead])
def list_topics(
    module_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    rows = db.execute(
        select(Topic).where(Topic.module_id == module_id).order_by(Topic.order_index, Topic.id)
    ).scalars().all()
    return rows

@router.post("/modules/{module_id}/topics", response_model=TopicRead, status_code=201)
def create_topic(
    module_id: int, 
    payload: TopicCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    if not db.get(Module, module_id):
        raise HTTPException(404, "Module not found")
    
    # Auto-assign order_index if not provided or is 0
    order_index = payload.order_index
    if order_index == 0:
        max_order = db.execute(
            select(Topic.order_index)
            .where(Topic.module_id == module_id)
            .order_by(Topic.order_index.desc())
        ).first()
        order_index = (max_order[0] + 1) if max_order and max_order[0] is not None else 1
    
    t = Topic(module_id=module_id, name=payload.name, description=payload.description, order_index=order_index)
    db.add(t); db.commit(); db.refresh(t)
    return t

@router.put("/topics/{topic_id}", response_model=TopicRead)
def update_topic(
    topic_id: int,
    payload: TopicCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    topic = db.get(Topic, topic_id)
    if not topic:
        raise HTTPException(404, "Topic not found")

    topic.name = payload.name
    topic.description = payload.description
    topic.order_index = payload.order_index
    db.commit()
    db.refresh(topic)
    return topic

@router.delete("/topics/{topic_id}", status_code=204)
def delete_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    topic = db.get(Topic, topic_id)
    if not topic:
        raise HTTPException(404, "Topic not found")

    db.delete(topic)
    db.commit()
    return

@router.get("/topics/{topic_id}/subtopics", response_model=list[SubtopicRead])
def list_subtopics(
    topic_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    rows = db.execute(
        select(Subtopic).where(Subtopic.topic_id == topic_id).order_by(Subtopic.order_index, Subtopic.id)
    ).scalars().all()
    return rows

@router.post("/topics/{topic_id}/subtopics", response_model=SubtopicRead, status_code=201)
def create_subtopic(
    topic_id: int, 
    payload: SubtopicCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    if not db.get(Topic, topic_id):
        raise HTTPException(404, "Topic not found")
    
    # Auto-assign order_index if not provided or is 0
    order_index = payload.order_index
    if order_index == 0:
        max_order = db.execute(
            select(Subtopic.order_index)
            .where(Subtopic.topic_id == topic_id)
            .order_by(Subtopic.order_index.desc())
        ).first()
        order_index = (max_order[0] + 1) if max_order and max_order[0] is not None else 1
    
    # Create subtopic with auto-assigned order_index
    subtopic_data = payload.model_dump()
    subtopic_data['order_index'] = order_index
    s = Subtopic(topic_id=topic_id, **subtopic_data)
    db.add(s); db.commit(); db.refresh(s)
    return s

@router.put("/subtopics/{subtopic_id}", response_model=SubtopicRead)
def update_subtopic(
    subtopic_id: int,
    payload: SubtopicCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    subtopic = db.get(Subtopic, subtopic_id)
    if not subtopic:
        raise HTTPException(404, "Subtopic not found")

    subtopic.name = payload.name
    subtopic.definition = payload.definition
    subtopic.notes = payload.notes
    subtopic.difficulty_level = payload.difficulty_level
    subtopic.order_index = payload.order_index
    db.commit()
    db.refresh(subtopic)
    return subtopic

@router.delete("/subtopics/{subtopic_id}", status_code=204)
def delete_subtopic(
    subtopic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    subtopic = db.get(Subtopic, subtopic_id)
    if not subtopic:
        raise HTTPException(404, "Subtopic not found")

    db.delete(subtopic)
    db.commit()
    return

@router.get("/subtopics/{subtopic_id}/blocks", response_model=list[ContentBlockRead])
def list_blocks(
    subtopic_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    rows = db.execute(
        select(ContentBlock).where(ContentBlock.subtopic_id == subtopic_id).order_by(ContentBlock.position, ContentBlock.id)
    ).scalars().all()
    return rows

@router.post("/subtopics/{subtopic_id}/blocks", response_model=ContentBlockRead, status_code=201)
def create_block(
    subtopic_id: int, 
    payload: ContentBlockCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    if not db.get(Subtopic, subtopic_id):
        raise HTTPException(404, "Subtopic not found")
    b = ContentBlock(subtopic_id=subtopic_id, **payload.model_dump())
    db.add(b); db.commit(); db.refresh(b)
    return b

@router.get("/tags", response_model=list[TagRead])
def list_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    rows = db.execute(select(Tag).order_by(Tag.id)).scalars().all()
    return rows

@router.post("/tags", response_model=TagRead, status_code=201)
def create_tag(
    payload: TagCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
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
def attach_tag(
    subtopic_id: int, 
    tag_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    if not db.get(Subtopic, subtopic_id):
        raise HTTPException(404, "Subtopic not found")
    if not db.get(Tag, tag_id):
        raise HTTPException(404, "Tag not found")
    db.merge(SubtopicTag(subtopic_id=subtopic_id, tag_id=tag_id))
    db.commit()
    return

@router.get("/study-groups", response_model=list[StudyGroupRead])
def list_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    rows = db.execute(select(StudyGroup).order_by(StudyGroup.code)).scalars().all()
    return rows

@router.post("/subtopics/{subtopic_id}/study-groups/{code}", status_code=204)
def attach_group(
    subtopic_id: int, 
    code: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    if not db.get(Subtopic, subtopic_id):
        raise HTTPException(404, "Subtopic not found")
    if not db.get(StudyGroup, code):
        raise HTTPException(404, "Study group not found")
    db.merge(SubtopicStudyGroup(subtopic_id=subtopic_id, group_code=code))
    db.commit()
    return

# --- Client Onboarding ---
@router.post("/auth/onboarding", response_model=ClientOnboardingRead, status_code=201)
def create_onboarding(
    payload: ClientOnboardingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Ensure user is a client and has client record
    if current_user.user_type != "client" or not current_user.client:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only clients can complete onboarding"
        )

    # Check if onboarding already exists
    existing_onboarding = db.execute(
        select(ClientOnboarding).where(ClientOnboarding.client_id == current_user.client.id)
    ).scalar_one_or_none()

    if existing_onboarding:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Onboarding already completed"
        )

    # Create new onboarding record
    onboarding_data = payload.model_dump()
    onboarding_data['client_id'] = current_user.client.id
    onboarding_data['is_completed'] = True

    onboarding = ClientOnboarding(**onboarding_data)
    db.add(onboarding)

    try:
        db.commit()
        db.refresh(onboarding)
        return onboarding
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to save onboarding data")

@router.get("/auth/onboarding", response_model=ClientOnboardingRead)
def get_onboarding(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Ensure user is a client and has client record
    if current_user.user_type != "client" or not current_user.client:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only clients can access onboarding data"
        )

    onboarding = db.execute(
        select(ClientOnboarding).where(ClientOnboarding.client_id == current_user.client.id)
    ).scalar_one_or_none()

    if not onboarding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding not found"
        )

    return onboarding

@router.get("/auth/onboarding/status")
def get_onboarding_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Ensure user is a client and has client record
    if current_user.user_type != "client" or not current_user.client:
        return {"is_completed": False, "needs_onboarding": False}

    onboarding = db.execute(
        select(ClientOnboarding).where(ClientOnboarding.client_id == current_user.client.id)
    ).scalar_one_or_none()

    return {
        "is_completed": onboarding.is_completed if onboarding else False,
        "needs_onboarding": not (onboarding and onboarding.is_completed),
        "knowledge_level": onboarding.knowledge_level if onboarding else None
    }

# ===== FIBER DATABASE MANAGEMENT ROUTES =====
# These routes allow admin and super admin users to manage the fiber database

# --- Fiber Classes ---
@router.get("/fiber/classes", response_model=List[FiberClassRead])
def list_fiber_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    classes = db.execute(select(FiberClass).order_by(FiberClass.name)).scalars().all()
    return classes

@router.post("/fiber/classes", response_model=FiberClassRead, status_code=201)
def create_fiber_class(
    payload: FiberClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    fiber_class = FiberClass(**payload.model_dump())
    db.add(fiber_class)
    try:
        db.commit()
        db.refresh(fiber_class)
        return fiber_class
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Fiber class with this name may already exist")

@router.put("/fiber/classes/{class_id}", response_model=FiberClassRead)
def update_fiber_class(
    class_id: int,
    payload: FiberClassUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    fiber_class = db.get(FiberClass, class_id)
    if not fiber_class:
        raise HTTPException(status_code=404, detail="Fiber class not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(fiber_class, field, value)

    try:
        db.commit()
        db.refresh(fiber_class)
        return fiber_class
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Update failed - name may already exist")

@router.delete("/fiber/classes/{class_id}")
def delete_fiber_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    fiber_class = db.get(FiberClass, class_id)
    if not fiber_class:
        raise HTTPException(status_code=404, detail="Fiber class not found")

    try:
        db.delete(fiber_class)
        db.commit()
        return {"message": "Fiber class deleted successfully"}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Cannot delete - fiber class may be in use")

# --- Fiber Subtypes ---
@router.get("/fiber/subtypes", response_model=List[FiberSubtypeRead])
def list_fiber_subtypes(
    class_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = select(FiberSubtype).options(
        joinedload(FiberSubtype.fiber_class)
    ).order_by(FiberSubtype.name)
    if class_id:
        query = query.where(FiberSubtype.class_id == class_id)
    subtypes = db.execute(query).scalars().all()
    return subtypes

@router.post("/fiber/subtypes", response_model=FiberSubtypeRead, status_code=201)
def create_fiber_subtype(
    payload: FiberSubtypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    # Check if fiber class exists
    if not db.get(FiberClass, payload.class_id):
        raise HTTPException(status_code=400, detail="Fiber class not found")

    fiber_subtype = FiberSubtype(**payload.model_dump())
    db.add(fiber_subtype)
    try:
        db.commit()
        db.refresh(fiber_subtype)
        return fiber_subtype
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Subtype with this name may already exist for this class")

@router.put("/fiber/subtypes/{subtype_id}", response_model=FiberSubtypeRead)
def update_fiber_subtype(
    subtype_id: int,
    payload: FiberSubtypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    fiber_subtype = db.get(FiberSubtype, subtype_id)
    if not fiber_subtype:
        raise HTTPException(status_code=404, detail="Fiber subtype not found")

    update_data = payload.model_dump(exclude_unset=True)

    # Check if new class_id exists
    if 'class_id' in update_data and not db.get(FiberClass, update_data['class_id']):
        raise HTTPException(status_code=400, detail="Fiber class not found")

    for field, value in update_data.items():
        setattr(fiber_subtype, field, value)

    try:
        db.commit()
        db.refresh(fiber_subtype)
        return fiber_subtype
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Update failed - name may already exist for this class")

@router.delete("/fiber/subtypes/{subtype_id}")
def delete_fiber_subtype(
    subtype_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    fiber_subtype = db.get(FiberSubtype, subtype_id)
    if not fiber_subtype:
        raise HTTPException(status_code=404, detail="Fiber subtype not found")

    try:
        db.delete(fiber_subtype)
        db.commit()
        return {"message": "Fiber subtype deleted successfully"}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Cannot delete - subtype may be in use")

# --- Synthetic Types ---
@router.get("/fiber/synthetic-types", response_model=List[SyntheticTypeRead])
def list_synthetic_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    types = db.execute(select(SyntheticType).order_by(SyntheticType.name)).scalars().all()
    return types

@router.post("/fiber/synthetic-types", response_model=SyntheticTypeRead, status_code=201)
def create_synthetic_type(
    payload: SyntheticTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    synthetic_type = SyntheticType(**payload.model_dump())
    db.add(synthetic_type)
    try:
        db.commit()
        db.refresh(synthetic_type)
        return synthetic_type
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Synthetic type with this name may already exist")

@router.put("/fiber/synthetic-types/{type_id}", response_model=SyntheticTypeRead)
def update_synthetic_type(
    type_id: int,
    payload: SyntheticTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    synthetic_type = db.get(SyntheticType, type_id)
    if not synthetic_type:
        raise HTTPException(status_code=404, detail="Synthetic type not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(synthetic_type, field, value)

    try:
        db.commit()
        db.refresh(synthetic_type)
        return synthetic_type
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Update failed - name may already exist")

@router.delete("/fiber/synthetic-types/{type_id}")
def delete_synthetic_type(
    type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    synthetic_type = db.get(SyntheticType, type_id)
    if not synthetic_type:
        raise HTTPException(status_code=404, detail="Synthetic type not found")

    try:
        db.delete(synthetic_type)
        db.commit()
        return {"message": "Synthetic type deleted successfully"}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Cannot delete - type may be in use")

# --- Polymerization Types ---
@router.get("/fiber/polymerization-types", response_model=List[PolymerizationTypeRead])
def list_polymerization_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    types = db.execute(select(PolymerizationType).order_by(PolymerizationType.name)).scalars().all()
    return types

@router.post("/fiber/polymerization-types", response_model=PolymerizationTypeRead, status_code=201)
def create_polymerization_type(
    payload: PolymerizationTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    polymerization_type = PolymerizationType(**payload.model_dump())
    db.add(polymerization_type)
    try:
        db.commit()
        db.refresh(polymerization_type)
        return polymerization_type
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Polymerization type with this name may already exist")

@router.put("/fiber/polymerization-types/{type_id}", response_model=PolymerizationTypeRead)
def update_polymerization_type(
    type_id: int,
    payload: PolymerizationTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    polymerization_type = db.get(PolymerizationType, type_id)
    if not polymerization_type:
        raise HTTPException(status_code=404, detail="Polymerization type not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(polymerization_type, field, value)

    try:
        db.commit()
        db.refresh(polymerization_type)
        return polymerization_type
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Update failed - name may already exist")

@router.delete("/fiber/polymerization-types/{type_id}")
def delete_polymerization_type(
    type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    polymerization_type = db.get(PolymerizationType, type_id)
    if not polymerization_type:
        raise HTTPException(status_code=404, detail="Polymerization type not found")

    try:
        db.delete(polymerization_type)
        db.commit()
        return {"message": "Polymerization type deleted successfully"}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Cannot delete - type may be in use")

# --- Fibers ---
@router.get("/fiber/fibers", response_model=List[FiberSummaryRead])
def list_fibers(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    class_id: int = None,
    subtype_id: int = None,
    is_active: bool = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = select(Fiber).options(
        joinedload(Fiber.fiber_class),
        joinedload(Fiber.subtype)
    ).order_by(Fiber.name)

    if search:
        query = query.where(Fiber.name.ilike(f"%{search}%"))
    if class_id:
        query = query.where(Fiber.class_id == class_id)
    if subtype_id:
        query = query.where(Fiber.subtype_id == subtype_id)
    if is_active is not None:
        query = query.where(Fiber.is_active == is_active)

    query = query.offset(skip).limit(limit)
    fibers = db.execute(query).scalars().all()

    # Convert to proper FiberSummaryRead format to avoid validation errors
    result = []
    for fiber in fibers:
        fiber_summary = {
            "id": fiber.id,
            "fiber_id": fiber.fiber_id,
            "name": fiber.name,
            "fiber_class": fiber.fiber_class,
            "subtype": fiber.subtype,
            "applications": fiber.applications or [],
            "created_at": fiber.created_at,
            "is_active": fiber.is_active
        }
        result.append(fiber_summary)

    return result

@router.get("/fiber/fibers/{fiber_id}", response_model=FiberRead)
def get_fiber(
    fiber_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = select(Fiber).options(
        joinedload(Fiber.fiber_class),
        joinedload(Fiber.subtype),
        joinedload(Fiber.synthetic_type),
        joinedload(Fiber.polymerization_type)
    ).where(Fiber.id == fiber_id)

    fiber = db.execute(query).scalar_one_or_none()
    if not fiber:
        raise HTTPException(status_code=404, detail="Fiber not found")
    return fiber

@router.post("/fiber/fibers", response_model=FiberRead, status_code=201)
def create_fiber(
    payload: FiberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    # Validate foreign key references
    if payload.class_id and not db.get(FiberClass, payload.class_id):
        raise HTTPException(status_code=400, detail="Fiber class not found")
    if payload.subtype_id and not db.get(FiberSubtype, payload.subtype_id):
        raise HTTPException(status_code=400, detail="Fiber subtype not found")
    if payload.synthetic_type_id and not db.get(SyntheticType, payload.synthetic_type_id):
        raise HTTPException(status_code=400, detail="Synthetic type not found")
    if payload.polymerization_type_id and not db.get(PolymerizationType, payload.polymerization_type_id):
        raise HTTPException(status_code=400, detail="Polymerization type not found")

    fiber = Fiber(**payload.model_dump())
    db.add(fiber)
    try:
        db.commit()
        db.refresh(fiber)
        return fiber
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Fiber with this fiber_id may already exist")

@router.put("/fiber/fibers/{fiber_id}", response_model=FiberRead)
def update_fiber(
    fiber_id: int,
    payload: FiberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    fiber = db.get(Fiber, fiber_id)
    if not fiber:
        raise HTTPException(status_code=404, detail="Fiber not found")

    update_data = payload.model_dump(exclude_unset=True)

    # Validate foreign key references if being updated
    if 'class_id' in update_data and update_data['class_id'] and not db.get(FiberClass, update_data['class_id']):
        raise HTTPException(status_code=400, detail="Fiber class not found")
    if 'subtype_id' in update_data and update_data['subtype_id'] and not db.get(FiberSubtype, update_data['subtype_id']):
        raise HTTPException(status_code=400, detail="Fiber subtype not found")
    if 'synthetic_type_id' in update_data and update_data['synthetic_type_id'] and not db.get(SyntheticType, update_data['synthetic_type_id']):
        raise HTTPException(status_code=400, detail="Synthetic type not found")
    if 'polymerization_type_id' in update_data and update_data['polymerization_type_id'] and not db.get(PolymerizationType, update_data['polymerization_type_id']):
        raise HTTPException(status_code=400, detail="Polymerization type not found")

    for field, value in update_data.items():
        setattr(fiber, field, value)

    try:
        db.commit()
        db.refresh(fiber)
        return fiber
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Update failed - fiber_id may already exist")

@router.delete("/fiber/fibers/{fiber_id}")
def delete_fiber(
    fiber_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    fiber = db.get(Fiber, fiber_id)
    if not fiber:
        raise HTTPException(status_code=404, detail="Fiber not found")

    try:
        db.delete(fiber)
        db.commit()
        return {"message": "Fiber deleted successfully"}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Cannot delete fiber")

# Soft delete (deactivate) fiber
@router.patch("/fiber/fibers/{fiber_id}/deactivate")
def deactivate_fiber(
    fiber_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    fiber = db.get(Fiber, fiber_id)
    if not fiber:
        raise HTTPException(status_code=404, detail="Fiber not found")

    fiber.is_active = False
    db.commit()
    return {"message": "Fiber deactivated successfully"}

# Activate fiber
@router.patch("/fiber/fibers/{fiber_id}/activate")
def activate_fiber(
    fiber_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    fiber = db.get(Fiber, fiber_id)
    if not fiber:
        raise HTTPException(status_code=404, detail="Fiber not found")

    fiber.is_active = True
    db.commit()
    return {"message": "Fiber activated successfully"}

# --- Cloudinary ---
@router.post("/upload/image")
def upload_image(
    file: UploadFile = File(...),
    folder: str = "fibers",
    current_user: User = Depends(get_current_active_user)
):
    """Upload an image to Cloudinary"""
    try:
        result = get_cloudinary_service().upload_image(file, folder)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/cloudinary/delete")
def delete_cloudinary_image(
    request: dict,
    current_user: User = Depends(get_current_active_user)
):
    """Delete an image from Cloudinary"""
    public_id = request.get("public_id")
    if not public_id:
        raise HTTPException(status_code=400, detail="public_id is required")

    try:
        result = get_cloudinary_service().delete_image(public_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Chatbot ---
@router.post("/chatbot/start", response_model=StartConversationResponse)
def start_conversation(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Start a new chatbot conversation"""
    import uuid

    session_id = str(uuid.uuid4())

    # Create new conversation record
    conversation = ChatbotConversation(
        user_id=current_user.id,
        session_id=session_id,
        messages=[],
        model_used=settings.OPENAI_MODEL,
        is_active=True
    )
    db.add(conversation)
    db.commit()

    return StartConversationResponse(
        session_id=session_id,
        message="Conversation started"
    )

@router.post("/chatbot/message", response_model=ChatResponse)
async def chat_with_bot(
    payload: ChatMessage,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Send a message to the AI chatbot and get a response"""
    try:
        from openai import OpenAI

        # Get the active conversation
        conversation = db.execute(
            select(ChatbotConversation).where(
                ChatbotConversation.session_id == payload.session_id,
                ChatbotConversation.user_id == current_user.id,
                ChatbotConversation.is_active == True
            )
        ).scalar_one_or_none()

        if not conversation:
            raise HTTPException(status_code=404, detail="Active conversation not found. Please start a new conversation.")

        # Add user message to conversation
        messages = conversation.messages or []
        messages.append({"role": "user", "content": payload.message})

        # Build message history for OpenAI
        openai_messages = [
            {"role": "system", "content": "You are a helpful assistant for textile and fiber knowledge. Provide clear, concise answers to questions about textiles, fibers, and related topics."}
        ]

        # Add conversation history
        for msg in messages:
            openai_messages.append({
                "role": "user" if msg["role"] == "user" else "assistant",
                "content": msg["content"]
            })

        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=openai_messages,
            max_tokens=settings.OPENAI_MAX_TOKENS,
            temperature=settings.OPENAI_TEMPERATURE
        )

        bot_response = response.choices[0].message.content

        # Add AI response to conversation
        messages.append({"role": "ai", "content": bot_response})

        # Update conversation in database
        # Need to create a new list to trigger SQLAlchemy's change detection
        conversation.messages = list(messages)

        # Mark the column as modified to ensure it's persisted
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(conversation, "messages")

        db.commit()
        db.refresh(conversation)

        return ChatResponse(response=bot_response, session_id=payload.session_id)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error communicating with chatbot: {str(e)}")

@router.post("/chatbot/end/{session_id}", response_model=EndConversationResponse)
def end_conversation(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """End an active chatbot conversation"""
    from datetime import datetime, timezone

    conversation = db.execute(
        select(ChatbotConversation).where(
            ChatbotConversation.session_id == session_id,
            ChatbotConversation.user_id == current_user.id,
            ChatbotConversation.is_active == True
        )
    ).scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="Active conversation not found")

    # Mark conversation as ended
    conversation.is_active = False
    conversation.ended_at = datetime.now(timezone.utc)
    db.commit()

    return EndConversationResponse(
        session_id=session_id,
        message="Conversation ended",
        total_messages=len(conversation.messages) if conversation.messages else 0
    )

@router.post("/chatbot/continue/{session_id}", response_model=StartConversationResponse)
def continue_conversation(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Reactivate a past conversation to continue chatting"""
    conversation = db.execute(
        select(ChatbotConversation).where(
            ChatbotConversation.session_id == session_id,
            ChatbotConversation.user_id == current_user.id,
            ChatbotConversation.is_active == False
        )
    ).scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found or already active")

    # Reactivate the conversation
    conversation.is_active = True
    conversation.ended_at = None
    db.commit()

    return StartConversationResponse(
        session_id=session_id,
        message="Conversation resumed"
    )

@router.get("/chatbot/history", response_model=List[ChatbotConversationRead])
def get_chat_history(
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get chatbot conversation history for the current user"""
    query = select(ChatbotConversation).where(
        ChatbotConversation.user_id == current_user.id,
        ChatbotConversation.is_active == False  # Only show completed conversations
    ).order_by(ChatbotConversation.created_at.desc()).limit(limit)

    conversations = db.execute(query).scalars().all()
    return conversations