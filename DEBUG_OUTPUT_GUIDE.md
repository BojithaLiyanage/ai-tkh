# Debug Output Guide

## Overview

I've added comprehensive debug print statements throughout the chatbot's fiber search functionality. These will help you see exactly what data is being retrieved from the database at each step.

## Where to See Debug Output

When running your FastAPI backend, you'll see debug output in your **terminal/console** where the server is running (not in the API response).

Example:
```bash
uvicorn app.main:app --reload
# or
python -m uvicorn app.main:app --reload
```

## Debug Output Format

### 1. Query Analysis

When a user sends a message, you'll see:

```
============================================================
DEBUG: User Query: where can i find cotton fibers?
DEBUG: Detected Intent: {
    'type': 'application_inquiry',
    'entities': {'fiber_name': 'cotton'},
    'requires_search': True,
    'search_terms': ['cotton']
}
============================================================
```

**What to look for:**
- ✅ `requires_search: True` - System will search database
- ✅ `search_terms` - What will be searched (should be "cotton", not full question)
- ✅ `fiber_name` detected in entities

### 2. Search Process

#### Semantic Search (if embeddings available)

```
DEBUG: Search Query: cotton
[SEMANTIC SEARCH] Starting semantic search for: 'cotton'
[SEMANTIC SEARCH] Embeddings table exists, checking count...
[SEMANTIC SEARCH] Total embeddings in database: 150
[SEMANTIC SEARCH] Generating embedding for query...
[SEMANTIC SEARCH] Embedding generated (dimension: 1536)
[SEMANTIC SEARCH] Searching with threshold: 0.65, limit: 5
[SEMANTIC SEARCH]   - Found: Cotton (similarity: 0.923)
[SEMANTIC SEARCH]   - Found: Organic Cotton (similarity: 0.812)
[SEMANTIC SEARCH] Total results: 2
DEBUG: Semantic Search Results Count: 2
```

**What to look for:**
- ✅ Total embeddings count > 0
- ✅ Similarity scores (higher = better match)
- ✅ Found fiber names

#### Keyword Search (fallback)

```
DEBUG: No semantic results, trying keyword search...
[KEYWORD SEARCH] Searching for: 'cotton' (pattern: '%cotton%')
[KEYWORD SEARCH] Total active fibers in database: 245
[KEYWORD SEARCH] Found 3 matching fiber(s)
DEBUG: Keyword Search Results Count: 3
```

**What to look for:**
- ✅ Total active fibers count (should be > 0)
- ✅ Number of matches found
- ⚠️ If "Database appears to be empty!" - no fibers in database

### 3. Retrieved Fiber Data

For each fiber found, you'll see detailed information:

```
DEBUG: Found 2 fiber(s) from database:

  Fiber 1:
    - ID: 42
    - Fiber ID: FIB-NAT-001
    - Name: Cotton
    - Class: Natural
    - Subtype: Cellulosic
    - Applications: ['Apparel', 'Home Textiles', 'Medical Textiles', 'Industrial']
    - Sources: ['Gossypium hirsutum', 'Cotton Plant Seeds']
    - Density: 1.52 g/cm³
    - Moisture Regain: 8.5%
    - Polymer Composition: Cellulose (β-1,4-glucan)
    - Biodegradable: True
    - Similarity Score: 0.923

  Fiber 2:
    - ID: 43
    - Fiber ID: FIB-NAT-002
    - Name: Organic Cotton
    - Class: Natural
    - Subtype: Cellulosic
    - Applications: ['Sustainable Apparel', 'Baby Products']
    - Sources: ['Organically Grown Cotton']
    - Density: 1.52 g/cm³
    - Moisture Regain: 8.5%
    - Polymer Composition: Cellulose
    - Biodegradable: True
    - Similarity Score: 0.812

============================================================
```

**What to look for:**
- ✅ All key properties populated (not 'N/A')
- ✅ Applications array has relevant entries
- ✅ Similarity scores > 0.65
- ⚠️ If many fields show 'N/A' - incomplete database records

### 4. Context Building

After fibers are found, context is built for the LLM:

```
DEBUG: Context Built (length: 1243 chars)
DEBUG: Context Preview:
Here is relevant information from the fiber database:

1. **Cotton** (ID: FIB-NAT-001)
   - Class: Natural
   - Subtype: Cellulosic
   - Composition: Cellulose (β-1,4-glucan)
   - Applications: Apparel, Home Textiles, Medical Textiles, Industrial
   - Sources: Gossypium hirsutum, Cotton Plant Seeds
   - Properties: Density: 1.52 g/cm³, Moisture Regain: 8.5%
   - Biodegradable: Yes
   - Relevance Score: 0.92
...

============================================================
```

**What to look for:**
- ✅ Context includes specific property values
- ✅ Multiple fibers if applicable
- ✅ Formatted for LLM consumption

## Common Scenarios

### Scenario 1: Empty Database

```
[KEYWORD SEARCH] Total active fibers in database: 0
[KEYWORD SEARCH] Database appears to be empty!
DEBUG: No fibers found in database for query: cotton
DEBUG: Intent does not require search, skipping database query
```

**Action:** Populate your fiber database with data

### Scenario 2: No Embeddings

```
[SEMANTIC SEARCH] Total embeddings in database: 0
[SEMANTIC SEARCH] No embeddings found, falling back to keyword search
[KEYWORD SEARCH] Searching for: 'cotton' (pattern: '%cotton%')
```

**Action:** This is OK! Keyword search will work. Optionally generate embeddings for better results.

### Scenario 3: No Matches Found

```
[KEYWORD SEARCH] Found 0 matching fiber(s)
[KEYWORD SEARCH] Sample fiber names in database: ['Polyester', 'Nylon', 'Wool', 'Silk', 'Rayon']
DEBUG: No fibers found in database for query: bamboo
```

**Action:** Check if the fiber name exists in database. Sample names shown for reference.

### Scenario 4: Successful Search

```
[SEMANTIC SEARCH] Total results: 3
DEBUG: Semantic Search Results Count: 3
DEBUG: Found 3 fiber(s) from database:
  Fiber 1: Cotton (similarity: 0.95)
  ...
DEBUG: Context Built (length: 2156 chars)
```

**Action:** Perfect! Database integration working correctly.

## Troubleshooting

### Issue: "requires_search: False" when it should search

**Check:**
- Is the query about fibers?
- Does it contain fiber names or keywords?
- Look at the detected `type` - should not be "general"

**Fix:** Query might need fiber-related keywords. Try:
- "What is cotton?"
- "Tell me about polyester"
- "Properties of nylon"

### Issue: Keyword search finds 0 results but database has data

**Check:**
```
[KEYWORD SEARCH] Sample fiber names in database: [...]
```

**Possible causes:**
- Query term doesn't match fiber names
- All matching fibers are inactive (is_active = False)
- Typo in search term

**Fix:** Ensure fiber names in database match common terminology

### Issue: Semantic search errors

```
Semantic search error: (psycopg.errors.UndefinedFunction) ...
```

**Possible causes:**
- pgvector extension not installed
- Embeddings table doesn't exist
- Vector dimension mismatch

**Fix:** System will fallback to keyword search automatically

### Issue: Transaction aborted errors

```
[SEMANTIC SEARCH] Embeddings table error: current transaction is aborted
```

**Fix:** This should be fixed with the rollback handling, but if you still see this:
1. Restart your backend server
2. Check database connection
3. Verify no competing transactions

## Performance Monitoring

### Response Time Breakdown

You can estimate performance from the logs:

1. **Intent Detection:** < 10ms (instant)
2. **Semantic Search:**
   - Check embeddings table: ~10ms
   - Generate query embedding: ~100-200ms (OpenAI API)
   - Vector search: ~20-50ms
3. **Keyword Search:** ~30-100ms (depends on database size)
4. **Context Building:** ~5ms
5. **OpenAI Completion:** ~300-1000ms (depends on context size)

**Total:** ~500-1500ms typical response time

### Optimization Tips

If you see slow responses:

1. **Slow embedding generation (>300ms):**
   - OpenAI API might be slow
   - Consider caching common queries

2. **Slow vector search (>100ms):**
   - Add pgvector index: `CREATE INDEX ON fiber_embeddings USING ivfflat (embedding vector_cosine_ops)`

3. **Slow keyword search (>200ms):**
   - Add database indexes on commonly searched fields
   - Reduce search complexity

4. **Large context (>3000 chars):**
   - Reduce search limit (currently 5)
   - Truncate verbose property descriptions

## Production Checklist

Before going live, verify these in logs:

- [ ] `Total active fibers in database: > 0`
- [ ] At least some fibers have populated applications
- [ ] Keyword search finds results for common fibers
- [ ] Context preview looks formatted correctly
- [ ] No Python exceptions in output
- [ ] Semantic search works OR gracefully falls back to keyword

## Disabling Debug Output

Once everything works, you can remove the print statements or add a debug flag:

```python
# At top of routes.py
DEBUG = False  # Set to False in production

# Then wrap prints:
if DEBUG:
    print(f"DEBUG: User Query: {payload.message}")
```

Or use Python's logging module for better control:

```python
import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)  # Change to INFO or WARNING in production

# Replace print with:
logger.debug(f"User Query: {payload.message}")
```

## Example Complete Output

Here's what a complete successful query looks like:

```
============================================================
DEBUG: User Query: what are the properties of cotton?
DEBUG: Detected Intent: {'type': 'property_inquiry', 'entities': {'fiber_name': 'cotton'}, 'requires_search': True, 'search_terms': ['cotton']}
============================================================

DEBUG: Search Query: cotton
[SEMANTIC SEARCH] Starting semantic search for: 'cotton'
[SEMANTIC SEARCH] Embeddings table exists, checking count...
[SEMANTIC SEARCH] Total embeddings in database: 156
[SEMANTIC SEARCH] Generating embedding for query...
[SEMANTIC SEARCH] Embedding generated (dimension: 1536)
[SEMANTIC SEARCH] Searching with threshold: 0.65, limit: 5
[SEMANTIC SEARCH]   - Found: Cotton (similarity: 0.945)
[SEMANTIC SEARCH]   - Found: Organic Cotton (similarity: 0.823)
[SEMANTIC SEARCH]   - Found: Recycled Cotton (similarity: 0.789)
[SEMANTIC SEARCH] Total results: 3
DEBUG: Semantic Search Results Count: 3

DEBUG: Found 3 fiber(s) from database:

  Fiber 1:
    - ID: 42
    - Fiber ID: FIB-NAT-001
    - Name: Cotton
    - Class: Natural
    - Subtype: Cellulosic
    - Applications: ['Apparel', 'Home Textiles', 'Medical Textiles']
    - Sources: ['Gossypium hirsutum']
    - Density: 1.52 g/cm³
    - Moisture Regain: 8.5%
    - Polymer Composition: Cellulose (β-1,4-glucan)
    - Biodegradable: True
    - Similarity Score: 0.945
[... more fibers ...]

============================================================

DEBUG: Context Built (length: 2341 chars)
DEBUG: Context Preview:
Here is relevant information from the fiber database:

1. **Cotton** (ID: FIB-NAT-001)
   - Class: Natural
   - Subtype: Cellulosic
   - Composition: Cellulose (β-1,4-glucan)
   - Applications: Apparel, Home Textiles, Medical Textiles
   ...

============================================================
```

Then OpenAI generates the response using this context!

---

**Happy Debugging! 🐛🔍**

The debug output will help you see exactly what's happening at each step of the fiber search and retrieval process.
