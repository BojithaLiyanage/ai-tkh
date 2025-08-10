from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db.session import get_db
from app.models.models import Module, Topic, Subtopic, ContentBlock, Tag, SubtopicTag, StudyGroup, SubtopicStudyGroup
from app.schemas.schemas import (
    ModuleCreate, ModuleRead, TopicCreate, TopicRead,
    SubtopicCreate, SubtopicRead, ContentBlockCreate, ContentBlockRead,
    TagCreate, TagRead, StudyGroupRead
)

router = APIRouter()

@router.get("/test")
def health():
    return {"status": "ok"}

# --- Modules ---
@router.get("/modules", response_model=list[ModuleRead])
def list_modules(db: Session = Depends(get_db)):
    rows = db.execute(select(Module).order_by(Module.order_index, Module.id)).scalars().all()
    return rows

@router.post("/modules", response_model=ModuleRead, status_code=201)
def create_module(payload: ModuleCreate, db: Session = Depends(get_db)):
    m = Module(name=payload.name, description=payload.description, order_index=payload.order_index)
    db.add(m); db.commit(); db.refresh(m)
    return m

# --- Topics under a module ---
@router.get("/modules/{module_id}/topics", response_model=list[TopicRead])
def list_topics(module_id: int, db: Session = Depends(get_db)):
    rows = db.execute(
        select(Topic).where(Topic.module_id == module_id).order_by(Topic.order_index, Topic.id)
    ).scalars().all()
    return rows

@router.post("/modules/{module_id}/topics", response_model=TopicRead, status_code=201)
def create_topic(module_id: int, payload: TopicCreate, db: Session = Depends(get_db)):
    # ensure module exists
    if not db.get(Module, module_id):
        raise HTTPException(404, "Module not found")
    t = Topic(module_id=module_id, name=payload.name, description=payload.description, order_index=payload.order_index)
    db.add(t); db.commit(); db.refresh(t)
    return t

# --- Subtopics under a topic ---
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

# --- Content blocks under a subtopic ---
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

# --- Tags ---
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

# --- Study groups ---
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