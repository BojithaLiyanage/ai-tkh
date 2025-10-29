"""
Generate comprehensive embeddings for fiber database.

This script creates multiple embeddings per fiber with rich, descriptive content:
1. Basic Info: Name, class, subtype, sources
2. Properties: Physical, chemical, thermal properties
3. Applications: Use cases and applications
4. Composition: Polymer composition and structure
5. Complete: All information combined

Run this script to populate the fiber_embeddings table.
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, delete
from app.db.session import SessionLocal
from app.models.models import Fiber, FiberEmbedding
from openai import OpenAI
from app.core.config import settings
import time


def build_basic_content(fiber: Fiber) -> str:
    """Build content for basic fiber information."""
    parts = [f"Fiber: {fiber.name}"]

    if fiber.fiber_class:
        parts.append(f"Class: {fiber.fiber_class.name}")

    if fiber.subtype:
        parts.append(f"Subtype: {fiber.subtype.name}")

    if fiber.synthetic_type:
        parts.append(f"Synthetic Type: {fiber.synthetic_type.name}")

    if fiber.polymerization_type:
        parts.append(f"Polymerization: {fiber.polymerization_type.name}")

    if fiber.sources and len(fiber.sources) > 0:
        parts.append(f"Sources: {', '.join(fiber.sources)}")

    if fiber.trade_names and len(fiber.trade_names) > 0:
        parts.append(f"Trade Names: {', '.join(fiber.trade_names[:5])}")

    return ". ".join(parts)


def build_properties_content(fiber: Fiber) -> str:
    """Build content for fiber properties."""
    parts = [f"{fiber.name} Properties:"]

    # Physical properties
    physical = []
    if fiber.density_g_cm3:
        physical.append(f"density {fiber.density_g_cm3} g/cm³")
    if fiber.moisture_regain_percent:
        physical.append(f"moisture regain {fiber.moisture_regain_percent}%")
    if fiber.absorption_capacity_percent:
        physical.append(f"absorption capacity {fiber.absorption_capacity_percent}%")
    if fiber.tenacity_min_cn_tex and fiber.tenacity_max_cn_tex:
        physical.append(f"tenacity {fiber.tenacity_min_cn_tex}-{fiber.tenacity_max_cn_tex} cN/tex")
    if fiber.elongation_min_percent and fiber.elongation_max_percent:
        physical.append(f"elongation {fiber.elongation_min_percent}-{fiber.elongation_max_percent}%")
    if fiber.fineness_min_um and fiber.fineness_max_um:
        physical.append(f"fineness {fiber.fineness_min_um}-{fiber.fineness_max_um} μm")

    if physical:
        parts.append(f"Physical: {', '.join(physical)}")

    # Chemical properties
    chemical = []
    if fiber.acid_resistance:
        chemical.append(f"acid resistance: {fiber.acid_resistance}")
    if fiber.alkali_resistance:
        chemical.append(f"alkali resistance: {fiber.alkali_resistance}")
    if fiber.microbial_resistance:
        chemical.append(f"microbial resistance: {fiber.microbial_resistance}")

    if chemical:
        parts.append(f"Chemical: {', '.join(chemical)}")

    # Thermal properties
    thermal = []
    if fiber.melting_point_c:
        thermal.append(f"melting point {fiber.melting_point_c}°C")
    if fiber.glass_transition_temp_c:
        thermal.append(f"glass transition {fiber.glass_transition_temp_c}°C")
    if fiber.decomposition_temp_c:
        thermal.append(f"decomposition {fiber.decomposition_temp_c}°C")
    if fiber.thermal_properties:
        thermal.append(fiber.thermal_properties)

    if thermal:
        parts.append(f"Thermal: {', '.join(thermal)}")

    # Sustainability
    if fiber.biodegradability is not None:
        biodeg = "biodegradable" if fiber.biodegradability else "non-biodegradable"
        parts.append(f"Sustainability: {biodeg}")

    if fiber.sustainability_notes:
        parts.append(f"Environmental: {fiber.sustainability_notes[:200]}")

    return ". ".join(parts)


def build_applications_content(fiber: Fiber) -> str:
    """Build content for fiber applications."""
    parts = [f"{fiber.name} Applications and Uses:"]

    if fiber.applications and len(fiber.applications) > 0:
        parts.append(f"Used for: {', '.join(fiber.applications)}")

    if fiber.manufacturing_process and len(fiber.manufacturing_process) > 0:
        parts.append(f"Manufacturing: {', '.join(fiber.manufacturing_process)}")

    if fiber.spinning_method and len(fiber.spinning_method) > 0:
        parts.append(f"Spinning: {', '.join(fiber.spinning_method)}")

    if fiber.post_treatments and len(fiber.post_treatments) > 0:
        parts.append(f"Treatments: {', '.join(fiber.post_treatments)}")

    if fiber.dye_affinity and len(fiber.dye_affinity) > 0:
        parts.append(f"Dye Affinity: {', '.join(fiber.dye_affinity)}")

    return ". ".join(parts)


def build_composition_content(fiber: Fiber) -> str:
    """Build content for fiber composition and structure."""
    parts = [f"{fiber.name} Composition:"]

    if fiber.polymer_composition:
        parts.append(f"Polymer: {fiber.polymer_composition}")

    if fiber.repeating_unit:
        parts.append(f"Repeating Unit: {fiber.repeating_unit}")

    if fiber.degree_of_polymerization:
        parts.append(f"Degree of Polymerization: {fiber.degree_of_polymerization}")

    if fiber.functional_groups and len(fiber.functional_groups) > 0:
        parts.append(f"Functional Groups: {', '.join(fiber.functional_groups)}")

    if fiber.molecular_structure_smiles:
        parts.append(f"Structure: {fiber.molecular_structure_smiles}")

    return ". ".join(parts)


def build_complete_content(fiber: Fiber) -> str:
    """Build comprehensive content combining all information."""
    sections = []

    # Basic info
    basic = build_basic_content(fiber)
    sections.append(basic)

    # Properties
    props = build_properties_content(fiber)
    if len(props.split(":")) > 1:  # Has actual content
        sections.append(props)

    # Applications
    apps = build_applications_content(fiber)
    if len(apps.split(":")) > 1:
        sections.append(apps)

    # Composition
    comp = build_composition_content(fiber)
    if len(comp.split(":")) > 1:
        sections.append(comp)

    # Add identification methods
    if fiber.identification_methods:
        sections.append(f"Identification: {fiber.identification_methods[:200]}")

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


def generate_fiber_embeddings(
    db: Session,
    client: OpenAI,
    regenerate: bool = False,
    fiber_id: int = None
):
    """
    Generate embeddings for all fibers in the database.

    Args:
        db: Database session
        client: OpenAI client
        regenerate: If True, delete existing embeddings first
        fiber_id: If provided, only generate for specific fiber
    """

    # Delete existing embeddings if regenerating
    if regenerate:
        print("Deleting existing embeddings...")
        if fiber_id:
            db.execute(delete(FiberEmbedding).where(FiberEmbedding.fiber_id == fiber_id))
        else:
            db.execute(delete(FiberEmbedding))
        db.commit()
        print("Existing embeddings deleted.")

    # Query fibers
    query = select(Fiber).options(
        joinedload(Fiber.fiber_class),
        joinedload(Fiber.subtype),
        joinedload(Fiber.synthetic_type),
        joinedload(Fiber.polymerization_type)
    ).where(Fiber.is_active == True)

    if fiber_id:
        query = query.where(Fiber.id == fiber_id)

    fibers = db.execute(query).scalars().all()

    print(f"\nProcessing {len(fibers)} fiber(s)...\n")

    total_embeddings = 0

    for idx, fiber in enumerate(fibers, 1):
        print(f"[{idx}/{len(fibers)}] Processing: {fiber.name} (ID: {fiber.id})")

        embeddings_to_create = []

        # 1. Basic Information Embedding
        basic_content = build_basic_content(fiber)
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
        props_content = build_properties_content(fiber)
        if props_content and len(props_content) > 30:
            print(f"  → Properties: {props_content[:100]}...")
            props_embedding = generate_embedding(client, props_content)
            if props_embedding:
                embeddings_to_create.append({
                    "content_type": "properties",
                    "content": props_content,
                    "embedding": props_embedding
                })

        # 3. Applications Embedding
        apps_content = build_applications_content(fiber)
        if apps_content and len(apps_content) > 30:
            print(f"  → Applications: {apps_content[:100]}...")
            apps_embedding = generate_embedding(client, apps_content)
            if apps_embedding:
                embeddings_to_create.append({
                    "content_type": "applications",
                    "content": apps_content,
                    "embedding": apps_embedding
                })

        # 4. Composition Embedding
        comp_content = build_composition_content(fiber)
        if comp_content and len(comp_content) > 30:
            print(f"  → Composition: {comp_content[:100]}...")
            comp_embedding = generate_embedding(client, comp_content)
            if comp_embedding:
                embeddings_to_create.append({
                    "content_type": "composition",
                    "content": comp_content,
                    "embedding": comp_embedding
                })

        # 5. Complete Embedding (most comprehensive)
        complete_content = build_complete_content(fiber)
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
                select(FiberEmbedding).where(
                    FiberEmbedding.fiber_id == fiber.id,
                    FiberEmbedding.content_type == emb_data["content_type"]
                )
            ).scalar_one_or_none()

            if existing and not regenerate:
                print(f"  ⚠ Skipping {emb_data['content_type']} (already exists)")
                continue

            embedding_record = FiberEmbedding(
                fiber_id=fiber.id,
                content_type=emb_data["content_type"],
                content_text=emb_data["content"],
                embedding=emb_data["embedding"],
                embedding_model="text-embedding-3-small"
            )
            db.add(embedding_record)
            total_embeddings += 1

        db.commit()
        print(f"  ✓ Created {len(embeddings_to_create)} embedding(s) for {fiber.name}\n")

        # Rate limiting - avoid hitting OpenAI API limits
        time.sleep(0.1)

    print(f"\n{'='*60}")
    print(f"✓ Successfully created {total_embeddings} embeddings for {len(fibers)} fiber(s)")
    print(f"{'='*60}\n")


def main():
    """Main execution function."""
    import argparse

    parser = argparse.ArgumentParser(description="Generate fiber embeddings")
    parser.add_argument(
        "--regenerate",
        action="store_true",
        help="Delete and regenerate all embeddings"
    )
    parser.add_argument(
        "--fiber-id",
        type=int,
        help="Generate embeddings for specific fiber ID only"
    )

    args = parser.parse_args()

    # Check OpenAI API key
    if not hasattr(settings, 'OPENAI_API_KEY') or not settings.OPENAI_API_KEY:
        print("Error: OPENAI_API_KEY not found in settings")
        print("Please set OPENAI_API_KEY in your .env file")
        return

    print("\n" + "="*60)
    print("Fiber Embeddings Generator")
    print("="*60 + "\n")

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    db = SessionLocal()

    try:
        generate_fiber_embeddings(
            db=db,
            client=client,
            regenerate=args.regenerate,
            fiber_id=args.fiber_id
        )
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()
