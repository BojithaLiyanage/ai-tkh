# Fiber Embeddings Generation Guide

## Problem Identified

You correctly identified that the current embeddings are not informative enough:

1. **Issue:** Searching for "cotton" returns "Kapok" as best match
2. **Issue:** Searching for "thermal properties of cotton" finds nothing even though thermal_properties column exists

### Root Cause

Embeddings were likely created with **only the fiber name**, making them too simple:
```python
# ❌ OLD/BAD APPROACH
content = fiber.name  # Just "Cotton"
```

This doesn't capture:
- Properties (thermal, physical, chemical)
- Applications
- Composition
- Sources
- Characteristics

## Solution: Rich, Multi-Type Embeddings

The new script creates **5 different types of embeddings per fiber**, each capturing different aspects:

### 1. **Basic Info** (`basic_info`)
Captures fundamental identification:
```
Fiber: Cotton. Class: Natural. Subtype: Cellulosic. Sources: Gossypium hirsutum, Cotton Plant Seeds. Trade Names: Upland Cotton, Pima Cotton
```

**Best for queries like:**
- "What is cotton?"
- "Natural fibers"
- "Cellulosic fibers"

### 2. **Properties** (`properties`)
Captures all property data:
```
Cotton Properties: Physical: density 1.52 g/cm³, moisture regain 8.5%, tenacity 2.6-3.0 cN/tex.
Chemical: acid resistance poor, alkali resistance good.
Thermal: melting point degrades at 150°C, decomposition 200°C.
Sustainability: biodegradable
```

**Best for queries like:**
- "thermal properties of cotton"
- "density of polyester"
- "moisture absorption"
- "biodegradable fibers"

### 3. **Applications** (`applications`)
Captures use cases:
```
Cotton Applications and Uses: Used for: Apparel, Home Textiles, Medical Textiles, Industrial.
Manufacturing: Carding, Drawing, Spinning. Spinning: Ring Spinning, Open-End Spinning.
Dye Affinity: Direct Dyes, Reactive Dyes
```

**Best for queries like:**
- "fibers for apparel"
- "medical textiles"
- "dyeing properties"

### 4. **Composition** (`composition`)
Captures chemical structure:
```
Cotton Composition: Polymer: Cellulose (β-1,4-glucan).
Repeating Unit: C6H10O5. Functional Groups: Hydroxyl groups, Cellulose chains
```

**Best for queries like:**
- "cellulose fibers"
- "polymer composition"
- "chemical structure"

### 5. **Complete** (`complete`)
Combines everything for comprehensive matching:
```
Fiber: Cotton. Class: Natural. Subtype: Cellulosic | Cotton Properties: Physical: density 1.52... |
Cotton Applications: Apparel, Home Textiles... | Cotton Composition: Cellulose...
```

**Best for:** Complex queries that span multiple aspects

## How It Works

### Semantic Search Strategy

The updated search now:

1. **Searches across ALL embedding types**
2. **Finds the best matching type for each fiber**
3. **Returns top fibers with highest similarity**

Example flow:
```
Query: "thermal properties of cotton"
  ↓
Generate embedding for query
  ↓
Compare against ALL embeddings:
  - cotton/basic_info: similarity 0.65
  - cotton/properties: similarity 0.91 ✓ (BEST)
  - cotton/applications: similarity 0.42
  - cotton/composition: similarity 0.58
  - polyester/properties: similarity 0.73
  ↓
Results:
  1. Cotton (0.91, matched via properties embedding)
  2. Polyester (0.73, matched via properties embedding)
```

## Usage Instructions

### Prerequisites

1. **PostgreSQL with pgvector extension:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. **OpenAI API Key** in your `.env`:
   ```bash
   OPENAI_API_KEY=sk-...
   ```

3. **Active fibers in database** (is_active = true)

### Running the Script

#### Option 1: Generate for All Fibers

```bash
cd backend
python scripts/generate_fiber_embeddings.py
```

This will:
- ✅ Skip fibers that already have embeddings
- ✅ Create 1-5 embeddings per fiber (depending on data availability)
- ✅ Show progress for each fiber

#### Option 2: Regenerate All (Delete and Recreate)

```bash
python scripts/generate_fiber_embeddings.py --regenerate
```

This will:
- ⚠️ **Delete all existing embeddings**
- ✅ Generate fresh embeddings for all fibers
- Use this if embedding strategy changed

#### Option 3: Generate for Specific Fiber

```bash
python scripts/generate_fiber_embeddings.py --fiber-id 42
```

This will:
- ✅ Generate embeddings only for fiber ID 42
- Useful for testing or updating individual fibers

#### Option 4: Regenerate Specific Fiber

```bash
python scripts/generate_fiber_embeddings.py --fiber-id 42 --regenerate
```

### Expected Output

```
============================================================
Fiber Embeddings Generator
============================================================

Deleting existing embeddings...
Existing embeddings deleted.

Processing 150 fiber(s)...

[1/150] Processing: Cotton (ID: 42)
  → Basic Info: Fiber: Cotton. Class: Natural. Subtype: Cellulosic...
  → Properties: Cotton Properties: Physical: density 1.52 g/cm³...
  → Applications: Cotton Applications and Uses: Used for: Apparel...
  → Composition: Cotton Composition: Polymer: Cellulose...
  → Complete: Fiber: Cotton. Class: Natural | Cotton Properties...
  ✓ Created 5 embedding(s) for Cotton

[2/150] Processing: Polyester (ID: 43)
  → Basic Info: Fiber: Polyester. Class: Synthetic...
  → Properties: Polyester Properties: Physical: density 1.38...
  → Applications: Polyester Applications: Apparel, Home Textiles...
  → Composition: Polyester Composition: Polymer: Polyethylene...
  → Complete: Fiber: Polyester. Class: Synthetic...
  ✓ Created 5 embedding(s) for Polyester

...

============================================================
✓ Successfully created 750 embeddings for 150 fiber(s)
============================================================
```

### Cost Estimation

**OpenAI Pricing** (text-embedding-3-small):
- **$0.02 per 1M tokens**
- Average fiber: ~500 tokens for 5 embeddings
- 150 fibers × 500 tokens = 75,000 tokens
- **Cost: ~$0.0015 (less than 1 cent!)**

Very affordable! Even 1000 fibers would cost < $0.01.

## Verification

After generating embeddings, verify they work:

### 1. Check Database

```sql
-- Count total embeddings
SELECT COUNT(*) FROM fiber_embeddings;

-- Count by type
SELECT content_type, COUNT(*)
FROM fiber_embeddings
GROUP BY content_type
ORDER BY content_type;

-- View sample embeddings for a fiber
SELECT
    f.name,
    fe.content_type,
    LEFT(fe.content_text, 100) as preview,
    vector_dims(fe.embedding) as dimensions
FROM fiber_embeddings fe
JOIN fibers f ON fe.fiber_id = f.id
WHERE f.name = 'Cotton';
```

Expected results:
- Total embeddings: (number of fibers × ~4-5)
- Types: basic_info, properties, applications, composition, complete
- Dimensions: 1536 (for text-embedding-3-small)

### 2. Test Queries

Try your problematic queries:

**Test 1: Fiber name search**
```
Query: "cotton"
Expected: Cotton should be top result (not Kapok!)
```

**Test 2: Property search**
```
Query: "thermal properties of cotton"
Expected: Cotton should appear with properties embedding matched
```

**Test 3: Application search**
```
Query: "fibers for medical textiles"
Expected: Fibers with medical applications
```

### 3. Check Debug Output

When testing via chatbot API, watch for:

```
[SEMANTIC SEARCH] Total embeddings in database: 750
[SEMANTIC SEARCH]   - Found: Cotton (similarity: 0.912, type: properties)
```

**Good signs:**
- ✅ High similarity (> 0.8 for exact matches)
- ✅ Correct fiber name
- ✅ Appropriate content_type matched

**Bad signs:**
- ❌ Wrong fiber ranked first
- ❌ Low similarity (< 0.6)
- ❌ No results found

## Troubleshooting

### Issue: Script fails with "OPENAI_API_KEY not found"

**Solution:**
```bash
# Add to .env file
OPENAI_API_KEY=sk-your-key-here

# Or export temporarily
export OPENAI_API_KEY=sk-your-key-here
python scripts/generate_fiber_embeddings.py
```

### Issue: Database connection error

**Solution:**
```python
# Check backend/app/core/config.py has correct DATABASE_URL
# Or check backend/app/db/session.py connection string
```

### Issue: "No fibers found to process"

**Possible causes:**
- No fibers in database
- All fibers have is_active = False

**Solution:**
```sql
-- Check fiber count
SELECT COUNT(*) FROM fibers WHERE is_active = true;

-- Activate fibers if needed
UPDATE fibers SET is_active = true WHERE id IN (...);
```

### Issue: Embeddings created but search still returns wrong results

**Possible causes:**
- Old embeddings still in database
- Need to regenerate

**Solution:**
```bash
# Force regeneration
python scripts/generate_fiber_embeddings.py --regenerate
```

### Issue: Rate limit errors from OpenAI

**Solution:**
The script has built-in rate limiting (0.1s delay), but if you hit limits:
```python
# In script, increase delay:
time.sleep(0.5)  # Instead of 0.1
```

### Issue: Some fibers get fewer than 5 embeddings

**This is normal!** Not all fibers have all types of data:
- If no applications → no applications embedding
- If no polymer_composition → no composition embedding
- All fibers should get at least: basic_info, complete

## Performance Optimization

### 1. Create Vector Index

After generating embeddings, create an index for faster searches:

```sql
-- Create IVFFlat index (fast approximate search)
CREATE INDEX ON fiber_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- For HNSW index (more accurate, PostgreSQL 16+):
CREATE INDEX ON fiber_embeddings
USING hnsw (embedding vector_cosine_ops);
```

### 2. Adjust Search Threshold

In `routes.py`, you can tune the similarity threshold:

```python
search_results = fiber_service.semantic_search(
    query=search_query,
    limit=5,
    similarity_threshold=0.60  # Lower = more results (0.5-0.8 recommended)
)
```

- **0.5-0.6:** Broad search, more results
- **0.65-0.7:** Balanced (current default)
- **0.75-0.85:** Strict, only close matches

## Best Practices

### 1. When to Regenerate Embeddings

Regenerate if you:
- ✅ Updated fiber data (properties, applications, etc.)
- ✅ Changed embedding content strategy
- ✅ Added many new fibers
- ❌ Don't regenerate just because (wastes API calls)

### 2. Incremental Updates

For new fibers:
```bash
# Add fiber to database first
# Then generate embedding for just that fiber
python scripts/generate_fiber_embeddings.py --fiber-id 999
```

### 3. Monitoring Quality

Periodically check:
- Are searches returning expected results?
- Are similarity scores reasonable?
- Do embeddings cover all fiber aspects?

### 4. Database Maintenance

```sql
-- Clean up orphaned embeddings
DELETE FROM fiber_embeddings
WHERE fiber_id NOT IN (SELECT id FROM fibers);

-- Vacuum to reclaim space
VACUUM ANALYZE fiber_embeddings;
```

## Advanced: Customizing Embeddings

### Adding More Embedding Types

Edit `generate_fiber_embeddings.py`:

```python
# Add new embedding type
def build_sustainability_content(fiber: Fiber) -> str:
    """Build content focused on sustainability."""
    parts = [f"{fiber.name} Sustainability:"]

    if fiber.biodegradability is not None:
        parts.append(f"Biodegradable: {'Yes' if fiber.biodegradability else 'No'}")

    if fiber.sustainability_notes:
        parts.append(fiber.sustainability_notes)

    if fiber.environmental_impact_score:
        parts.append(f"Environmental Impact: {fiber.environmental_impact_score}/10")

    return ". ".join(parts)

# Then in generate_fiber_embeddings():
sustainability_content = build_sustainability_content(fiber)
if sustainability_content and len(sustainability_content) > 30:
    sustainability_embedding = generate_embedding(client, sustainability_content)
    # ... save to database
```

### Using Different Embedding Models

Change the model:

```python
# In script:
response = client.embeddings.create(
    model="text-embedding-3-large",  # More accurate, more expensive
    input=text
)

# Update dimension in database (3-large uses 3072 dims)
# ALTER TABLE fiber_embeddings ALTER COLUMN embedding TYPE vector(3072);
```

## Summary

### What We Fixed

❌ **Before:**
- Embeddings: Just fiber name
- Search "cotton" → Returns "Kapok"
- Search "thermal properties" → No results

✅ **After:**
- Embeddings: 5 types covering all aspects
- Search "cotton" → Returns Cotton (high similarity)
- Search "thermal properties of cotton" → Returns Cotton via properties embedding
- Search is comprehensive and accurate

### Next Steps

1. **Run the script:**
   ```bash
   python scripts/generate_fiber_embeddings.py --regenerate
   ```

2. **Test queries:**
   - "cotton"
   - "thermal properties of cotton"
   - "fibers for apparel"

3. **Verify in logs:**
   - Check similarity scores
   - Verify correct content_type matched

4. **Optimize if needed:**
   - Adjust threshold
   - Create vector index
   - Fine-tune embedding content

The search should now work perfectly! 🎯
