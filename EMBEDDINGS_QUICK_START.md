# Fiber Embeddings - Quick Start Guide

## TL;DR

Generate embeddings for all fibers so the chatbot can find them using semantic search.

---

## 3-Step Setup

### Step 1: Check Current Status
```bash
curl -X GET "http://localhost:8000/api/fibers/embeddings/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response shows:**
- ✅ 45 fibers with 162 embeddings = Ready
- ⚠️ 45 fibers with 0 embeddings = Need to generate
- ⚠️ Partial coverage = Run generation again

### Step 2: Generate Embeddings
```bash
curl -X POST "http://localhost:8000/api/fibers/generate-embeddings" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**What happens:**
- Creates embeddings for each fiber (name, description, properties, applications)
- Saves to `fiber_embeddings` table
- Takes 30-120 seconds depending on fiber count
- Shows progress in console logs

**Response shows:**
- ✅ `total_embeddings_created`: Number created
- ✅ `embeddings_by_type`: Breakdown by type
- ✅ `processing_time_seconds`: How long it took
- ⚠️ `errors`: Any failures

### Step 3: Verify Success
```bash
curl -X GET "http://localhost:8000/api/fibers/embeddings/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Look for:**
- ✅ `coverage_percentage`: Should be 95%+ (or 100%)
- ✅ `total_embeddings`: Should match fiber count × 4 (approximately)
- ✅ `fibers_missing_embeddings`: Should be 0 or very small

---

## Common Commands

### Generate All Embeddings (Skip Existing)
```bash
POST /api/fibers/generate-embeddings
```

### Force Regenerate All Embeddings
```bash
POST /api/fibers/generate-embeddings?force_regenerate=true
```

### Check Embeddings Status
```bash
GET /api/fibers/embeddings/status
```

### Delete Embeddings for One Fiber
```bash
DELETE /api/fibers/embeddings/5
```
(Replace `5` with fiber ID)

---

## What Each Endpoint Does

### POST `/api/fibers/generate-embeddings`

| Parameter | Type | Default | Effect |
|-----------|------|---------|--------|
| `force_regenerate` | boolean | false | If true, regenerates existing embeddings |

**Returns:**
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
  "errors": 0,
  "processing_time_seconds": 28.5
}
```

### GET `/api/fibers/embeddings/status`

**Returns:**
```json
{
  "total_fibers": 45,
  "fibers_with_embeddings": 45,
  "total_embeddings": 162,
  "coverage_percentage": 100.0,
  "embeddings_by_type": {
    "name": 45,
    "description": 35,
    "properties": 40,
    "applications": 42
  },
  "missing_fibers_list": []
}
```

### DELETE `/api/fibers/embeddings/{fiber_id}`

**Returns:**
```json
{
  "status": "success",
  "fiber_name": "Cotton",
  "embeddings_deleted": 4
}
```

---

## Scenarios

### Scenario 1: First Setup
```bash
# 1. Check status
curl -X GET .../fibers/embeddings/status -H "Authorization: Bearer TOKEN"
# Result: 45 fibers, 0 embeddings

# 2. Generate
curl -X POST .../fibers/generate-embeddings -H "Authorization: Bearer TOKEN"
# Wait ~30-120 seconds

# 3. Verify
curl -X GET .../fibers/embeddings/status -H "Authorization: Bearer TOKEN"
# Result: 45 fibers, 162 embeddings, 100% coverage
```

### Scenario 2: Added New Fiber to Database
```bash
# 1. Check status (shows new fiber missing embeddings)
GET .../fibers/embeddings/status
# Result: 46 fibers, 162 embeddings, 95.6% coverage

# 2. Regenerate (includes new fiber)
POST .../fibers/generate-embeddings

# 3. Verify
GET .../fibers/embeddings/status
# Result: 46 fibers, 166 embeddings, 100% coverage
```

### Scenario 3: Updated Fiber Properties
```bash
# 1. Update fiber in database
UPDATE fibers SET density_g_cm3 = 1.6 WHERE id = 5;

# 2. Delete old embeddings
DELETE .../fibers/embeddings/5

# 3. Regenerate (includes the updated fiber)
POST .../fibers/generate-embeddings
```

---

## Embedding Types

Each fiber gets 4 embeddings:

| Type | Content | Used For |
|------|---------|----------|
| **name** | Fiber name (e.g., "Cotton") | Fiber identification |
| **description** | Composition, class, subtype, sources | Understanding fiber origin |
| **properties** | Physical/chemical/thermal properties | Property-based queries |
| **applications** | Intended uses | Application-based searches |

---

## Troubleshooting

### "No embeddings found"
```bash
# Check status
GET /api/fibers/embeddings/status

# Regenerate if needed
POST /api/fibers/generate-embeddings
```

### "OpenAI API key error"
```bash
# Verify key is set (in your environment)
echo $OPENAI_API_KEY

# If not set, add to your .env file
OPENAI_API_KEY=sk-...
```

### "Unauthorized (401)"
```bash
# Verify JWT token is valid
# Make sure it's an admin user token
# Check header format: Authorization: Bearer YOUR_TOKEN
```

### "Search not finding fibers"
1. Check status: `GET /api/fibers/embeddings/status`
2. If coverage < 100%, regenerate
3. If still not finding, check similarity threshold in code (default 0.45)

---

## Performance

| Operation | Time | Cost |
|-----------|------|------|
| Generate 45 fibers | ~120 seconds | $0.005 |
| Check status | ~50 ms | Free |
| Delete embeddings | ~10 ms | Free |

---

## Console Output

When generating embeddings, you'll see:

```
======================================================================
EMBEDDING GENERATION STARTED
Total fibers to process: 45
Force regenerate: false
======================================================================

[1/45] Processing: Cotton
  └─ name: GENERATING...
     → name: SAVED ✓
  └─ description: GENERATING...
     → description: SAVED ✓
  └─ properties: GENERATING...
     → properties: SAVED ✓
  └─ applications: GENERATING...
     → applications: SAVED ✓
  ✓ Fiber committed to database

[2/45] Processing: Polyester
  ...

======================================================================
EMBEDDING GENERATION COMPLETED
Total fibers processed: 45
Total embeddings created: 162
Embeddings by type: {'name': 45, 'description': 35, 'properties': 40, 'applications': 42}
Errors: 0
Processing time: 28.50 seconds
======================================================================
```

---

## Next Steps After Setup

1. **Tell users to test**: Ask chatbot questions about fibers
2. **Monitor coverage**: Check status periodically
3. **Update as needed**: Regenerate when fiber data changes
4. **Optional**: Clear fiber cache after generation (improves search recognition)

```bash
# Optional: Clear fiber cache
POST /api/chatbot/cache/clear \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Key Points

✅ **DO:**
- Generate embeddings before semantic search is used
- Check status to verify coverage
- Regenerate when adding new fibers

❌ **DON'T:**
- Forget OpenAI API key setup
- Use `force_regenerate=true` unless necessary (costs money)
- Ignore missing embeddings (search won't find those fibers)

---

## Questions?

See [FIBER_EMBEDDINGS_GUIDE.md](FIBER_EMBEDDINGS_GUIDE.md) for detailed documentation.

