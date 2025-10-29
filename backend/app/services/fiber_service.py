"""
Fiber search and retrieval service for chatbot integration.
Provides semantic search, keyword search, and context building for RAG.
"""

from typing import List, Dict, Optional, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, or_, and_, func, text
from app.models.models import (
    Fiber, FiberClass, FiberSubtype, SyntheticType, PolymerizationType,
    FiberEmbedding, FiberProperty, FiberApplication
)
from openai import OpenAI
from app.core.config import settings


class FiberSearchService:
    """Service for searching and retrieving fiber information"""

    def __init__(self, db: Session):
        self.db = db
        self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY) if hasattr(settings, 'OPENAI_API_KEY') else None

    def normalize_query(self, query: str) -> List[str]:
        """
        Normalize search query to handle typos, different formats, and variations.
        Handles: case variations, hyphens/spaces/underscores, double letters, concatenated words.

        Args:
            query: Original search query

        Returns:
            List of normalized search patterns
        """
        import re

        # Convert to lowercase and normalize whitespace (handles double spaces)
        normalized = ' '.join(query.lower().strip().split())

        # Generate multiple search patterns
        patterns = []

        # Pattern 1: Original normalized (replace underscores and hyphens with spaces)
        pattern1 = normalized.replace('_', ' ').replace('-', ' ')
        pattern1 = ' '.join(pattern1.split())  # Normalize whitespace again
        patterns.append(pattern1)

        # Pattern 2: Replace spaces with hyphens
        if ' ' in pattern1:
            patterns.append(pattern1.replace(' ', '-'))

        # Pattern 3: Replace spaces with underscores
        if ' ' in pattern1:
            patterns.append(pattern1.replace(' ', '_'))

        # Pattern 4: Remove all separators (for matching "meltspinning")
        pattern_no_sep = pattern1.replace(' ', '')
        if pattern_no_sep != pattern1:
            patterns.append(pattern_no_sep)

        # Pattern 5: Handle common double/triple-letter typos
        # Use a dictionary of common fiber-related terms and their typo patterns
        typo_corrections = {
            'spiniinng': 'spinning',
            'spinnnning': 'spinning',
            'spining': 'spinning',
            'dyeinng': 'dyeing',
            'weaving': 'weaving',
            'kniting': 'knitting',
        }

        deduplicated_patterns = []
        for p in list(patterns):
            # Check for known typo patterns
            corrected = p
            for typo, correct in typo_corrections.items():
                if typo in corrected:
                    corrected = corrected.replace(typo, correct)

            if corrected != p and corrected not in patterns and corrected not in deduplicated_patterns:
                deduplicated_patterns.append(corrected)

            # Also apply general deduplication (3+ identical chars -> 2)
            reduced = re.sub(r'(.)\1{2,}', r'\1\1', p)
            if reduced != p and reduced not in patterns and reduced not in deduplicated_patterns:
                deduplicated_patterns.append(reduced)

            # Also try reducing to single character
            single = re.sub(r'(.)\1{2,}', r'\1', p)
            if single != p and single != reduced and single not in patterns and single not in deduplicated_patterns:
                deduplicated_patterns.append(single)
        patterns.extend(deduplicated_patterns)

        # Pattern 6: For concatenated words (e.g., "meltspinning"), try splitting variations
        # This helps match "meltspinning" to "melt spinning" or "melt-spinning"
        if len(pattern_no_sep) > 6 and ' ' not in pattern_no_sep:
            # Try common split points (every 3-6 characters)
            for i in range(3, min(8, len(pattern_no_sep) - 2)):
                split_pattern = pattern_no_sep[:i] + ' ' + pattern_no_sep[i:]
                if split_pattern not in patterns:
                    patterns.append(split_pattern)
                    patterns.append(split_pattern.replace(' ', '-'))

        # Remove duplicates while preserving order
        unique_patterns = []
        for p in patterns:
            if p and p not in unique_patterns:
                unique_patterns.append(p)

        return unique_patterns[:12]  # Limit to 12 most relevant patterns

    def keyword_search(
        self,
        query: str,
        limit: int = 5,
        include_inactive: bool = False
    ) -> List[Fiber]:
        """
        Search fibers by keyword in name, trade_names, applications, and sources.
        Handles typos, different formats (hyphen/space/underscore), and case variations.

        Args:
            query: Search term
            limit: Maximum results to return
            include_inactive: Whether to include inactive fibers

        Returns:
            List of matching Fiber objects
        """
        try:
            # Get normalized search patterns
            normalized_patterns = self.normalize_query(query)
            search_terms = [f"%{pattern}%" for pattern in normalized_patterns]

            print(f"[KEYWORD SEARCH] Searching for: '{query}'")
            print(f"[KEYWORD SEARCH] Normalized patterns: {normalized_patterns}")

            # First, check total fiber count
            total_count = self.db.query(Fiber).filter(Fiber.is_active == True).count()
            print(f"[KEYWORD SEARCH] Total active fibers in database: {total_count}")

            # Build base query with relationships
            stmt = select(Fiber).options(
                joinedload(Fiber.fiber_class),
                joinedload(Fiber.subtype),
                joinedload(Fiber.synthetic_type),
                joinedload(Fiber.polymerization_type)
            )

            # Helper function to create search conditions for all patterns
            def search_conditions(field_expr, is_array=False):
                conditions = []
                for search_term in search_terms:
                    if is_array:
                        field_str = func.coalesce(func.array_to_string(field_expr, ' '), '')
                        conditions.append(field_str.ilike(search_term))
                    else:
                        field_lower = func.lower(field_expr)
                        conditions.append(field_lower.like(search_term))
                return or_(*conditions)

            # Add search filters - search across ALL relevant text and array fields
            stmt = stmt.where(
                or_(
                    # Text fields
                    search_conditions(Fiber.name),
                    search_conditions(Fiber.polymer_composition),
                    search_conditions(Fiber.identification_methods),
                    search_conditions(Fiber.sustainability_notes),
                    search_conditions(Fiber.thermal_properties),
                    search_conditions(Fiber.repeating_unit),
                    search_conditions(Fiber.degree_of_polymerization),
                    search_conditions(Fiber.acid_resistance),
                    search_conditions(Fiber.alkali_resistance),
                    search_conditions(Fiber.microbial_resistance),
                    # Array fields - handle NULL arrays
                    search_conditions(Fiber.trade_names, is_array=True),
                    search_conditions(Fiber.applications, is_array=True),
                    search_conditions(Fiber.sources, is_array=True),
                    search_conditions(Fiber.manufacturing_process, is_array=True),
                    search_conditions(Fiber.spinning_method, is_array=True),
                    search_conditions(Fiber.post_treatments, is_array=True),
                    search_conditions(Fiber.functional_groups, is_array=True),
                    search_conditions(Fiber.dye_affinity, is_array=True)
                )
            )

            # Filter active fibers unless specified
            if not include_inactive:
                stmt = stmt.where(Fiber.is_active == True)

            stmt = stmt.limit(limit)

            results = self.db.execute(stmt).scalars().all()
            print(f"[KEYWORD SEARCH] Found {len(results)} matching fiber(s)")

            # Print sample of what we searched
            if len(results) == 0:
                # Show a few fiber names from database to help debug
                sample_fibers = self.db.query(Fiber.name).filter(Fiber.is_active == True).limit(5).all()
                if sample_fibers:
                    print(f"[KEYWORD SEARCH] Sample fiber names in database: {[f.name for f in sample_fibers]}")
                else:
                    print(f"[KEYWORD SEARCH] Database appears to be empty!")

            return list(results)
        except Exception as e:
            print(f"[KEYWORD SEARCH] Error: {e}")
            import traceback
            traceback.print_exc()
            return []

    def semantic_search(
        self,
        query: str,
        limit: int = 5,
        similarity_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Perform semantic search using vector embeddings.

        Args:
            query: Natural language query
            limit: Maximum results to return
            similarity_threshold: Minimum similarity score (0-1)

        Returns:
            List of dicts with fiber info and similarity scores
        """
        if not self.openai_client:
            # Fallback to keyword search if OpenAI not configured
            print("[SEMANTIC SEARCH] OpenAI client not configured, falling back to keyword search")
            fibers = self.keyword_search(query, limit)
            return [{"fiber": fiber, "similarity": 1.0, "content_type": "keyword_match"} for fiber in fibers]

        try:
            print(f"[SEMANTIC SEARCH] Starting semantic search for: '{query}'")

            # Check if embeddings table exists and has data
            check_query = text("SELECT COUNT(*) FROM fiber_embeddings LIMIT 1")
            try:
                result = self.db.execute(check_query)
                count = result.scalar()
                print(f"[SEMANTIC SEARCH] Embeddings table exists, checking count...")

                # Check actual count
                count_query = text("SELECT COUNT(*) FROM fiber_embeddings")
                total_embeddings = self.db.execute(count_query).scalar()
                print(f"[SEMANTIC SEARCH] Total embeddings in database: {total_embeddings}")

                if total_embeddings == 0:
                    print("[SEMANTIC SEARCH] No embeddings found, falling back to keyword search")
                    fibers = self.keyword_search(query, limit)
                    return [{"fiber": fiber, "similarity": 0.8, "content_type": "keyword_fallback"} for fiber in fibers]

            except Exception as e:
                # Embeddings table doesn't exist or is empty, fallback to keyword search
                print(f"[SEMANTIC SEARCH] Embeddings table error: {e}")
                print("[SEMANTIC SEARCH] Falling back to keyword search")
                fibers = self.keyword_search(query, limit)
                return [{"fiber": fiber, "similarity": 0.8, "content_type": "keyword_fallback"} for fiber in fibers]

            # Generate embedding for the query
            print(f"[SEMANTIC SEARCH] Generating embedding for query...")
            response = self.openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=query
            )
            query_embedding = response.data[0].embedding
            print(f"[SEMANTIC SEARCH] Embedding generated (dimension: {len(query_embedding)})")

            # Convert embedding to PostgreSQL vector format
            embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"

            # Perform vector similarity search using pgvector
            # Search across ALL embedding types and get best match per fiber
            # Using cosine distance (1 - cosine_similarity)
            # Note: Using string formatting for vector literal as it can't be a parameter
            print(f"[SEMANTIC SEARCH] Searching with threshold: {similarity_threshold}, limit: {limit}")
            query_sql = f"""
                WITH ranked_embeddings AS (
                    SELECT
                        fe.fiber_id,
                        fe.content_type,
                        fe.content_text,
                        1 - (fe.embedding <=> '{embedding_str}'::vector) as similarity,
                        f.id,
                        f.fiber_id as fiber_code,
                        f.name,
                        f.applications,
                        ROW_NUMBER() OVER (PARTITION BY fe.fiber_id ORDER BY (fe.embedding <=> '{embedding_str}'::vector)) as rank
                    FROM fiber_embeddings fe
                    JOIN fibers f ON fe.fiber_id = f.id
                    WHERE f.is_active = true
                        AND 1 - (fe.embedding <=> '{embedding_str}'::vector) >= :threshold
                )
                SELECT
                    fiber_id,
                    content_type,
                    content_text,
                    similarity,
                    id,
                    fiber_code,
                    name,
                    applications
                FROM ranked_embeddings
                WHERE rank = 1
                ORDER BY similarity DESC
                LIMIT :limit
            """

            result = self.db.execute(
                text(query_sql),
                {
                    "threshold": similarity_threshold,
                    "limit": limit
                }
            )

            results = []
            seen_fibers = set()
            for row in result:
                # Fetch full fiber object (only once per fiber)
                if row.id not in seen_fibers:
                    fiber = self.db.get(Fiber, row.id)
                    if fiber:
                        results.append({
                            "fiber": fiber,
                            "similarity": float(row.similarity),
                            "content_type": row.content_type,
                            "matched_content": row.content_text
                        })
                        seen_fibers.add(row.id)
                        print(f"[SEMANTIC SEARCH]   - Found: {fiber.name} (similarity: {row.similarity:.3f}, type: {row.content_type})")

            print(f"[SEMANTIC SEARCH] Total unique fibers found: {len(results)}")
            return results

        except Exception as e:
            # Rollback the transaction on error to prevent transaction state issues
            self.db.rollback()
            print(f"Semantic search error: {e}")
            # Fallback to keyword search on error
            fibers = self.keyword_search(query, limit)
            return [{"fiber": fiber, "similarity": 0.8, "content_type": "keyword_fallback"} for fiber in fibers]

    def get_fiber_by_name(self, name: str) -> Optional[Fiber]:
        """Get a specific fiber by exact name match."""
        stmt = select(Fiber).where(
            func.lower(Fiber.name) == name.lower()
        ).options(
            joinedload(Fiber.fiber_class),
            joinedload(Fiber.subtype),
            joinedload(Fiber.synthetic_type),
            joinedload(Fiber.polymerization_type)
        )

        return self.db.execute(stmt).scalar_one_or_none()

    def get_fibers_by_class(self, class_name: str, limit: int = 10) -> List[Fiber]:
        """Get all fibers belonging to a specific class."""
        stmt = select(Fiber).join(FiberClass).where(
            func.lower(FiberClass.name) == class_name.lower(),
            Fiber.is_active == True
        ).options(
            joinedload(Fiber.fiber_class),
            joinedload(Fiber.subtype)
        ).limit(limit)

        return list(self.db.execute(stmt).scalars().all())

    def get_fibers_by_subtype(self, subtype_name: str, limit: int = 20) -> List[Fiber]:
        """Get all fibers belonging to a specific subtype."""
        stmt = select(Fiber).join(FiberSubtype).where(
            func.lower(FiberSubtype.name) == subtype_name.lower(),
            Fiber.is_active == True
        ).options(
            joinedload(Fiber.fiber_class),
            joinedload(Fiber.subtype)
        ).limit(limit)

        return list(self.db.execute(stmt).scalars().all())

    def get_fibers_by_synthetic_type(self, synthetic_type_name: str, limit: int = 20) -> List[Fiber]:
        """Get all fibers belonging to a specific synthetic type."""
        stmt = select(Fiber).join(SyntheticType).where(
            func.lower(SyntheticType.name) == synthetic_type_name.lower(),
            Fiber.is_active == True
        ).options(
            joinedload(Fiber.fiber_class),
            joinedload(Fiber.synthetic_type)
        ).limit(limit)

        return list(self.db.execute(stmt).scalars().all())

    def get_fibers_by_polymerization_type(self, polymerization_type_name: str, limit: int = 20) -> List[Fiber]:
        """Get all fibers belonging to a specific polymerization type."""
        stmt = select(Fiber).join(PolymerizationType).where(
            func.lower(PolymerizationType.name) == polymerization_type_name.lower(),
            Fiber.is_active == True
        ).options(
            joinedload(Fiber.fiber_class),
            joinedload(Fiber.polymerization_type)
        ).limit(limit)

        return list(self.db.execute(stmt).scalars().all())

    def search_fibers_by_category(self, query: str, limit: int = 20) -> Dict[str, Any]:
        """
        Generic method to search fibers by any category (class, subtype, synthetic type, polymerization type).
        Detects the category type and searches accordingly.

        Args:
            query: Search query (e.g., "natural fibers", "cellulosic fibers", "thermoplastic")
            limit: Maximum results to return

        Returns:
            Dict with 'fibers' list and 'category_type' string
        """
        query_lower = query.lower()

        # Define category keywords and their database lookup methods
        categories = {
            'class': {
                'keywords': ['natural', 'synthetic', 'animal', 'regenerated', 'mineral'],
                'table': FiberClass,
                'join_field': Fiber.fiber_class
            },
            'subtype': {
                'keywords': ['bast', 'leaf', 'seed', 'hair', 'secretion',
                           'protein', 'ester', 'cellulose_bast', 'cellulose_leaf', 'cellulose_seed',
                           'cellulose_ester', 'regenerated_protein', 'cellulose', 'cellulosic'],
                'table': FiberSubtype,
                'join_field': Fiber.subtype
            },
            'synthetic_type': {
                'keywords': ['thermoplastic', 'thermoset', 'melting', 'non melting'],
                'table': SyntheticType,
                'join_field': Fiber.synthetic_type
            },
            'polymerization_type': {
                'keywords': ['polymerization', 'polycondensation', 'polyaddition',
                           'chain-growth', 'step-growth', 'radical', 'ring-opening'],
                'table': PolymerizationType,
                'join_field': Fiber.polymerization_type
            }
        }

        # Try to detect which category is being queried
        for category_type, config in categories.items():
            for keyword in config['keywords']:
                if keyword in query_lower:
                    print(f"[CATEGORY SEARCH] Detected {category_type}: {keyword}")

                    # Search in the corresponding table
                    table = config['table']

                    # First, find matching categories in the lookup table
                    # Use flexible matching - handle variations like "cellulosic" -> "cellulose"
                    search_keyword = keyword.rstrip('ic')  # Remove common suffix variations
                    category_stmt = select(table).where(
                        or_(
                            func.lower(table.name).like(f"%{keyword}%"),
                            func.lower(table.name).like(f"%{search_keyword}%")
                        )
                    )
                    matching_categories = self.db.execute(category_stmt).scalars().all()

                    if not matching_categories:
                        print(f"[CATEGORY SEARCH] No matching {category_type} found for: {keyword}")
                        continue

                    print(f"[CATEGORY SEARCH] Found {len(matching_categories)} matching {category_type}(s)")

                    # Get all fibers for these categories
                    all_fibers = []
                    seen_ids = set()

                    for category in matching_categories:
                        # Build query to get fibers
                        if category_type == 'class':
                            fibers = self.get_fibers_by_class(category.name, limit=limit)
                        elif category_type == 'subtype':
                            fibers = self.get_fibers_by_subtype(category.name, limit=limit)
                        elif category_type == 'synthetic_type':
                            fibers = self.get_fibers_by_synthetic_type(category.name, limit=limit)
                        elif category_type == 'polymerization_type':
                            fibers = self.get_fibers_by_polymerization_type(category.name, limit=limit)
                        else:
                            continue

                        # Add fibers, avoiding duplicates
                        for fiber in fibers:
                            if fiber.id not in seen_ids:
                                all_fibers.append(fiber)
                                seen_ids.add(fiber.id)

                    if all_fibers:
                        print(f"[CATEGORY SEARCH] Total unique fibers found: {len(all_fibers)}")
                        return {
                            'fibers': all_fibers[:limit],
                            'category_type': category_type,
                            'category_name': keyword
                        }

        # If no category detected, return empty result
        print(f"[CATEGORY SEARCH] No category detected in query: {query}")
        return {
            'fibers': [],
            'category_type': None,
            'category_name': None
        }

    def get_fibers_by_application(self, application: str, limit: int = 10) -> List[Fiber]:
        """Get fibers suitable for a specific application."""
        search_term = f"%{application.lower()}%"

        stmt = select(Fiber).where(
            and_(
                func.array_to_string(Fiber.applications, ' ').ilike(search_term),
                Fiber.is_active == True
            )
        ).options(
            joinedload(Fiber.fiber_class),
            joinedload(Fiber.subtype)
        ).limit(limit)

        return list(self.db.execute(stmt).scalars().all())

    def build_fiber_context(self, fibers: List[Any]) -> str:
        """
        Build a formatted context string from fiber data for LLM prompts.

        Args:
            fibers: List of Fiber objects or dicts with 'fiber' key

        Returns:
            Formatted string with fiber information
        """
        if not fibers:
            return ""

        context_parts = ["Here is relevant information from the fiber database:\n"]

        for idx, item in enumerate(fibers, 1):
            # Handle both direct Fiber objects and search result dicts
            fiber = item if isinstance(item, Fiber) else item.get('fiber')
            if not fiber:
                continue

            similarity = item.get('similarity', 1.0) if isinstance(item, dict) else 1.0

            # Build fiber description
            fiber_info = [
                f"\n{idx}. **{fiber.name}** (ID: {fiber.fiber_id})"
            ]

            if hasattr(fiber, 'fiber_class') and fiber.fiber_class:
                fiber_info.append(f"   - Class: {fiber.fiber_class.name}")

            if hasattr(fiber, 'subtype') and fiber.subtype:
                fiber_info.append(f"   - Subtype: {fiber.subtype.name}")

            # Trade names - IMPORTANT for identification
            if fiber.trade_names and len(fiber.trade_names) > 0:
                trade_names = ", ".join(fiber.trade_names[:10])  # Show up to 10 trade names
                fiber_info.append(f"   - Trade Names: {trade_names}")

            if fiber.polymer_composition:
                fiber_info.append(f"   - Composition: {fiber.polymer_composition}")

            if fiber.repeating_unit:
                fiber_info.append(f"   - Repeating Unit: {fiber.repeating_unit}")

            if fiber.molecular_structure_smiles:
                fiber_info.append(f"   - Molecular Structure (SMILES): {fiber.molecular_structure_smiles}")

            if fiber.applications and len(fiber.applications) > 0:
                apps = ", ".join(fiber.applications[:5])  # Limit to first 5
                fiber_info.append(f"   - Applications: {apps}")

            if fiber.sources and len(fiber.sources) > 0:
                sources = ", ".join(fiber.sources[:3])
                fiber_info.append(f"   - Sources: {sources}")

            # Manufacturing and Processing
            if fiber.manufacturing_process and len(fiber.manufacturing_process) > 0:
                manufacturing = ", ".join(fiber.manufacturing_process[:5])
                fiber_info.append(f"   - Manufacturing Process: {manufacturing}")

            if fiber.spinning_method and len(fiber.spinning_method) > 0:
                spinning = ", ".join(fiber.spinning_method[:5])
                fiber_info.append(f"   - Spinning Method: {spinning}")

            if fiber.post_treatments and len(fiber.post_treatments) > 0:
                treatments = ", ".join(fiber.post_treatments[:5])
                fiber_info.append(f"   - Post Treatments: {treatments}")

            if fiber.dye_affinity and len(fiber.dye_affinity) > 0:
                dyes = ", ".join(fiber.dye_affinity[:5])
                fiber_info.append(f"   - Dye Affinity: {dyes}")

            # Physical properties
            properties = []
            if fiber.density_g_cm3:
                properties.append(f"Density: {fiber.density_g_cm3} g/cm³")
            if fiber.moisture_regain_percent:
                properties.append(f"Moisture Regain: {fiber.moisture_regain_percent}%")
            if fiber.absorption_capacity_percent:
                properties.append(f"Absorption Capacity: {fiber.absorption_capacity_percent}%")
            if fiber.tenacity_min_cn_tex and fiber.tenacity_max_cn_tex:
                properties.append(f"Tenacity: {fiber.tenacity_min_cn_tex}-{fiber.tenacity_max_cn_tex} cN/tex")
            if fiber.elongation_min_percent and fiber.elongation_max_percent:
                properties.append(f"Elongation: {fiber.elongation_min_percent}-{fiber.elongation_max_percent}%")
            if fiber.fineness_min_um and fiber.fineness_max_um:
                properties.append(f"Fineness: {fiber.fineness_min_um}-{fiber.fineness_max_um} μm")
            if fiber.staple_length_min_mm and fiber.staple_length_max_mm:
                properties.append(f"Staple Length: {fiber.staple_length_min_mm}-{fiber.staple_length_max_mm} mm")

            if properties:
                fiber_info.append(f"   - Properties: {', '.join(properties)}")

            # Chemical properties
            chemical = []
            if fiber.acid_resistance:
                chemical.append(f"Acid: {fiber.acid_resistance}")
            if fiber.alkali_resistance:
                chemical.append(f"Alkali: {fiber.alkali_resistance}")
            if fiber.microbial_resistance:
                chemical.append(f"Microbial: {fiber.microbial_resistance}")

            if chemical:
                fiber_info.append(f"   - Chemical Resistance: {', '.join(chemical)}")

            # Molecular/Chemical structure
            if fiber.degree_of_polymerization:
                fiber_info.append(f"   - Degree of Polymerization: {fiber.degree_of_polymerization}")

            if fiber.functional_groups and len(fiber.functional_groups) > 0:
                groups = ", ".join(fiber.functional_groups[:5])
                fiber_info.append(f"   - Functional Groups: {groups}")

            # Thermal properties
            thermal = []
            if fiber.melting_point_c:
                thermal.append(f"Melting Point: {fiber.melting_point_c}°C")
            if fiber.glass_transition_temp_c:
                thermal.append(f"Glass Transition: {fiber.glass_transition_temp_c}°C")
            if fiber.decomposition_temp_c:
                thermal.append(f"Decomposition: {fiber.decomposition_temp_c}°C")

            if thermal:
                fiber_info.append(f"   - Thermal: {', '.join(thermal)}")

            # Additional thermal properties description
            if fiber.thermal_properties:
                thermal_desc = fiber.thermal_properties[:200] + "..." if len(fiber.thermal_properties) > 200 else fiber.thermal_properties
                fiber_info.append(f"   - Thermal Properties: {thermal_desc}")

            # Additional technical information
            if fiber.identification_methods:
                methods = fiber.identification_methods[:150] + "..." if len(fiber.identification_methods) > 150 else fiber.identification_methods
                fiber_info.append(f"   - Identification Methods: {methods}")

            if fiber.property_analysis_methods:
                analysis = fiber.property_analysis_methods[:150] + "..." if len(fiber.property_analysis_methods) > 150 else fiber.property_analysis_methods
                fiber_info.append(f"   - Property Analysis Methods: {analysis}")

            # Structure images (for reference, URLs available)
            if fiber.structure_image_url:
                fiber_info.append(f"   - Structure Image Available: Yes (ID: {fiber.structure_image_cms_id or 'N/A'})")

            # Sustainability
            if fiber.biodegradability is not None:
                biodeg = "Yes" if fiber.biodegradability else "No"
                fiber_info.append(f"   - Biodegradable: {biodeg}")

            if fiber.environmental_impact_score is not None:
                fiber_info.append(f"   - Environmental Impact Score: {fiber.environmental_impact_score}/10")

            if fiber.sustainability_notes:
                # Truncate long notes
                notes = fiber.sustainability_notes[:200] + "..." if len(fiber.sustainability_notes) > 200 else fiber.sustainability_notes
                fiber_info.append(f"   - Sustainability Notes: {notes}")

            # Add similarity score if from semantic search
            if similarity < 1.0:
                fiber_info.append(f"   - Relevance Score: {similarity:.2f}")

            context_parts.append("\n".join(fiber_info))

        context_parts.append("\nUse this information to provide accurate, detailed answers about these fibers.")

        return "\n".join(context_parts)

    def detect_query_intent(self, query: str) -> Dict[str, Any]:
        """
        Analyze user query to detect what kind of fiber information they're looking for.

        Returns:
            Dict with intent type and extracted entities
        """
        query_lower = query.lower()

        intent = {
            "type": "general",
            "entities": {},
            "requires_search": False,
            "search_terms": []
        }

        # Detect specific fiber names (common fibers)
        common_fibers = [
            "cotton", "polyester", "nylon", "wool", "silk", "rayon", "acrylic",
            "linen", "hemp", "bamboo", "viscose", "spandex", "lycra", "modal",
            "tencel", "kevlar", "nomex", "teflon", "polypropylene", "jute",
            "aramid", "carbon", "glass", "elastane", "acetate", "lyocell"
        ]

        for fiber in common_fibers:
            if fiber in query_lower:
                intent["entities"]["fiber_name"] = fiber
                intent["search_terms"].append(fiber)
                intent["requires_search"] = True
                break

        # Detect property queries
        if any(word in query_lower for word in ["property", "properties", "characteristic", "specifications"]):
            intent["type"] = "property_inquiry"
            intent["requires_search"] = True

        # Detect manufacturing/processing queries
        if any(word in query_lower for word in ["spinning", "manufacturing", "production", "process", "made", "produce", "treatment", "dyeing", "dye"]):
            intent["type"] = "manufacturing_inquiry"
            intent["requires_search"] = True

        # Detect application queries
        if any(word in query_lower for word in ["use", "used for", "application", "suitable for", "best for", "find", "where"]):
            intent["type"] = "application_inquiry"
            intent["requires_search"] = True

        # Detect comparison queries
        if any(word in query_lower for word in ["compare", "difference between", "vs", "versus", "better than"]):
            intent["type"] = "comparison"
            intent["requires_search"] = True

        # Detect identification queries
        if any(word in query_lower for word in ["identify", "what is", "what are", "define", "explain", "tell me about"]):
            intent["type"] = "identification"
            intent["requires_search"] = True

        # Detect class/category queries
        if any(word in query_lower for word in ["natural", "synthetic", "cellulosic", "protein", "mineral", "fiber", "fibers"]):
            intent["type"] = "category_inquiry"
            intent["requires_search"] = True

        # Detect structure/image requests
        if any(word in query_lower for word in ["structure", "image", "diagram", "picture", "visual", "molecular structure", "chemical structure", "show me"]):
            intent["type"] = "structure_image_request"
            intent["requires_search"] = True
            intent["needs_images"] = True

        # Extract search terms - use fiber name if found, otherwise use the whole query
        if not intent["search_terms"]:
            intent["search_terms"] = [query]

        return intent


    def extract_structure_images(self, fibers: List[Any], requested_fiber_name: Optional[str] = None) -> List[dict]:
        """
        Extract structure images from fiber results.

        Args:
            fibers: List of Fiber objects or dicts with 'fiber' key
            requested_fiber_name: If provided, only return image for this specific fiber

        Returns:
            List of dicts with fiber name, image URL, and fiber ID
        """
        images = []
        for item in fibers:
            fiber = item if isinstance(item, Fiber) else item.get('fiber')
            if not fiber:
                continue

            # If a specific fiber was requested, only include that fiber's image
            if requested_fiber_name:
                if fiber.name.lower() != requested_fiber_name.lower():
                    continue

            if fiber.structure_image_url:
                images.append({
                    "fiber_name": fiber.name,
                    "image_url": fiber.structure_image_url,
                    "fiber_id": fiber.fiber_id,
                    "image_cms_id": fiber.structure_image_cms_id
                })

        return images


def get_fiber_service(db: Session) -> FiberSearchService:
    """Factory function to create FiberSearchService instance."""
    return FiberSearchService(db)
