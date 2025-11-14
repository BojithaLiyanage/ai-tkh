# Fiber Database Chatbot Integration

## Overview

The chatbot now integrates with the fiber database using **RAG (Retrieval-Augmented Generation)**. When users ask fiber-related questions, the system:

1. **Detects query intent** - Determines if the question is about fibers
2. **Searches the database** - Uses semantic search (vector embeddings) or keyword search
3. **Retrieves relevant data** - Fetches matching fibers with all their properties
4. **Enriches the context** - Builds a detailed context from fiber data
5. **Generates response** - OpenAI uses the context to provide accurate answers

## Database Structure Assessment

### ✅ Current Structure is Excellent - No Restructuring Needed

Your database has a sophisticated and well-designed structure:

**Core Tables:**
- `fibers` - Main fiber data with extensive properties
- `fiber_classes` - Natural, Synthetic, etc.
- `fiber_subtypes` - Subcategories within classes
- `synthetic_types` - Types of synthetic fibers
- `polymerization_types` - Polymer formation methods

**Advanced Features (Currently Underutilized):**
- `fiber_embeddings` - Vector embeddings for semantic search (✅ NOW USED)
- `fiber_properties` - Extensible property system
- `fiber_applications` - Hierarchical application categories
- `property_definitions` - Standardized property metadata
- `application_categories` - Multi-level application taxonomy

**The structure supports:**
- Full-text search across all fields
- Semantic search using pgvector embeddings
- Hierarchical classification
- Flexible property definitions
- Detailed application tracking
- User interaction analytics

## Implementation Details

### 1. Fiber Search Service (`app/services/fiber_service.py`)

New service module that provides:

#### **Keyword Search**
```python
fiber_service.keyword_search(query="cotton", limit=5)
```
Searches across:
- Fiber names
- Trade names
- Applications
- Sources
- Manufacturing processes
- Polymer composition
- Sustainability notes

#### **Semantic Search** (Uses Vector Embeddings)
```python
fiber_service.semantic_search(
    query="strong fibers for outdoor clothing",
    limit=5,
    similarity_threshold=0.65
)
```
- Generates OpenAI embedding for query
- Uses pgvector cosine similarity
- Returns fibers with similarity scores
- Fallback to keyword search if embeddings unavailable

#### **Specialized Searches**
```python
# Get fiber by exact name
fiber_service.get_fiber_by_name("Polyester")

# Get all fibers in a class
fiber_service.get_fibers_by_class("Natural")

# Get fibers by application
fiber_service.get_fibers_by_application("apparel")
```

#### **Intent Detection**
Analyzes queries to determine:
- Query type (property inquiry, comparison, identification, etc.)
- Mentioned fiber names
- Whether database search is needed

#### **Context Building**
Formats fiber data into LLM-friendly context including:
- Classification (class, subtype, types)
- Physical properties (density, tenacity, elongation, etc.)
- Chemical properties (resistance to acids, alkalis)
- Thermal properties (melting point, glass transition)
- Applications and sources
- Sustainability information
- Relevance scores

### 2. Enhanced Chatbot Route (`app/api/routes.py`)

Updated `/chatbot/message` endpoint:

**Before:**
- Simple system prompt
- No database integration
- Generic textile assistant

**After:**
- Intent-based query detection
- Automatic fiber database search
- Context enrichment with relevant fibers
- Detailed system prompt with guidelines
- RAG implementation

**Flow:**
```
User Question
    ↓
Intent Detection
    ↓
Semantic Search (embeddings) → Keyword Search (fallback)
    ↓
Context Building
    ↓
System Prompt + Fiber Context + Conversation History
    ↓
OpenAI API
    ↓
Enhanced Response with Database Facts
```

## How It Works - Examples

### Example 1: Simple Fiber Query

**User:** "What are the properties of cotton?"

**System Process:**
1. Detects: Identification query, fiber name = "cotton"
2. Searches: Semantic search for "cotton properties"
3. Retrieves: Cotton fiber from database
4. Context: Builds detailed cotton information
5. Response: Answers with specific properties from database

**Response includes:**
- Exact density value
- Moisture regain percentage
- Tenacity range
- Chemical resistance
- Applications
- Sources
- Biodegradability

### Example 2: Comparison Query

**User:** "Compare polyester and nylon for outdoor clothing"

**System Process:**
1. Detects: Comparison query, requires_search = True
2. Searches: Both "polyester" and "nylon"
3. Retrieves: Both fibers with all properties
4. Context: Side-by-side fiber data
5. Response: Detailed comparison using database values

### Example 3: Application-Based Query

**User:** "What's the best fiber for moisture-wicking sportswear?"

**System Process:**
1. Detects: Application inquiry
2. Searches: Semantic search for moisture-wicking
3. Retrieves: Fibers with sportswear applications
4. Context: Multiple fibers with moisture properties
5. Response: Recommendations based on database properties

### Example 4: Non-Fiber Query

**User:** "What's the weather today?"

**System Process:**
1. Detects: No fiber-related intent
2. Skips: Database search
3. Response: "I'm a textile and fiber expert. Please ask questions related to textiles, fibers, or related materials."

## Key Features

### 🔍 Intelligent Search
- **Semantic search** understands natural language (e.g., "strong materials" → high tenacity fibers)
- **Keyword fallback** ensures results even without embeddings
- **Multi-field search** across names, applications, properties

### 🎯 Context-Aware Responses
- Cites specific numerical values
- References classifications and categories
- Includes source information
- Mentions sustainability data

### 📊 Comprehensive Data Integration
- Physical properties (density, tenacity, elongation)
- Chemical properties (resistance profiles)
- Thermal properties (melting point, glass transition)
- Applications and use cases
- Manufacturing and processing info
- Environmental impact

### 🔄 Conversation Memory
- Maintains conversation history
- Can reference previous questions
- Builds on earlier context

## Configuration

### Required Settings

In your `.env` or `app/core/config.py`:

```python
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview  # or gpt-3.5-turbo
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7
```

### Similarity Threshold

Adjust in `routes.py` line 1229:

```python
similarity_threshold=0.65  # Lower = more results (0.5-0.8 recommended)
```

### Search Result Limit

Adjust in `routes.py` line 1228:

```python
limit=5  # Number of fibers to include in context (3-7 recommended)
```

## Database Requirements

### Vector Extension (pgvector)

Ensure your PostgreSQL has pgvector installed:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Embeddings Table

The `fiber_embeddings` table should have:
- Vector embeddings (1536 dimensions for OpenAI text-embedding-3-small)
- Indexed for fast similarity search
- Content indexed by type (name, properties, applications, etc.)

### Populate Embeddings

If embeddings don't exist yet, you'll need to generate them:

```python
# Example script to generate embeddings
from openai import OpenAI
from app.db.session import SessionLocal
from app.models.models import Fiber, FiberEmbedding

client = OpenAI(api_key=settings.OPENAI_API_KEY)
db = SessionLocal()

fibers = db.query(Fiber).filter(Fiber.is_active == True).all()

for fiber in fibers:
    # Create content for embedding
    content = f"{fiber.name} - {fiber.polymer_composition or ''}"

    # Generate embedding
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=content
    )

    # Store embedding
    embedding = FiberEmbedding(
        fiber_id=fiber.id,
        content_type="name_composition",
        content_text=content,
        embedding=response.data[0].embedding
    )
    db.add(embedding)

db.commit()
```

## API Usage

### Start Conversation

```bash
POST /chatbot/start
Authorization: Bearer <token>
```

Response:
```json
{
  "conversation_id": 123,
  "message": "Conversation started"
}
```

### Send Message

```bash
POST /chatbot/message
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "What are the properties of polyester?",
  "conversation_id": 123
}
```

Response:
```json
{
  "response": "Polyester is a synthetic fiber with the following properties based on our database:\n\n**Physical Properties:**\n- Density: 1.38 g/cm³\n- Tenacity: 4.5-5.5 cN/tex\n- Moisture Regain: 0.4%\n\n...",
  "conversation_id": 123
}
```

### End Conversation

```bash
POST /chatbot/end/123
Authorization: Bearer <token>
```

## Testing

### Test Queries to Try

1. **Simple identification:**
   - "What is polyester?"
   - "Tell me about cotton"

2. **Property queries:**
   - "What is the density of nylon?"
   - "What are the thermal properties of wool?"

3. **Comparison:**
   - "Compare cotton and polyester"
   - "Which is stronger, nylon or polyester?"

4. **Application-based:**
   - "Best fiber for winter clothing"
   - "What fiber should I use for outdoor gear?"

5. **Category queries:**
   - "List natural fibers"
   - "What are cellulosic fibers?"

6. **Complex queries:**
   - "I need a biodegradable fiber with high moisture absorption for towels"
   - "Strong synthetic fiber with good chemical resistance"

### Expected Behavior

✅ **Should provide specific database values**
✅ **Should cite properties from the database**
✅ **Should compare using exact data**
✅ **Should handle follow-up questions**
❌ **Should not hallucinate property values**
❌ **Should not answer non-textile questions**

## Performance Optimization

### 1. Caching (Future Enhancement)

Cache frequently accessed fibers:
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_cached_fiber(fiber_id: int):
    return db.query(Fiber).get(fiber_id)
```

### 2. Limit Context Size

Adjust limits to balance accuracy vs. token usage:
- Fewer fibers = faster, cheaper
- More fibers = more comprehensive but expensive

### 3. Index Optimization

Ensure indexes exist:
```sql
CREATE INDEX idx_fibers_name ON fibers USING gin(to_tsvector('english', name));
CREATE INDEX idx_fibers_applications ON fibers USING gin(applications);
```

### 4. Embedding Index

For pgvector performance:
```sql
CREATE INDEX ON fiber_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

## Monitoring

### Track User Interactions

Use the `user_interactions` table:

```python
from app.models.models import UserInteraction

interaction = UserInteraction(
    user_id=current_user.id,
    session_id=conversation.session_id,
    interaction_type="search",
    target_type="fiber",
    target_id=fiber.id,
    interaction_data=json.dumps({"query": query, "intent": intent_type})
)
db.add(interaction)
```

### Monitor Search Quality

Log search results and relevance:
- Track queries with no results
- Monitor similarity scores
- Identify common queries
- Find gaps in database coverage

## Future Enhancements

### 1. User Knowledge Level Integration

Use `client_onboarding.knowledge_level` to adjust:
- Response complexity
- Technical terminology
- Detail level

```python
if current_user.client and current_user.client.onboarding:
    knowledge_level = current_user.client.onboarding.knowledge_level
    # Adjust system prompt based on level
```

### 2. Conversation Analytics

Track:
- Most asked questions
- Common fiber comparisons
- Popular applications
- User satisfaction

### 3. Advanced Property Queries

Use the `fiber_properties` and `property_definitions` tables:
- "Fibers with tenacity > 5 cN/tex"
- "Compare moisture regain across all natural fibers"

### 4. Multi-Modal Responses

Include structure images:
- Return `structure_image_url` with responses
- Display molecular structures
- Show fiber micrographs

### 5. Export & Save Features

Allow users to:
- Save favorite fibers
- Export comparison tables
- Download fiber specification sheets

## Troubleshooting

### Issue: No search results

**Causes:**
- Embeddings not generated
- Similarity threshold too high
- No matching fibers in database

**Solutions:**
- Lower similarity threshold
- Check if embeddings exist
- Verify fiber data in database

### Issue: Generic responses

**Causes:**
- Database search not triggering
- Intent detection failing
- No relevant fibers found

**Solutions:**
- Check intent detection logic
- Verify search query formation
- Review fiber database content

### Issue: Slow responses

**Causes:**
- Large context size
- Unindexed queries
- Missing vector indexes

**Solutions:**
- Reduce search limit
- Add database indexes
- Optimize embedding search

## Summary

### What Changed

1. ✅ Created `FiberSearchService` with semantic + keyword search
2. ✅ Enhanced chatbot with RAG implementation
3. ✅ Added intent detection for smart searches
4. ✅ Integrated fiber context building
5. ✅ Improved system prompts

### What Stayed the Same

1. ✅ Database structure (no changes needed!)
2. ✅ API endpoints (same URLs)
3. ✅ Authentication flow
4. ✅ Conversation management
5. ✅ Frontend compatibility

### Key Benefits

- 🎯 **Accurate responses** using real database values
- 🔍 **Smart search** with semantic understanding
- 📊 **Rich context** including all fiber properties
- 💬 **Natural conversations** with memory
- 🚀 **Scalable** architecture for future features

The system is now production-ready for fiber-related queries!
