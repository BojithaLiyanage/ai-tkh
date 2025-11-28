from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Response, Request, Form
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from datetime import timedelta, datetime, timezone
from app.db.session import get_db
from app.models.models import (
    Module, Topic, Subtopic, ContentBlock, Tag, SubtopicTag, StudyGroup, SubtopicStudyGroup, User, Client, ClientOnboarding,
    FiberClass, FiberSubtype, SyntheticType, PolymerizationType, Fiber, ChatbotConversation, FiberVideoLink, FiberEmbedding, Question,
    QuizAttempt, QuizAnswer, KnowledgeBaseDocument, KnowledgeBaseAttachment, KnowledgeBaseCreateRequest, KnowledgeBaseUpdateRequest,
    KnowledgeBaseDocumentResponse, KnowledgeBaseDocumentSummary
)
from app.schemas.schemas import (
    ModuleCreate, ModuleRead, TopicCreate, TopicRead,
    SubtopicCreate, SubtopicRead, ContentBlockCreate, ContentBlockRead,
    TagCreate, TagRead, StudyGroupRead, UserCreate, UserLogin, UserRead, Token, RefreshTokenRequest,
    UserUpdate, UserStats, ClientCreate, ClientRead, ClientUpdate, UserWithClientCreate, UserWithClientRead, AdminUserUpdate,
    ClientOnboardingCreate, ClientOnboardingRead, ClientOnboardingUpdate,
    FiberClassCreate, FiberClassRead, FiberClassUpdate,
    FiberSubtypeCreate, FiberSubtypeRead, FiberSubtypeUpdate,
    SyntheticTypeCreate, SyntheticTypeRead, SyntheticTypeUpdate,
    PolymerizationTypeCreate, PolymerizationTypeRead, PolymerizationTypeUpdate,
    FiberCreate, FiberRead, FiberUpdate, FiberSummaryRead,
    ChatMessage, ChatResponse, ChatbotConversationRead, StartConversationResponse, EndConversationResponse,
    FiberVideoLinkCreate, FiberVideoLinkRead, FiberVideoLinkUpdate, VideoPreview,
    QuestionCreate, QuestionRead, QuestionUpdate, QuestionWithFiberRead,
    QuizAttemptCreate, QuizAttemptStart, QuizAnswerSubmit, QuizAttemptRead, QuizAttemptDetailRead, QuizResultsResponse, FiberQuizCard, QuizListResponse, QuizAnswerRead,
    TopicWithSubtopics, ModuleWithTopicsAndSubtopics, ContentStatsResponse
)
from typing import List, Optional
from app.core.auth import (
    get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token, get_user_by_email,
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
def login(user_credentials: UserLogin, response: Response, db: Session = Depends(get_db)):
    from app.core.auth import create_refresh_token, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS

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
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_refresh_token(
        data={"sub": user.email}, expires_delta=refresh_token_expires
    )
    # Store refresh token in database
    user.refresh_token = refresh_token
    db.commit()

    # Set httpOnly cookies for tokens
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # in seconds
        httponly=True,
        secure=False,  # False for local development, True for production with HTTPS
        samesite="lax"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,  # in seconds
        httponly=True,
        secure=False,  # False for local development, True for production with HTTPS
        samesite="lax"
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60  # in seconds
    }

@router.post("/auth/refresh", response_model=Token)
def refresh_access_token(http_request: Request, request: RefreshTokenRequest, response: Response, db: Session = Depends(get_db)):
    """
    Refresh access token using a refresh token.

    Request body: {"refresh_token": "token_string"}
    Alternatively, uses refresh_token cookie if available.
    """
    from app.core.auth import ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS

    refresh_tok = request.refresh_token
    # Fall back to cookie if request body doesn't have it
    if not refresh_tok:
        refresh_tok = http_request.cookies.get("refresh_token")

    if not refresh_tok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is required"
        )

    # Decode and validate refresh token
    token_data = decode_token(refresh_tok)
    if not token_data or token_data.token_type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    # Get user from database and validate stored refresh token
    user = get_user_by_email(db, token_data.email)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token or user is inactive"
        )

    # Verify that the refresh token matches what's stored
    if user.refresh_token != refresh_tok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    # Create new access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    # Optionally create a new refresh token
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    new_refresh_token = create_refresh_token(
        data={"sub": user.email}, expires_delta=refresh_token_expires
    )

    # Update refresh token in database
    user.refresh_token = new_refresh_token
    db.commit()

    # Set httpOnly cookies for new tokens
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # in seconds
        httponly=True,
        secure=False,  # False for local development, True for production with HTTPS
        samesite="lax"
    )
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,  # in seconds
        httponly=True,
        secure=False,  # False for local development, True for production with HTTPS
        samesite="lax"
    )

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60  # in seconds
    }

@router.get("/auth/me", response_model=UserWithClientRead)
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

@router.get("/modules/with-topics-subtopics/all", response_model=list[ModuleWithTopicsAndSubtopics])
def list_modules_with_all_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Fetch all modules with nested topics and subtopics in a single query.
    Optimizes N+1 query problem by using joinedload for eager loading.
    """
    modules = db.execute(
        select(Module)
        .options(
            joinedload(Module.topics).joinedload(Topic.subtopics)
        )
        .order_by(Module.order_index, Module.id)
    ).unique().scalars().all()
    return modules

@router.get("/content/stats", response_model=ContentStatsResponse)
def get_content_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get content statistics (total modules, topics, subtopics) in optimized queries.
    """
    total_modules = db.query(Module).count()
    total_topics = db.query(Topic).count()
    total_subtopics = db.query(Subtopic).count()

    return ContentStatsResponse(
        total_modules=total_modules,
        total_topics=total_topics,
        total_subtopics=total_subtopics
    )

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

# Get fibers for comparison with physical and mechanical properties
@router.get("/fiber/compare")
def get_fibers_for_comparison(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get fibers with physical and mechanical properties for comparison.
    Returns: fiber_id, name, fiber_class, and all physical/mechanical properties
    """
    query = select(Fiber).options(
        joinedload(Fiber.fiber_class)
    ).where(Fiber.is_active == True).order_by(Fiber.name)

    query = query.offset(skip).limit(limit)
    fibers = db.execute(query).scalars().all()

    result = []
    for fiber in fibers:
        # Helper function to convert Decimal to float safely
        def to_float(value):
            if value is None:
                return None
            return float(value)

        fiber_data = {
            "id": fiber.id,
            "fiber_id": fiber.fiber_id,
            "name": fiber.name,
            "fiber_class": {
                "id": fiber.fiber_class.id,
                "name": fiber.fiber_class.name
            } if fiber.fiber_class else None,
            # Physical Properties
            "density_g_cm3": to_float(fiber.density_g_cm3),
            "fineness_min_um": to_float(fiber.fineness_min_um),
            "fineness_max_um": to_float(fiber.fineness_max_um),
            "staple_length_min_mm": to_float(fiber.staple_length_min_mm),
            "staple_length_max_mm": to_float(fiber.staple_length_max_mm),
            "tenacity_min_cn_tex": to_float(fiber.tenacity_min_cn_tex),
            "tenacity_max_cn_tex": to_float(fiber.tenacity_max_cn_tex),
            "elongation_min_percent": to_float(fiber.elongation_min_percent),
            "elongation_max_percent": to_float(fiber.elongation_max_percent),
            "moisture_regain_percent": to_float(fiber.moisture_regain_percent),
            # Mechanical Properties
            "elastic_modulus_min_gpa": to_float(fiber.elastic_modulus_min_gpa),
            "elastic_modulus_max_gpa": to_float(fiber.elastic_modulus_max_gpa),
        }
        result.append(fiber_data)

    return result

# --- Cloudinary ---
@router.post("/upload/image")
def upload_image(
    file: UploadFile = File(...),
    folder: str = Form("fibers"),
    public_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user)
):
    """Upload an image to Cloudinary with optional custom filename"""
    try:
        result = get_cloudinary_service().upload_image(file, folder, public_id)
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

# --- Fiber Video Links ---
@router.get("/fiber/fibers/{fiber_id}/videos", response_model=List[FiberVideoLinkRead])
def list_fiber_videos(
    fiber_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all video links for a specific fiber"""
    fiber = db.get(Fiber, fiber_id)
    if not fiber:
        raise HTTPException(status_code=404, detail="Fiber not found")

    videos = db.execute(
        select(FiberVideoLink).where(FiberVideoLink.fiber_id == fiber_id).order_by(FiberVideoLink.created_at.desc())
    ).scalars().all()
    return videos

@router.post("/fiber/videos", response_model=FiberVideoLinkRead, status_code=201)
def create_fiber_video(
    payload: FiberVideoLinkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Add a new video link for a fiber (Admin only)"""
    # Validate fiber exists
    if not db.get(Fiber, payload.fiber_id):
        raise HTTPException(status_code=400, detail="Fiber not found")

    video = FiberVideoLink(**payload.model_dump())
    db.add(video)
    try:
        db.commit()
        db.refresh(video)
        return video
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Video link may already exist for this fiber")

@router.put("/fiber/videos/{video_id}", response_model=FiberVideoLinkRead)
def update_fiber_video(
    video_id: int,
    payload: FiberVideoLinkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update a fiber video link (Admin only)"""
    video = db.get(FiberVideoLink, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video link not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(video, field, value)

    try:
        db.commit()
        db.refresh(video)
        return video
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Update failed")

@router.delete("/fiber/videos/{video_id}")
def delete_fiber_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete a fiber video link (Admin only)"""
    video = db.get(FiberVideoLink, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video link not found")

    try:
        db.delete(video)
        db.commit()
        return {"message": "Video link deleted successfully"}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Cannot delete video link")

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
    db.refresh(conversation)

    return StartConversationResponse(
        conversation_id=conversation.id,
        message="Conversation started"
    )

@router.post("/chatbot/message", response_model=ChatResponse)
async def chat_with_bot(
    payload: ChatMessage,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Send a message to the AI chatbot and get a response with fiber database integration"""
    try:
        from openai import OpenAI
        from app.services.fiber_service import get_fiber_service
        from app.services.knowledge_base_service import KnowledgeBaseService

        # Get the active conversation by ID
        conversation = db.execute(
            select(ChatbotConversation).where(
                ChatbotConversation.id == payload.conversation_id,
                ChatbotConversation.user_id == current_user.id,
                ChatbotConversation.is_active == True
            )
        ).scalar_one_or_none()

        if not conversation:
            raise HTTPException(status_code=404, detail="Active conversation not found. Please start a new conversation.")

        # Initialize services
        fiber_service = get_fiber_service(db)
        kb_service = KnowledgeBaseService(db)

        # Get conversation history to help with follow-up questions
        messages = conversation.messages or []
        conversation_context = " ".join([msg["content"] for msg in messages[-6:]])  # Last 3 exchanges

        # Detect query intent and search for relevant fibers
        intent = fiber_service.detect_query_intent(payload.message)
        print(f"\n{'='*60}")
        print(f"DEBUG: User Query: {payload.message}")
        print(f"DEBUG: Detected Intent: {intent}")
        if conversation_context:
            print(f"DEBUG: Recent Conversation: {conversation_context[:150]}...")
        print(f"{'='*60}\n")

        fiber_context = ""
        structure_images = []  # Will store structure images if requested
        morphology_images = []  # Will store morphology images if requested
        related_videos = []  # Will store related video links
        search_results = []  # Initialize to avoid UnboundLocalError

        if intent["requires_search"]:
            # Use extracted search terms or fallback to full query
            search_query = intent["search_terms"][0] if intent["search_terms"] else payload.message

            # Check if this is a categorical query (class, subtype, synthetic type, etc.)
            query_lower = payload.message.lower()
            is_listing_query = any(word in query_lower for word in ['all', 'list', 'example', 'examples', 'what are', 'show', 'which'])

            # Try generic category search first if it looks like a listing query
            category_result = None
            if is_listing_query:
                print(f"DEBUG: Detected listing query, trying category search...")
                category_result = fiber_service.search_fibers_by_category(payload.message, limit=20)

            if category_result and category_result['fibers']:
                # Use category-based results
                search_results = [{"fiber": fiber, "similarity": 1.0, "content_type": f"{category_result['category_type']}_match"} for fiber in category_result['fibers']]
                print(f"DEBUG: Found {len(search_results)} fibers using category search ({category_result['category_type']}: {category_result['category_name']})")
            else:
                # Fall back to semantic/keyword search
                # For follow-up questions (no fiber name detected but has conversation history)
                if not intent.get("entities", {}).get("fiber_name") and conversation_context:
                    print(f"DEBUG: No fiber name in current query, checking conversation history...")
                    historical_intent = fiber_service.detect_query_intent(conversation_context)
                    if historical_intent.get("entities", {}).get("fiber_name"):
                        fiber_from_history = historical_intent['entities']['fiber_name']
                        print(f"DEBUG: Found fiber in history: {fiber_from_history}")
                        # Enhance search query with historical context
                        search_query = f"{fiber_from_history} {payload.message}"
                        print(f"DEBUG: Enhanced search query with history: {search_query}")

                print(f"DEBUG: Final Search Query: {search_query}")

                # Try semantic search first (uses embeddings), fallback to keyword search
                # Using moderate threshold (0.45) and higher limit for comprehensive results
                search_results = fiber_service.semantic_search(
                    query=search_query,
                    limit=15,
                    similarity_threshold=0.45
                )

            print(f"DEBUG: Search Results Count: {len(search_results)}")

            # If semantic search yields no or few results, also try keyword search (skip for category-based queries)
            if not (category_result and category_result['fibers']) and len(search_results) < 8:
                print(f"DEBUG: Limited semantic results ({len(search_results)}), trying keyword search...")
                keyword_results = fiber_service.keyword_search(
                    query=search_query,
                    limit=15
                )
                print(f"DEBUG: Keyword Search Results Count: {len(keyword_results)}")

                # Combine results, avoiding duplicates
                existing_fiber_ids = {r['fiber'].id for r in search_results if isinstance(r, dict) and 'fiber' in r}
                for fiber in keyword_results:
                    if fiber.id not in existing_fiber_ids:
                        search_results.append({"fiber": fiber, "similarity": 0.75, "content_type": "keyword_match"})
                        existing_fiber_ids.add(fiber.id)

                print(f"DEBUG: Combined Results Count: {len(search_results)}")

            # Print detailed fiber information
            if search_results:
                print(f"\nDEBUG: Found {len(search_results)} fiber(s) from database:")
                for idx, result in enumerate(search_results, 1):
                    fiber = result['fiber'] if isinstance(result, dict) else result
                    print(f"\n  Fiber {idx}:")
                    print(f"    - ID: {fiber.id}")
                    print(f"    - Fiber ID: {fiber.fiber_id}")
                    print(f"    - Name: {fiber.name}")
                    print(f"    - Class: {fiber.fiber_class.name if fiber.fiber_class else 'N/A'}")
                    print(f"    - Subtype: {fiber.subtype.name if fiber.subtype else 'N/A'}")
                    print(f"    - Applications: {fiber.applications if fiber.applications else 'N/A'}")
                    print(f"    - Sources: {fiber.sources if fiber.sources else 'N/A'}")
                    print(f"    - Density: {fiber.density_g_cm3 if fiber.density_g_cm3 else 'N/A'} g/cm³")
                    print(f"    - Moisture Regain: {fiber.moisture_regain_percent if fiber.moisture_regain_percent else 'N/A'}%")
                    print(f"    - Polymer Composition: {fiber.polymer_composition[:100] if fiber.polymer_composition else 'N/A'}...")
                    print(f"    - Biodegradable: {fiber.biodegradability if fiber.biodegradability is not None else 'N/A'}")
                    if isinstance(result, dict) and 'similarity' in result:
                        print(f"    - Similarity Score: {result['similarity']:.3f}")
                print(f"\n{'='*60}\n")
            else:
                print(f"DEBUG: No fibers found in database for query: {search_query}")
                print(f"{'='*60}\n")

            # Build context from search results
            if search_results:
                fiber_context = fiber_service.build_fiber_context(search_results)
                print(f"DEBUG: Context Built (length: {len(fiber_context)} chars)")
                print(f"DEBUG: Context Preview:\n{fiber_context[:500]}...\n")
                print(f"{'='*60}\n")

                # Extract structure images if user is asking for images/structure
                if intent.get("needs_images"):
                    # If a specific fiber was requested, only show that fiber's image
                    requested_fiber = intent.get("entities", {}).get("fiber_name")
                    structure_images = fiber_service.extract_structure_images(search_results, requested_fiber)
                    print(f"DEBUG: Extracted {len(structure_images)} structure images")
                    if requested_fiber:
                        print(f"DEBUG: Filtered to requested fiber: {requested_fiber}")
                    for img in structure_images:
                        print(f"  - {img['fiber_name']}: {img['image_url']}")

                # Extract morphology images if user is asking for morphology/microscopic images
                if intent.get("needs_morphology"):
                    # If a specific fiber was requested, only show that fiber's image
                    requested_fiber = intent.get("entities", {}).get("fiber_name")
                    morphology_images = fiber_service.extract_morphology_images(search_results, requested_fiber)
                    print(f"DEBUG: Extracted {len(morphology_images)} morphology images")
                    if requested_fiber:
                        print(f"DEBUG: Filtered to requested fiber: {requested_fiber}")
                    for img in morphology_images:
                        print(f"  - {img['fiber_name']}: {img['image_url']}")

                # Extract related videos from fibers with video descriptions matching the query
                related_videos = fiber_service.extract_related_videos(search_results, payload.message)
                print(f"DEBUG: Extracted {len(related_videos)} related videos")
                for vid in related_videos:
                    print(f"  - {vid['fiber_name']}: {vid.get('title', 'Untitled')} - {vid['video_link']}")
        else:
            print(f"DEBUG: Intent does not require search, skipping database query")
            print(f"{'='*60}\n")

        # Build user-specific system prompt based on client profile
        from app.core.prompts import PromptTemplates, format_onboarding_to_dict

        # Get user's client details for personalization
        client = current_user.client
        client_type = client.client_type if client else None
        organization = client.organization if client else None
        specialization = client.specialization if client else None

        # Get onboarding details if available
        onboarding_details = None
        if client and client.onboarding:
            onboarding_details = format_onboarding_to_dict(client.onboarding.answers)

        # Build the complete system prompt with user context and conversation history
        system_prompt = PromptTemplates.build_complete_system_prompt(
            client_type=client_type,
            organization=organization,
            specialization=specialization,
            onboarding_details=onboarding_details,
            fiber_context="",  # Will add fiber context separately below
            conversation_messages=messages,  # Pass conversation history for context
        )

        print(f"DEBUG: System prompt built with {len(messages)} conversation messages for context")

        # Build message history for OpenAI with conversation context
        openai_messages = [
            {"role": "system", "content": system_prompt}
        ]

        # Search knowledge base for relevant information
        kb_context = ""
        fiber_ids = [r['fiber'].id for r in search_results] if search_results else None
        kb_results = kb_service.semantic_search(
            query=payload.message,
            limit=3,
            similarity_threshold=0.5,
            fiber_ids=fiber_ids,
            published_only=True
        )

        if kb_results:
            kb_context_parts = ["\n===== KNOWLEDGE BASE INFORMATION =====\n"]
            for idx, result in enumerate(kb_results, 1):
                kb_context_parts.append(f"\n**Source {idx}: {result['title']}**")
                if result.get('category'):
                    kb_context_parts.append(f"Category: {result['category']}")
                kb_context_parts.append(f"Relevance: {result['similarity']:.2f}")
                kb_context_parts.append(f"\n{result['matched_chunk']}\n")
            kb_context = "\n".join(kb_context_parts)
            print(f"DEBUG: Knowledge base context added ({len(kb_context)} chars)")

        # Add fiber context RIGHT AFTER system prompt (so it's always visible)
        if fiber_context:
            openai_messages.append({
                "role": "system",
                "content": f"===== FIBER DATABASE =====\n{fiber_context}\n\n**CRITICAL:** Use ONLY this information to answer. Present facts naturally and authoritatively without mentioning the source. Be CONCISE - only provide basic facts unless user asks for details."
            })
            print(f"DEBUG: Fiber context injected ({len(fiber_context)} chars)")
        else:
            print(f"DEBUG: No fiber context for this query")

        # Add knowledge base context if available
        if kb_context:
            openai_messages.append({
                "role": "system",
                "content": f"{kb_context}\n\n**Use this knowledge base information to supplement your answers with authoritative content.**"
            })
            print(f"DEBUG: Knowledge base context injected ({len(kb_context)} chars)")

        # Add conversation history
        for msg in messages:
            openai_messages.append({
                "role": "user" if msg["role"] == "user" else "assistant",
                "content": msg["content"]
            })

        # Add the current user message
        openai_messages.append({
            "role": "user",
            "content": payload.message
        })

        # Add current user message to conversation storage
        messages.append({"role": "user", "content": payload.message})

        # Debug: Show message structure
        print(f"\nDEBUG: OpenAI Message Structure:")
        for idx, msg in enumerate(openai_messages):
            role = msg['role']
            content_preview = msg['content'][:150] if len(msg['content']) > 150 else msg['content']
            print(f"  [{idx}] {role}: {content_preview}...")
        print(f"DEBUG: Total messages to OpenAI: {len(openai_messages)}\n")

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

        # Format knowledge base sources for response
        kb_sources = []
        if kb_results:
            kb_sources = [
                {
                    "id": result['document_id'],
                    "title": result['title'],
                    "category": result.get('category'),
                    "similarity": result['similarity']
                }
                for result in kb_results
            ]

        return ChatResponse(
            response=bot_response,
            conversation_id=conversation.id,
            fiber_cards=[],
            structure_images=structure_images,
            morphology_images=morphology_images,
            related_videos=related_videos,
            knowledge_base_sources=kb_sources
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error communicating with chatbot: {str(e)}")

@router.post("/chatbot/end/{conversation_id}", response_model=EndConversationResponse)
def end_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """End an active chatbot conversation"""
    from datetime import datetime, timezone

    conversation = db.execute(
        select(ChatbotConversation).where(
            ChatbotConversation.id == conversation_id,
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
        conversation_id=conversation.id,
        message="Conversation ended",
        total_messages=len(conversation.messages) if conversation.messages else 0
    )

@router.post("/chatbot/continue/{conversation_id}", response_model=StartConversationResponse)
def continue_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Reactivate a past conversation to continue chatting"""
    conversation = db.execute(
        select(ChatbotConversation).where(
            ChatbotConversation.id == conversation_id,
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
        conversation_id=conversation.id,
        message="Conversation resumed"
    )

@router.delete("/chatbot/delete/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a chatbot conversation"""
    conversation = db.execute(
        select(ChatbotConversation).where(
            ChatbotConversation.id == conversation_id,
            ChatbotConversation.user_id == current_user.id
        )
    ).scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conversation)
    db.commit()

    return {"message": "Conversation deleted successfully"}

@router.get("/chatbot/history", response_model=List[ChatbotConversationRead])
def get_chat_history(
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get chatbot conversation history for the current user (including active ones)"""
    query = select(ChatbotConversation).where(
        ChatbotConversation.user_id == current_user.id
    ).order_by(ChatbotConversation.created_at.desc()).limit(limit)

    conversations = db.execute(query).scalars().all()
    return conversations

@router.post("/chatbot/cache/clear")
def clear_fiber_cache(
    _: User = Depends(get_current_active_user),  # Require authentication but don't use the user object
    db: Session = Depends(get_db)
):
    """
    Clear the fiber names cache. Call this endpoint after adding new fibers to the database.
    This ensures the chatbot recognizes new fibers immediately without waiting for cache expiration.

    Requires authentication (admin users only in production).
    """
    try:
        from app.services.fiber_service import get_fiber_service

        fiber_service = get_fiber_service(db)
        fiber_service.clear_fiber_cache()
        return {
            "message": "Fiber names cache cleared successfully",
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error clearing cache: {str(e)}"
        )

# --- Fiber Embeddings ---
@router.post("/fibers/generate-embeddings")
async def generate_fiber_embeddings(
    force_regenerate: bool = False,
    _: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Generate embeddings for all fibers in the database.

    This endpoint:
    1. Fetches all active fibers
    2. Creates embeddings for multiple content types (name, description, properties, etc.)
    3. Saves embeddings to fiber_embeddings table
    4. Returns progress and statistics

    Query Parameters:
    - force_regenerate: If True, regenerates embeddings even if they exist

    Returns:
        {
            "status": "success",
            "total_fibers": int,
            "total_embeddings_created": int,
            "skipped": int,
            "errors": int,
            "processing_time_seconds": float,
            "embeddings_by_type": dict
        }
    """
    try:
        from openai import OpenAI
        from datetime import datetime
        import time

        start_time = time.time()
        openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

        # Get all active fibers
        fibers = db.execute(
            select(Fiber).where(Fiber.is_active == True).options(
                joinedload(Fiber.fiber_class),
                joinedload(Fiber.subtype)
            )
        ).unique().scalars().all()

        print(f"\n{'='*70}")
        print(f"EMBEDDING GENERATION STARTED")
        print(f"Total fibers to process: {len(fibers)}")
        print(f"Force regenerate: {force_regenerate}")
        print(f"{'='*70}\n")

        total_embeddings_created = 0
        embeddings_by_type = {
            "name": 0,
            "description": 0,
            "properties": 0,
            "applications": 0
        }
        skipped_fibers = []
        error_fibers = []

        # Process each fiber
        for idx, fiber in enumerate(fibers, 1):
            try:
                print(f"[{idx}/{len(fibers)}] Processing: {fiber.name}")

                # Define embedding content types
                embeddings_to_create = []

                # 1. Fiber Name Embedding
                embeddings_to_create.append({
                    "content_type": "name",
                    "content_text": fiber.name
                })

                # 2. Fiber Description Embedding (combine multiple fields)
                description_parts = []
                if fiber.polymer_composition:
                    description_parts.append(f"Composition: {fiber.polymer_composition}")
                if fiber.fiber_class:
                    description_parts.append(f"Class: {fiber.fiber_class.name}")
                if fiber.subtype:
                    description_parts.append(f"Subtype: {fiber.subtype.name}")
                if fiber.sources:
                    description_parts.append(f"Sources: {', '.join(fiber.sources)}")

                if description_parts:
                    description = " ".join(description_parts)
                    embeddings_to_create.append({
                        "content_type": "description",
                        "content_text": description
                    })

                # 3. Properties Embedding (numerical and physical properties)
                properties_parts = []
                if fiber.density_g_cm3:
                    properties_parts.append(f"Density {fiber.density_g_cm3} g/cm³")
                if fiber.tenacity_min_cn_tex or fiber.tenacity_max_cn_tex:
                    tenacity = f"{fiber.tenacity_min_cn_tex or 'N/A'}-{fiber.tenacity_max_cn_tex or 'N/A'}"
                    properties_parts.append(f"Tenacity {tenacity} cN/tex")
                if fiber.moisture_regain_percent:
                    properties_parts.append(f"Moisture regain {fiber.moisture_regain_percent}%")
                if fiber.thermal_properties:
                    properties_parts.append(f"Thermal: {fiber.thermal_properties}")
                if fiber.acid_resistance or fiber.alkali_resistance or fiber.microbial_resistance:
                    resistance = f"Acid:{fiber.acid_resistance}, Alkali:{fiber.alkali_resistance}, Microbial:{fiber.microbial_resistance}"
                    properties_parts.append(f"Resistance: {resistance}")

                if properties_parts:
                    properties_text = " ".join(properties_parts)
                    embeddings_to_create.append({
                        "content_type": "properties",
                        "content_text": properties_text
                    })

                # 4. Applications Embedding
                if fiber.applications:
                    applications_text = f"Applications: {', '.join(fiber.applications)}"
                    embeddings_to_create.append({
                        "content_type": "applications",
                        "content_text": applications_text
                    })

                # Generate and save embeddings
                for embedding_config in embeddings_to_create:
                    content_type = embedding_config["content_type"]
                    content_text = embedding_config["content_text"]

                    # Check if embedding already exists
                    existing = db.execute(
                        select(FiberEmbedding).where(
                            FiberEmbedding.fiber_id == fiber.id,
                            FiberEmbedding.content_type == content_type
                        )
                    ).scalar_one_or_none()

                    # Skip if exists and not forcing regeneration
                    if existing and not force_regenerate:
                        print(f"  └─ {content_type}: SKIPPED (exists)")
                        continue

                    # Delete existing if force regenerating
                    if existing and force_regenerate:
                        db.delete(existing)
                        print(f"  └─ {content_type}: DELETED (force regenerate)")

                    # Generate embedding
                    print(f"  └─ {content_type}: GENERATING...")
                    response = openai_client.embeddings.create(
                        model="text-embedding-3-small",
                        input=content_text
                    )
                    embedding_vector = response.data[0].embedding

                    # Create and save FiberEmbedding
                    fiber_embedding = FiberEmbedding(
                        fiber_id=fiber.id,
                        content_type=content_type,
                        content_text=content_text,
                        embedding=embedding_vector,
                        embedding_model="text-embedding-3-small"
                    )
                    db.add(fiber_embedding)
                    total_embeddings_created += 1
                    embeddings_by_type[content_type] += 1
                    print(f"     → {content_type}: SAVED ✓")

                # Commit after each fiber to avoid huge transactions
                db.commit()
                print(f"  ✓ Fiber committed to database\n")

            except Exception as fiber_error:
                db.rollback()
                error_msg = f"Error processing {fiber.name}: {str(fiber_error)}"
                print(f"  ✗ {error_msg}\n")
                error_fibers.append(error_msg)

        # Final commit
        db.commit()

        elapsed_time = time.time() - start_time

        print(f"{'='*70}")
        print(f"EMBEDDING GENERATION COMPLETED")
        print(f"Total fibers processed: {len(fibers)}")
        print(f"Total embeddings created: {total_embeddings_created}")
        print(f"Embeddings by type: {embeddings_by_type}")
        print(f"Errors: {len(error_fibers)}")
        print(f"Processing time: {elapsed_time:.2f} seconds")
        print(f"{'='*70}\n")

        return {
            "status": "success",
            "total_fibers": len(fibers),
            "total_embeddings_created": total_embeddings_created,
            "embeddings_by_type": embeddings_by_type,
            "skipped": len(fibers) - len(error_fibers),
            "errors": len(error_fibers),
            "error_details": error_fibers if error_fibers else [],
            "processing_time_seconds": elapsed_time
        }

    except Exception as e:
        print(f"FATAL ERROR in embedding generation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating embeddings: {str(e)}"
        )


@router.get("/fibers/embeddings/status")
def get_embeddings_status(
    _: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get statistics about fiber embeddings in the database.

    Returns:
        {
            "total_fibers": int,
            "fibers_with_embeddings": int,
            "total_embeddings": int,
            "coverage_percentage": float,
            "embeddings_by_type": dict,
            "fibers_missing_embeddings": List[str]
        }
    """
    try:
        # Total active fibers
        total_fibers = db.execute(
            select(Fiber).where(Fiber.is_active == True)
        ).scalars().all()

        # Total embeddings
        total_embeddings = db.execute(
            select(FiberEmbedding)
        ).scalars().all()

        # Embeddings by type
        embeddings_by_type = {}
        for embedding in total_embeddings:
            if embedding.content_type not in embeddings_by_type:
                embeddings_by_type[embedding.content_type] = 0
            embeddings_by_type[embedding.content_type] += 1

        # Fibers with at least one embedding
        fibers_with_embeddings = set()
        for embedding in total_embeddings:
            fibers_with_embeddings.add(embedding.fiber_id)

        # Find fibers missing embeddings
        fibers_missing_embeddings = []
        for fiber in total_fibers:
            if fiber.id not in fibers_with_embeddings:
                fibers_missing_embeddings.append(fiber.name)

        coverage_percentage = (len(fibers_with_embeddings) / len(total_fibers) * 100) if total_fibers else 0

        return {
            "total_fibers": len(total_fibers),
            "fibers_with_embeddings": len(fibers_with_embeddings),
            "fibers_missing_embeddings": len(fibers_missing_embeddings),
            "total_embeddings": len(total_embeddings),
            "coverage_percentage": round(coverage_percentage, 2),
            "embeddings_by_type": embeddings_by_type,
            "missing_fibers_list": fibers_missing_embeddings[:10]  # Show first 10
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting embeddings status: {str(e)}"
        )


@router.delete("/fibers/embeddings/{fiber_id}")
def delete_fiber_embeddings(
    fiber_id: int,
    _: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete all embeddings for a specific fiber.
    Useful when you want to regenerate embeddings for a single fiber.
    """
    try:
        # Get fiber to verify it exists
        fiber = db.get(Fiber, fiber_id)
        if not fiber:
            raise HTTPException(status_code=404, detail="Fiber not found")

        # Delete all embeddings for this fiber
        embeddings = db.execute(
            select(FiberEmbedding).where(FiberEmbedding.fiber_id == fiber_id)
        ).scalars().all()

        deleted_count = len(embeddings)
        for embedding in embeddings:
            db.delete(embedding)

        db.commit()

        return {
            "status": "success",
            "fiber_name": fiber.name,
            "embeddings_deleted": deleted_count
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting embeddings: {str(e)}"
        )


# ==================================================
# Question Bank / Assessment Endpoints
# ==================================================

@router.get("/questions", response_model=List[QuestionWithFiberRead])
def get_all_questions(
    fiber_id: int = None,
    study_group_code: str = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user)
):
    """
    Get all questions from the question bank with optional filters.
    Admin only endpoint.
    """
    try:
        query = select(Question).join(Fiber).join(StudyGroup)

        if fiber_id:
            query = query.where(Question.fiber_id == fiber_id)

        if study_group_code:
            query = query.where(Question.study_group_code == study_group_code)

        query = query.offset(offset).limit(limit)

        questions = db.execute(query).scalars().all()

        # Transform to QuestionWithFiberRead format
        result = []
        for q in questions:
            result.append({
                "id": q.id,
                "fiber_id": q.fiber_id,
                "fiber_name": q.fiber.name,
                "study_group_code": q.study_group_code,
                "study_group_name": q.study_group.name,
                "question": q.question,
                "options": q.options,
                "correct_answer": q.correct_answer,
                "created_at": q.created_at,
                "updated_at": q.updated_at
            })

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching questions: {str(e)}"
        )


@router.post("/questions", response_model=QuestionRead, status_code=201)
def create_question(
    question_data: QuestionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user)
):
    """
    Create a new question in the question bank.
    Admin only endpoint.
    """
    try:
        # Verify fiber exists
        fiber = db.get(Fiber, question_data.fiber_id)
        if not fiber:
            raise HTTPException(status_code=404, detail="Fiber not found")

        # Verify study group exists
        study_group = db.get(StudyGroup, question_data.study_group_code)
        if not study_group:
            raise HTTPException(status_code=404, detail="Study group not found")

        # Verify correct answer is in options
        if question_data.correct_answer not in question_data.options:
            raise HTTPException(
                status_code=400,
                detail="Correct answer must be one of the provided options"
            )

        # Create question
        new_question = Question(
            fiber_id=question_data.fiber_id,
            study_group_code=question_data.study_group_code,
            question=question_data.question,
            options=question_data.options,
            correct_answer=question_data.correct_answer
        )

        db.add(new_question)
        db.commit()
        db.refresh(new_question)

        return new_question

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error creating question: {str(e)}"
        )


@router.get("/questions/{question_id}", response_model=QuestionRead)
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user)
):
    """
    Get a specific question by ID.
    Admin only endpoint.
    """
    question = db.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    return question


@router.put("/questions/{question_id}", response_model=QuestionRead)
def update_question(
    question_id: int,
    question_data: QuestionUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user)
):
    """
    Update an existing question.
    Admin only endpoint.
    """
    try:
        question = db.get(Question, question_id)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")

        # Update fields if provided
        if question_data.question is not None:
            question.question = question_data.question

        if question_data.options is not None:
            question.options = question_data.options

        if question_data.correct_answer is not None:
            # Verify correct answer is in options
            options_to_check = question_data.options if question_data.options is not None else question.options
            if question_data.correct_answer not in options_to_check:
                raise HTTPException(
                    status_code=400,
                    detail="Correct answer must be one of the provided options"
                )
            question.correct_answer = question_data.correct_answer

        if question_data.study_group_code is not None:
            # Verify study group exists
            study_group = db.get(StudyGroup, question_data.study_group_code)
            if not study_group:
                raise HTTPException(status_code=404, detail="Study group not found")
            question.study_group_code = question_data.study_group_code

        db.commit()
        db.refresh(question)

        return question

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error updating question: {str(e)}"
        )


@router.delete("/questions/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user)
):
    """
    Delete a question from the question bank.
    Admin only endpoint.
    """
    try:
        question = db.get(Question, question_id)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")

        db.delete(question)
        db.commit()

        return {"status": "success", "message": "Question deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting question: {str(e)}"
        )


@router.get("/questions/stats/summary")
def get_question_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user)
):
    """
    Get statistics about the question bank.
    Admin only endpoint.
    """
    try:
        from sqlalchemy import func, distinct

        total_questions = db.query(func.count(Question.id)).scalar()
        total_fibers_with_questions = db.query(func.count(distinct(Question.fiber_id))).scalar()

        # Questions per study group
        questions_by_group = db.execute(
            select(
                StudyGroup.code,
                StudyGroup.name,
                func.count(Question.id).label("count")
            )
            .outerjoin(Question, Question.study_group_code == StudyGroup.code)
            .group_by(StudyGroup.code, StudyGroup.name)
        ).all()

        return {
            "total_questions": total_questions,
            "total_fibers_with_questions": total_fibers_with_questions,
            "questions_by_study_group": [
                {
                    "code": group.code,
                    "name": group.name,
                    "count": group.count
                }
                for group in questions_by_group
            ]
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching question stats: {str(e)}"
        )


# --- Quiz Attempts (Client-facing) ---

@router.get("/quizzes/available", response_model=QuizListResponse)
def get_available_quizzes(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get available fiber quizzes filtered by user type"""
    try:
        # Get user's client type
        client = db.query(Client).filter(Client.user_id == current_user.id).first()
        if not client:
            raise HTTPException(status_code=404, detail="Client profile not found")

        # Map client types to study group codes
        study_group_mapping = {
            "student": "S",  # Undergraduate
            "undergraduate": "U",
            "researcher": "R",  # Research
            "industry_expert": "I"  # Industry
        }

        study_group_code = study_group_mapping.get(client.client_type, "U")

        # Get all fibers with questions for the user's study group
        fibers_with_questions = db.query(Fiber).join(
            Question, (Fiber.id == Question.fiber_id) & (Question.study_group_code == study_group_code)
        ).distinct().all()

        quiz_cards = []
        completed_count = 0

        for fiber in fibers_with_questions:
            # Count questions for this fiber and study group
            question_count = db.query(Question).filter(
                Question.fiber_id == fiber.id,
                Question.study_group_code == study_group_code
            ).count()

            # Get last attempt for this quiz
            last_attempt = db.query(QuizAttempt).filter(
                QuizAttempt.user_id == current_user.id,
                QuizAttempt.fiber_id == fiber.id,
                QuizAttempt.study_group_code == study_group_code,
                QuizAttempt.is_completed == True
            ).order_by(QuizAttempt.submitted_at.desc()).first()

            is_completed = last_attempt is not None
            if is_completed:
                completed_count += 1

            quiz_card = FiberQuizCard(
                fiber_id=fiber.id,
                fiber_name=fiber.name,
                study_group_code=study_group_code,
                study_group_name=get_study_group_name(study_group_code),
                question_count=question_count,
                is_completed=is_completed,
                last_score=last_attempt.score if last_attempt else None,
                last_attempt_date=last_attempt.submitted_at if last_attempt else None
            )
            quiz_cards.append(quiz_card)

        return QuizListResponse(
            quizzes=quiz_cards,
            total_available=len(fibers_with_questions),
            completed_count=completed_count
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/quizzes/start", response_model=QuizAttemptStart)
def start_quiz(
    quiz_data: QuizAttemptCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Start a quiz attempt"""
    try:
        # Verify fiber exists
        fiber = db.query(Fiber).filter(Fiber.id == quiz_data.fiber_id).first()
        if not fiber:
            raise HTTPException(status_code=404, detail="Fiber not found")

        # Get questions for this fiber and study group
        questions = db.query(Question).filter(
            Question.fiber_id == quiz_data.fiber_id,
            Question.study_group_code == quiz_data.study_group_code
        ).all()

        if not questions:
            raise HTTPException(status_code=404, detail="No questions found for this quiz")

        # Create a new quiz attempt
        quiz_attempt = QuizAttempt(
            user_id=current_user.id,
            fiber_id=quiz_data.fiber_id,
            study_group_code=quiz_data.study_group_code,
            total_questions=len(questions),
            correct_answers=0
        )
        db.add(quiz_attempt)
        db.commit()
        db.refresh(quiz_attempt)

        # Get study group info
        study_group = db.query(StudyGroup).filter(
            StudyGroup.code == quiz_data.study_group_code
        ).first()

        # Prepare questions (without correct answers)
        questions_list = [
            {
                "id": q.id,
                "question": q.question,
                "options": q.options
            }
            for q in questions
        ]

        return QuizAttemptStart(
            attempt_id=quiz_attempt.id,
            fiber_id=fiber.id,
            fiber_name=fiber.name,
            study_group_code=quiz_data.study_group_code,
            study_group_name=study_group.name if study_group else quiz_data.study_group_code,
            total_questions=len(questions),
            questions=questions_list
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/quizzes/{attempt_id}/submit", response_model=QuizResultsResponse)
def submit_quiz(
    attempt_id: int,
    quiz_answers: QuizAnswerSubmit,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Submit quiz answers and calculate score"""
    try:
        # Get the quiz attempt
        quiz_attempt = db.query(QuizAttempt).filter(
            QuizAttempt.id == attempt_id,
            QuizAttempt.user_id == current_user.id
        ).first()

        if not quiz_attempt:
            raise HTTPException(status_code=404, detail="Quiz attempt not found")

        if quiz_attempt.is_completed:
            raise HTTPException(status_code=400, detail="Quiz already submitted")

        correct_count = 0

        # Process each answer
        for answer_data in quiz_answers.answers:
            question = db.query(Question).filter(
                Question.id == answer_data.question_id
            ).first()

            if not question:
                continue

            # Check if answer is correct
            is_correct = answer_data.selected_answer == question.correct_answer
            if is_correct:
                correct_count += 1

            # Save the answer
            quiz_answer = QuizAnswer(
                quiz_attempt_id=attempt_id,
                question_id=answer_data.question_id,
                selected_answer=answer_data.selected_answer,
                is_correct=is_correct
            )
            db.add(quiz_answer)

        # Calculate score
        score = int((correct_count / quiz_attempt.total_questions) * 100) if quiz_attempt.total_questions > 0 else 0

        # Update quiz attempt
        quiz_attempt.score = score
        quiz_attempt.correct_answers = correct_count
        quiz_attempt.is_completed = True
        quiz_attempt.submitted_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(quiz_attempt)

        return QuizResultsResponse(
            attempt_id=attempt_id,
            score=score,
            total_questions=quiz_attempt.total_questions,
            correct_answers=correct_count,
            percentage=float(score),
            message=f"Quiz completed! You scored {score}% ({correct_count}/{quiz_attempt.total_questions} correct)"
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quizzes/{attempt_id}/review", response_model=QuizAttemptDetailRead)
def review_quiz(
    attempt_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get detailed quiz attempt for review"""
    try:
        quiz_attempt = db.query(QuizAttempt).filter(
            QuizAttempt.id == attempt_id,
            QuizAttempt.user_id == current_user.id
        ).options(
            joinedload(QuizAttempt.answers)
        ).first()

        if not quiz_attempt:
            raise HTTPException(status_code=404, detail="Quiz attempt not found")

        # Get fiber info
        fiber = db.query(Fiber).filter(Fiber.id == quiz_attempt.fiber_id).first()
        study_group = db.query(StudyGroup).filter(
            StudyGroup.code == quiz_attempt.study_group_code
        ).first()

        # Convert answers to schema with correct answers
        answers_data = []
        for answer in quiz_attempt.answers:
            # Get the question to find the correct answer
            question = db.query(Question).filter(Question.id == answer.question_id).first()
            answers_data.append(
                QuizAnswerRead.model_validate({
                    "id": answer.id,
                    "quiz_attempt_id": answer.quiz_attempt_id,
                    "question_id": answer.question_id,
                    "selected_answer": answer.selected_answer,
                    "is_correct": answer.is_correct,
                    "correct_answer": question.correct_answer if question else None,
                    "created_at": answer.created_at
                })
            )

        return QuizAttemptDetailRead(
            id=quiz_attempt.id,
            fiber_id=fiber.id,
            fiber_name=fiber.name,
            study_group_code=quiz_attempt.study_group_code,
            study_group_name=study_group.name if study_group else quiz_attempt.study_group_code,
            score=quiz_attempt.score,
            total_questions=quiz_attempt.total_questions,
            correct_answers=quiz_attempt.correct_answers,
            is_completed=quiz_attempt.is_completed,
            submitted_at=quiz_attempt.submitted_at,
            created_at=quiz_attempt.created_at,
            answers=answers_data
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quizzes/history")
def get_quiz_history(
    fiber_id: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's quiz history"""
    try:
        query = db.query(QuizAttempt).filter(
            QuizAttempt.user_id == current_user.id,
            QuizAttempt.is_completed == True
        )

        if fiber_id:
            query = query.filter(QuizAttempt.fiber_id == fiber_id)

        total = query.count()
        attempts = query.order_by(
            QuizAttempt.submitted_at.desc()
        ).limit(limit).offset(offset).all()

        # Build response with fiber details
        history = []
        for attempt in attempts:
            fiber = db.query(Fiber).filter(Fiber.id == attempt.fiber_id).first()
            history.append({
                "id": attempt.id,
                "fiber_id": fiber.id,
                "fiber_name": fiber.name,
                "study_group_code": attempt.study_group_code,
                "score": attempt.score,
                "total_questions": attempt.total_questions,
                "correct_answers": attempt.correct_answers,
                "submitted_at": attempt.submitted_at,
                "created_at": attempt.created_at
            })

        return {
            "history": history,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_study_group_name(code: str) -> str:
    """Helper to get study group name from code"""
    mapping = {
        "S": "School",
        "U": "Undergraduate",
        "I": "Industry",
        "R": "Research"
    }
    return mapping.get(code, code)


# ==================================================
# KNOWLEDGE BASE MANAGEMENT (Admin Only)
# ==================================================

@router.post("/admin/knowledge-base", response_model=KnowledgeBaseDocumentResponse, status_code=201)
async def create_knowledge_document(
    request: KnowledgeBaseCreateRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Create new knowledge base document with automatic embedding generation.
    Admin only.
    """
    from app.services.knowledge_base_service import KnowledgeBaseService

    try:
        kb_service = KnowledgeBaseService(db)
        document = kb_service.create_document_with_embeddings(
            title=request.title,
            content=request.content,
            created_by=current_user.id,
            category=request.category,
            subcategory=request.subcategory,
            fiber_ids=request.fiber_ids,
            tags=request.tags,
            is_published=request.is_published
        )

        # Load attachments for response
        db.refresh(document)
        return document

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating document: {str(e)}")


@router.get("/admin/knowledge-base/stats")
async def get_knowledge_base_stats(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get knowledge base statistics.
    Admin only.
    """
    try:
        total = db.query(KnowledgeBaseDocument).count()
        published = db.query(KnowledgeBaseDocument).filter(
            KnowledgeBaseDocument.is_published == True
        ).count()
        drafts = db.query(KnowledgeBaseDocument).filter(
            KnowledgeBaseDocument.is_published == False
        ).count()

        return {
            "total_documents": total,
            "published_documents": published,
            "draft_documents": drafts
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")


@router.get("/admin/knowledge-base", response_model=List[KnowledgeBaseDocumentSummary])
async def list_knowledge_documents(
    category: Optional[str] = None,
    is_published: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    List all knowledge base documents with optional filters.
    Admin only.
    """
    try:
        query = db.query(KnowledgeBaseDocument)

        # Apply filters
        if category:
            query = query.filter(KnowledgeBaseDocument.category == category)

        if is_published is not None:
            query = query.filter(KnowledgeBaseDocument.is_published == is_published)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (KnowledgeBaseDocument.title.ilike(search_term)) |
                (KnowledgeBaseDocument.content.ilike(search_term))
            )

        # Order by updated_at descending
        query = query.order_by(KnowledgeBaseDocument.updated_at.desc())

        # Pagination
        documents = query.offset(skip).limit(limit).all()

        return documents

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing documents: {str(e)}")


@router.get("/admin/knowledge-base/{document_id}", response_model=KnowledgeBaseDocumentResponse)
async def get_knowledge_document(
    document_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get single knowledge base document with full details.
    Admin only.
    """
    try:
        document = db.query(KnowledgeBaseDocument).options(
            joinedload(KnowledgeBaseDocument.attachments)
        ).filter(KnowledgeBaseDocument.id == document_id).first()

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        return document

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching document: {str(e)}")


@router.put("/admin/knowledge-base/{document_id}", response_model=KnowledgeBaseDocumentResponse)
async def update_knowledge_document(
    document_id: int,
    request: KnowledgeBaseUpdateRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update knowledge base document. Regenerates embeddings if content changes.
    Admin only.
    """
    from app.services.knowledge_base_service import KnowledgeBaseService

    try:
        kb_service = KnowledgeBaseService(db)

        # Build update kwargs from request
        update_kwargs = {}
        if request.title is not None:
            update_kwargs['title'] = request.title
        if request.content is not None:
            update_kwargs['content'] = request.content
        if request.category is not None:
            update_kwargs['category'] = request.category
        if request.subcategory is not None:
            update_kwargs['subcategory'] = request.subcategory
        if request.fiber_ids is not None:
            update_kwargs['fiber_ids'] = request.fiber_ids
        if request.tags is not None:
            update_kwargs['tags'] = request.tags
        if request.is_published is not None:
            update_kwargs['is_published'] = request.is_published

        document = kb_service.update_document(
            document_id=document_id,
            updated_by=current_user.id,
            **update_kwargs
        )

        return document

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating document: {str(e)}")


@router.delete("/admin/knowledge-base/{document_id}", status_code=204)
async def delete_knowledge_document(
    document_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete knowledge base document and all its embeddings.
    Admin only.
    """
    from app.services.knowledge_base_service import KnowledgeBaseService

    try:
        kb_service = KnowledgeBaseService(db)
        kb_service.delete_document(document_id, deleted_by=current_user.id)
        return Response(status_code=204)

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")


@router.post("/admin/knowledge-base/{document_id}/publish")
async def toggle_publish_knowledge_document(
    document_id: int,
    publish: bool = True,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Publish or unpublish a knowledge base document.
    Admin only.
    """
    from app.services.knowledge_base_service import KnowledgeBaseService

    try:
        kb_service = KnowledgeBaseService(db)
        document = kb_service.update_document(
            document_id=document_id,
            updated_by=current_user.id,
            is_published=publish
        )

        return {
            "id": document.id,
            "title": document.title,
            "is_published": document.is_published,
            "message": f"Document {'published' if publish else 'unpublished'} successfully"
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error toggling publish status: {str(e)}")


@router.get("/admin/knowledge-base/categories/list")
async def get_knowledge_base_categories(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get list of all unique categories in knowledge base.
    Admin only.
    """
    try:
        categories = db.query(KnowledgeBaseDocument.category).distinct().filter(
            KnowledgeBaseDocument.category.isnot(None)
        ).all()

        return {"categories": [cat[0] for cat in categories if cat[0]]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching categories: {str(e)}")