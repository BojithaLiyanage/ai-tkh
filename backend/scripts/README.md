# Scripts Directory

## Overview

This directory contains utility scripts for managing the fiber database.

## Available Scripts

### `generate_fiber_embeddings.py`

Generate semantic search embeddings for fibers in the database.

**Purpose:** Creates rich, multi-type embeddings that enable accurate semantic search for fiber properties, applications, composition, and more.

#### Quick Start

```bash
# Generate embeddings for all fibers (skip existing)
python scripts/generate_fiber_embeddings.py

# Regenerate all embeddings (delete and recreate)
python scripts/generate_fiber_embeddings.py --regenerate

# Generate for specific fiber only
python scripts/generate_fiber_embeddings.py --fiber-id 42
```

#### Prerequisites

1. OpenAI API key in `.env`:
   ```
   OPENAI_API_KEY=sk-...
   ```

2. PostgreSQL with pgvector extension:
   ```sql
   CREATE EXTENSION vector;
   ```

3. Active fibers in database

#### What It Does

Creates 5 types of embeddings per fiber:
1. **basic_info** - Name, class, subtype, sources
2. **properties** - Physical, chemical, thermal properties
3. **applications** - Use cases and applications
4. **composition** - Polymer composition and structure
5. **complete** - All information combined

#### Cost

Very cheap! ~$0.0015 for 150 fibers using OpenAI's text-embedding-3-small.

#### Documentation

See [EMBEDDING_GENERATION_GUIDE.md](../../EMBEDDING_GENERATION_GUIDE.md) for complete documentation.

## Adding New Scripts

Place new utility scripts in this directory and update this README.

### Script Template

```python
"""
Script description.
"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from app.db.session import SessionLocal
# ... other imports

def main():
    db = SessionLocal()
    try:
        # Script logic
        pass
    finally:
        db.close()

if __name__ == "__main__":
    main()
```
