"""
Generate comprehensive embeddings for special fibers database.

This script creates multiple embeddings per special fiber with rich, descriptive content:
1. Basic Info: Name and overview
2. Properties: All JSONB properties formatted
3. Complete: All information combined

Run this script to populate the special_fiber_embeddings table.
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from sqlalchemy import select, delete
from app.db.session import SessionLocal
from app.models.models import SpecialFiber, SpecialFiberEmbedding
from openai import OpenAI
from app.core.config import settings
import time
import json


def build_basic_content(special_fiber: SpecialFiber) -> str:
    """Build content for basic special fiber information."""
    parts = [f"Special Fiber: {special_fiber.name}"]

    # Count properties
    if special_fiber.properties:
        prop_count = len(special_fiber.properties)
        parts.append(f"Properties: {prop_count} specialized attributes")

    return ". ".join(parts)


def build_properties_content(special_fiber: SpecialFiber) -> str:
    """Build content for special fiber properties."""
    parts = [f"{special_fiber.name} Properties:"]

    if special_fiber.properties and isinstance(special_fiber.properties, dict):
        # Format all properties
        for key, value in special_fiber.properties.items():
            # Format the key nicely (replace dots and underscores)
            formatted_key = key.replace('_', ' ').replace('.', ' - ')
            parts.append(f"{formatted_key}: {value}")
    else:
        parts.append("No properties defined")

    return ". ".join(parts)


def build_complete_content(special_fiber: SpecialFiber) -> str:
    """Build comprehensive content combining all information."""
    sections = []

    # Basic info
    basic = build_basic_content(special_fiber)
    sections.append(basic)

    # Properties
    if special_fiber.properties and isinstance(special_fiber.properties, dict):
        props_parts = [f"{special_fiber.name} comprehensive properties:"]
        for key, value in special_fiber.properties.items():
            formatted_key = key.replace('_', ' ').replace('.', ' - ')
            props_parts.append(f"{formatted_key}: {value}")
        sections.append(". ".join(props_parts))

    return " | ".join(sections)


def generate_embedding(client: OpenAI, text: str) -> list:
    """Generate embedding for text using OpenAI."""
    try:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return None


def generate_special_fiber_embeddings(
    db: Session,
    client: OpenAI,
    regenerate: bool = False,
    special_fiber_id: int = None
):
    """
    Generate embeddings for all special fibers in the database.

    Args:
        db: Database session
        client: OpenAI client
        regenerate: If True, delete existing embeddings first
        special_fiber_id: If provided, only generate for specific special fiber
    """

    # Delete existing embeddings if regenerating
    if regenerate:
        print("Deleting existing embeddings...")
        if special_fiber_id:
            db.execute(delete(SpecialFiberEmbedding).where(
                SpecialFiberEmbedding.special_fiber_id == special_fiber_id
            ))
        else:
            db.execute(delete(SpecialFiberEmbedding))
        db.commit()
        print("Existing embeddings deleted.")

    # Query special fibers
    query = select(SpecialFiber)

    if special_fiber_id:
        query = query.where(SpecialFiber.id == special_fiber_id)

    special_fibers = db.execute(query).scalars().all()

    print(f"\nProcessing {len(special_fibers)} special fiber(s)...\n")

    total_embeddings = 0

    for idx, sf in enumerate(special_fibers, 1):
        print(f"[{idx}/{len(special_fibers)}] Processing: {sf.name} (ID: {sf.id})")

        embeddings_to_create = []

        # 1. Basic Information Embedding
        basic_content = build_basic_content(sf)
        if basic_content and len(basic_content) > 20:
            print(f"  → Basic Info: {basic_content[:100]}...")
            basic_embedding = generate_embedding(client, basic_content)
            if basic_embedding:
                embeddings_to_create.append({
                    "content_type": "basic_info",
                    "content": basic_content,
                    "embedding": basic_embedding
                })

        # 2. Properties Embedding
        props_content = build_properties_content(sf)
        if props_content and len(props_content) > 30:
            print(f"  → Properties: {props_content[:100]}...")
            props_embedding = generate_embedding(client, props_content)
            if props_embedding:
                embeddings_to_create.append({
                    "content_type": "properties",
                    "content": props_content,
                    "embedding": props_embedding
                })

        # 3. Complete Embedding (most comprehensive)
        complete_content = build_complete_content(sf)
        if complete_content and len(complete_content) > 50:
            print(f"  → Complete: {complete_content[:100]}...")
            complete_embedding = generate_embedding(client, complete_content)
            if complete_embedding:
                embeddings_to_create.append({
                    "content_type": "complete",
                    "content": complete_content,
                    "embedding": complete_embedding
                })

        # Save embeddings to database
        for emb_data in embeddings_to_create:
            # Check if embedding already exists
            existing = db.execute(
                select(SpecialFiberEmbedding).where(
                    SpecialFiberEmbedding.special_fiber_id == sf.id,
                    SpecialFiberEmbedding.content_type == emb_data["content_type"]
                )
            ).scalar_one_or_none()

            if existing and not regenerate:
                print(f"  ⚠ Skipping {emb_data['content_type']} (already exists)")
                continue

            embedding_record = SpecialFiberEmbedding(
                special_fiber_id=sf.id,
                content_type=emb_data["content_type"],
                content_text=emb_data["content"],
                embedding=emb_data["embedding"],
                embedding_model="text-embedding-3-small"
            )
            db.add(embedding_record)
            total_embeddings += 1

        db.commit()
        print(f"  ✓ Created {len(embeddings_to_create)} embedding(s) for {sf.name}\n")

        # Rate limiting - avoid hitting OpenAI API limits
        time.sleep(0.1)

    print(f"\n{'='*60}")
    print(f"✓ Successfully created {total_embeddings} embeddings for {len(special_fibers)} special fiber(s)")
    print(f"{'='*60}\n")


def main():
    """Main execution function."""
    import argparse

    parser = argparse.ArgumentParser(description="Generate special fiber embeddings")
    parser.add_argument(
        "--regenerate",
        action="store_true",
        help="Delete and regenerate all embeddings"
    )
    parser.add_argument(
        "--special-fiber-id",
        type=int,
        help="Generate embeddings for specific special fiber ID only"
    )

    args = parser.parse_args()

    # Check OpenAI API key
    if not hasattr(settings, 'OPENAI_API_KEY') or not settings.OPENAI_API_KEY:
        print("Error: OPENAI_API_KEY not found in settings")
        print("Please set OPENAI_API_KEY in your .env file")
        return

    print("\n" + "="*60)
    print("Special Fiber Embeddings Generator")
    print("="*60 + "\n")

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    db = SessionLocal()

    try:
        generate_special_fiber_embeddings(
            db=db,
            client=client,
            regenerate=args.regenerate,
            special_fiber_id=args.special_fiber_id
        )
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()
