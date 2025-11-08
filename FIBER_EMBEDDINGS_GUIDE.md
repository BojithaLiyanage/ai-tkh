# Fiber Embeddings Generation Guide

## Overview

This guide explains how to use the fiber embeddings endpoints to generate, manage, and monitor semantic embeddings for all fibers in the database. Embeddings enable semantic search, allowing the chatbot to find relevant fibers based on meaning rather than exact keyword matches.

---

## What Are Fiber Embeddings?

**Embeddings** are numerical representations (vectors) of text content that capture semantic meaning. They enable:

- **Semantic Search**: Find fibers by meaning (e.g., "fibers with high strength" → finds relevant fibers)
- **Similarity Matching**: Compare fiber properties mathematically
- **Context Understanding**: Understand relationships between fiber characteristics
- **Natural Language Queries**: Users can ask questions in natural language

### Example:
```
User Query: "What fibers are strong and durable?"
           ↓
Convert to embedding (1536-dimensional vector)
           ↓
Compare with fiber embeddings in database
           ↓
Find semantically similar fibers (Cotton, Polyester, Nylon)
           ↓
Return relevant results to user
```

---

## API Endpoints

### 1. Generate Embeddings for All Fibers

**Endpoint:**
```
POST /api/fibers/generate-embeddings
```

**Authentication:** Admin user required (via JWT token)

**Query Parameters:**
```
force_regenerate (optional): boolean
  - If true: Regenerates embeddings even if they already exist
  - If false (default): Skips fibers with existing embeddings
```

**Request Example:**
```bash
# Generate embeddings for all fibers (skip existing)
curl -X POST "http://localhost:8000/api/fibers/generate-embeddings" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Force regenerate all embeddings
curl -X POST "http://localhost:8000/api/fibers/generate-embeddings?force_regenerate=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "status": "success",
  "total_fibers": 45,
  "total_embeddings_created": 162,
  "embeddings_by_type": {
    "name": 45,
    "description": 35,
    "properties": 40,
    "applications": 42
  },
  "skipped": 0,
  "errors": 0,
  "error_details": [],
  "processing_time_seconds": 28.5
}
```

**What It Does:**

1. **Fetches all active fibers** from the database
2. **Creates embeddings for multiple content types:**
   - `name`: Fiber name (always created)
   - `description`: Composition, class, subtype, sources
   - `properties`: Physical/chemical/thermal properties
   - `applications`: Intended applications
3. **Generates OpenAI embeddings** using `text-embedding-3-small` model
4. **Saves to database** in `fiber_embeddings` table
5. **Returns statistics** with progress and timing

**Important Notes:**
- ⏱️ **Time-Consuming**: Generating embeddings for 45 fibers takes ~30 seconds (API calls)
- 💾 **Storage**: Each embedding = 1536 dimensions × 4 bytes = ~6KB
- 🔁 **Skipping**: By default, skips fibers that already have embeddings
- ⚠️ **Force Regenerate**: Use `force_regenerate=true` to update existing embeddings

---

### 2. Get Embeddings Status

**Endpoint:**
```
GET /api/fibers/embeddings/status
```

**Authentication:** Admin user required

**Request Example:**
```bash
curl -X GET "http://localhost:8000/api/fibers/embeddings/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "total_fibers": 45,
  "fibers_with_embeddings": 43,
  "fibers_missing_embeddings": 2,
  "total_embeddings": 158,
  "coverage_percentage": 95.56,
  "embeddings_by_type": {
    "name": 43,
    "description": 40,
    "properties": 38,
    "applications": 37
  },
  "missing_fibers_list": [
    "TestFiber1",
    "TestFiber2"
  ]
}
```

**Use Cases:**
- Check if embeddings exist before running semantic search
- Monitor embedding coverage across database
- Identify fibers missing embeddings
- Verify embeddings were created successfully

---

### 3. Delete Embeddings for a Single Fiber

**Endpoint:**
```
DELETE /api/fibers/embeddings/{fiber_id}
```

**Authentication:** Admin user required

**Request Example:**
```bash
curl -X DELETE "http://localhost:8000/api/fibers/embeddings/5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "status": "success",
  "fiber_name": "Cotton",
  "embeddings_deleted": 4
}
```

**Use Cases:**
- Delete embeddings for a specific fiber
- Prepare to regenerate embeddings for updated fiber data
- Clean up test data

---

## Embedding Types

The system generates embeddings for 4 different content types per fiber:

### 1. Name Embedding
```
Content: "Cotton"
Purpose: Direct fiber name matching
Used for: Quick identification when user mentions fiber by name
```

### 2. Description Embedding
```
Content: "Composition: cellulose Composition: cellulose acetate. Class: Natural.
          Subtype: Seed Hair. Sources: Cotton plant bolls"
Purpose: Capture fiber origin and general characteristics
Used for: Understanding fiber type and source
```

### 3. Properties Embedding
```
Content: "Density 1.52 g/cm³. Tenacity 3.5-5.0 cN/tex. Moisture regain 8.5%.
          Thermal: Does not melt. Resistance: Acid: resistant, Alkali: resistant"
Purpose: Encode physical and chemical properties
Used for: Property-based searches (e.g., "strong fibers", "heat resistant")
```

### 4. Applications Embedding
```
Content: "Applications: Apparel, Home textiles, Industrial, Medical"
Purpose: Capture intended uses
Used for: Application-based searches (e.g., "medical textiles", "industrial applications")
```

---

## How Semantic Search Uses Embeddings

### Example Flow:

**Step 1: User Query**
```
User: "What are good fibers for strong clothing?"
```

**Step 2: Generate Query Embedding**
```
OpenAI embedding: [0.0234, -0.0891, 0.1234, ..., 0.0456]  (1536 dimensions)
```

**Step 3: Compare with Fiber Embeddings**
```
Compare query with each fiber's embeddings using cosine distance:

Cotton (name):        similarity = 0.85 (good match)
Cotton (properties):  similarity = 0.92 (excellent - mentions strength)
Cotton (applic):      similarity = 0.88 (mentions clothing)

Polyester (name):     similarity = 0.12 (poor match)
Polyester (prop):     similarity = 0.78 (mentions strength)
Polyester (applic):   similarity = 0.85 (mentions clothing)

Nylon (name):         similarity = 0.10 (poor match)
Nylon (properties):   similarity = 0.89 (mentions strength)
Nylon (applications): similarity = 0.82 (mentions clothing)
```

**Step 4: Rank Results**
```
Results (sorted by similarity):
1. Cotton (properties) - 0.92 ✅ Best match
2. Nylon (properties) - 0.89 ✅ Very good
3. Polyester (properties) - 0.78 ✅ Good
4. Cotton (applications) - 0.88
5. Nylon (applications) - 0.82
```

**Step 5: Return Relevant Fibers**
```
Chatbot: "For strong clothing, the best options are:
- Cotton: High strength (3.5-5.0 cN/tex tenacity)
- Nylon: Excellent strength (mechanical properties)
- Polyester: Good strength (chemical properties)"
```

---

## Database Schema

### FiberEmbedding Table

```sql
CREATE TABLE fiber_embeddings (
    id INTEGER PRIMARY KEY,
    fiber_id INTEGER NOT NULL (references fibers.id),
    content_type VARCHAR(50) NOT NULL,  -- 'name', 'description', 'properties', 'applications'
    content_text TEXT NOT NULL,          -- Original text that was embedded
    embedding pgvector.vector(1536),    -- 1536-dimensional vector
    embedding_model VARCHAR(100),        -- 'text-embedding-3-small'
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(fiber_id, content_type)      -- One embedding per fiber per type
);

CREATE INDEX idx_fiber_embedding_unique
ON fiber_embeddings(fiber_id, content_type);
```

---

## Implementation Details

### Embedding Generation Process

**For each fiber:**

```python
# 1. Create embeddings list
embeddings = [
    {"type": "name", "text": fiber.name},
    {"type": "description", "text": build_description(fiber)},
    {"type": "properties", "text": build_properties(fiber)},
    {"type": "applications", "text": ", ".join(fiber.applications)}
]

# 2. For each embedding:
for embedding in embeddings:
    # Check if already exists
    if exists and not force_regenerate:
        skip this embedding
    else:
        # Generate embedding
        vector = openai.embeddings.create(
            model="text-embedding-3-small",
            input=embedding["text"]
        )

        # Save to database
        db.create(FiberEmbedding(
            fiber_id=fiber.id,
            content_type=embedding["type"],
            embedding=vector
        ))

# 3. Commit to database
db.commit()
```

### Content Building Examples

**Description:**
```python
description_parts = [
    f"Composition: {fiber.polymer_composition}",
    f"Class: {fiber.fiber_class.name}",
    f"Subtype: {fiber.subtype.name}",
    f"Sources: {', '.join(fiber.sources)}"
]
description = " ".join(description_parts)
# Result: "Composition: cellulose acetate Class: Natural Subtype: Seed Hair Sources: cotton plants"
```

**Properties:**
```python
properties_parts = [
    f"Density {fiber.density_g_cm3} g/cm³",
    f"Tenacity {fiber.tenacity_min}-{fiber.tenacity_max} cN/tex",
    f"Moisture regain {fiber.moisture_regain_percent}%",
    f"Thermal: {fiber.thermal_properties}",
    f"Resistance: Acid:{acid}, Alkali:{alkali}, Microbial:{microbial}"
]
```

---

## Usage Workflow

### Scenario 1: First-Time Setup

```bash
# 1. Check current status
curl -X GET "http://localhost:8000/api/fibers/embeddings/status" \
  -H "Authorization: Bearer TOKEN"

# Response shows: 45 total fibers, 0 with embeddings

# 2. Generate embeddings for all fibers
curl -X POST "http://localhost:8000/api/fibers/generate-embeddings" \
  -H "Authorization: Bearer TOKEN"

# Processing... (30-60 seconds depending on fiber count)

# 3. Verify status
curl -X GET "http://localhost:8000/api/fibers/embeddings/status" \
  -H "Authorization: Bearer TOKEN"

# Response shows: 45 total fibers, 45 with embeddings, 95%+ coverage
```

### Scenario 2: Add New Fiber to Database

```bash
# 1. Add new fiber to database
INSERT INTO fibers (name, fiber_id, ...) VALUES ('NewFiber', 'F0050', ...);

# 2. Check status (shows NewFiber missing embeddings)
curl -X GET "http://localhost:8000/api/fibers/embeddings/status"

# 3. Regenerate all embeddings (includes new fiber)
curl -X POST "http://localhost:8000/api/fibers/generate-embeddings"

# Or regenerate only new fiber (would need to delete others first)
```

### Scenario 3: Update Fiber Properties

```bash
# 1. Update fiber in database
UPDATE fibers SET density_g_cm3 = 1.6 WHERE id = 5;

# 2. Delete old embeddings for that fiber
curl -X DELETE "http://localhost:8000/api/fibers/embeddings/5" \
  -H "Authorization: Bearer TOKEN"

# 3. Regenerate embeddings (skip existing, only this fiber)
curl -X POST "http://localhost:8000/api/fibers/generate-embeddings" \
  -H "Authorization: Bearer TOKEN"
```

---

## Performance Characteristics

### Timing

| Operation | Time |  Cost |
|-----------|------|-------|
| Generate 1 embedding | ~0.6 seconds | $0.02 / 1M tokens (OpenAI) |
| Generate embeddings for 1 fiber (4 types) | ~2.4 seconds | $0.08 |
| Generate for 45 fibers | ~120 seconds (2 min) | $3.60 |
| Check status | ~50ms | Free |
| Delete fiber embeddings | ~10ms | Free |

### Storage

| Item | Size |
|------|------|
| Single embedding (1536 dims) | ~6 KB |
| Fiber embeddings (4 types) | ~24 KB |
| 45 fibers × 4 types | ~4.3 MB |
| PostgreSQL pgvector index | ~2 MB |
| **Total** | **~6.3 MB** |

### Query Performance

| Operation | Time |
|-----------|------|
| Semantic search (pgvector) | ~50 ms |
| Find similar fibers | ~20 ms |
| Complex query | ~100 ms |

---

## Troubleshooting

### Problem: "Invalid OpenAI API Key"

**Solution:**
```bash
# Verify OPENAI_API_KEY is set
echo $OPENAI_API_KEY

# Set if missing
export OPENAI_API_KEY="sk-..."
```

### Problem: "Endpoint requires admin user"

**Solution:**
```bash
# Ensure JWT token is for admin user
# Check user role in database:
SELECT user_type FROM users WHERE email='your@email.com';
# Should be 'super_admin' or 'admin'
```

### Problem: "Some embeddings failed to generate"

**Solution:**
1. Check error_details in response
2. Fix the problematic fiber data
3. Force regenerate: `?force_regenerate=true`

### Problem: "Embeddings not helping with search"

**Possible causes:**
- Embeddings not generated for new fibers
- Similarity threshold too high (chatbot defaults to 0.45)
- Content text doesn't match user queries well

**Solution:**
```bash
# 1. Check coverage
GET /api/fibers/embeddings/status

# 2. Regenerate with fresh content
POST /api/fibers/generate-embeddings?force_regenerate=true

# 3. Adjust similarity threshold in semantic_search() call
similarity_threshold=0.35  # More permissive
```

---

## Integration with Chatbot

### How Embeddings Power Semantic Search

**In `semantic_search()` method (fiber_service.py):**

```python
def semantic_search(self, query: str, limit: int = 5):
    # 1. Generate embedding for user query
    query_embedding = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=query
    )

    # 2. Search fiber_embeddings table for similar vectors
    results = db.execute("""
        SELECT fiber_id,
               1 - (embedding <=> query_vector) as similarity
        FROM fiber_embeddings
        WHERE similarity >= 0.45
        ORDER BY similarity DESC
        LIMIT 5
    """)

    # 3. Return ranked results
    return results
```

**Example User Query Flow:**

```
User: "What fibers can handle high temperatures?"
    ↓
detect_query_intent() → "property_inquiry"
    ↓
semantic_search("What fibers can handle high temperatures?")
    ↓
Generate query embedding
    ↓
Compare with fiber_embeddings table
    ↓
Find high-similarity fibers (Kevlar, Nomex, Polyimide)
    ↓
Fetch full Fiber objects
    ↓
build_fiber_context() with thermal properties
    ↓
Send to OpenAI with system prompt
    ↓
Return response: "For high temperature applications, these fibers are excellent..."
```

---

## Best Practices

### ✅ DO:

- **Generate embeddings initially** before users can search
- **Monitor coverage** regularly (target: 100%)
- **Regenerate when data changes** (important properties updated)
- **Use status endpoint** to verify before troubleshooting search issues
- **Delete and regenerate** for single fibers rather than all fibers (saves time/cost)

### ❌ DON'T:

- Generate embeddings multiple times without checking status
- Forget OpenAI API key (embeddings will fail silently)
- Leave fibers without embeddings (search won't find them)
- Forget to clear chatbot fiber cache after generating embeddings
- Use `force_regenerate=true` unnecessarily (costs money)

---

## Cost Analysis

### OpenAI Embeddings Pricing

As of 2024:
- `text-embedding-3-small`: $0.02 per 1 million tokens

### Example Costs

```
For 45 fibers with ~150 tokens per embedding on average:

Tokens per fiber × 4 types = 600 tokens
45 fibers × 600 tokens = 27,000 tokens

Cost = 27,000 / 1,000,000 × $0.02 = $0.00054 per generation

Initial setup: ~$0.005
Monthly updates: ~$0.01
Yearly: ~$0.15
```

Very inexpensive!

---

## Summary

| Feature | Details |
|---------|---------|
| **What** | Generate semantic embeddings for fibers |
| **Why** | Enable semantic search in chatbot |
| **Where** | Saved in `fiber_embeddings` table |
| **How** | POST `/api/fibers/generate-embeddings` |
| **Cost** | ~$0.005 per setup |
| **Time** | ~30-120 seconds depending on fiber count |
| **Monitor** | GET `/api/fibers/embeddings/status` |
| **Admin Only** | Yes, requires admin JWT token |

---

## Next Steps

1. **Generate initial embeddings**: POST `/api/fibers/generate-embeddings`
2. **Verify status**: GET `/api/fibers/embeddings/status`
3. **Test semantic search**: Ask chatbot questions about fibers
4. **Monitor coverage**: Check status regularly
5. **Update as needed**: Regenerate when fiber data changes

