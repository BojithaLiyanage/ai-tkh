"""
Import fiber data from Excel file (fibersNew.xlsx) into the database.

Excel Column Mapping:
- physical.staple_length(mm) → staple_length_min_mm, staple_length_max_mm
- physical.tenacity_(cN/tex) → tenacity_min_cn_tex, tenacity_max_cn_tex
- physical.elongation_percent(%) → elongation_min_percent, elongation_max_percent
- physical.moisture_regain(%) std.conditons → moisture_regain_min_percent, moisture_regain_max_percent
- Elastic modulus_(GPa) → elastic_modulus_min_gpa, elastic_modulus_max_gpa
- physical.density_g_cm3 → density_g_cm3_min, density_g_cm3_max
"""

import pandas as pd
import os
import sys
from pathlib import Path
from decimal import Decimal
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.session import SessionLocal
from app.models.models import Fiber, FiberClass, FiberSubtype, SyntheticType, PolymerizationType
from sqlalchemy import select


def parse_range_value(value):
    """
    Parse a range value that might be in formats like:
    - "1.2"
    - "1.2-1.5"
    - "1.2 - 1.5"

    Returns: (min_value, max_value) or (value, value) if single value
    """
    if pd.isna(value) or value == '':
        return None, None

    value_str = str(value).strip()

    # Handle range formats
    if '-' in value_str:
        parts = [p.strip() for p in value_str.split('-')]
        try:
            min_val = Decimal(parts[0]) if parts[0] else None
            max_val = Decimal(parts[1]) if len(parts) > 1 and parts[1] else None
            return min_val, max_val
        except:
            return None, None

    # Handle single value
    try:
        val = Decimal(value_str)
        return val, val
    except:
        return None, None


def get_or_create_class(db, class_name):
    """Get or create a fiber class"""
    if pd.isna(class_name) or class_name == '':
        return None

    class_name = str(class_name).strip()
    stmt = select(FiberClass).where(FiberClass.name == class_name)
    fiber_class = db.execute(stmt).scalar_one_or_none()

    if not fiber_class:
        fiber_class = FiberClass(name=class_name, description=f"Fiber class: {class_name}")
        db.add(fiber_class)
        db.flush()

    return fiber_class.id


def get_or_create_subtype(db, class_id, subtype_name):
    """Get or create a fiber subtype"""
    if pd.isna(subtype_name) or subtype_name == '' or not class_id:
        return None

    subtype_name = str(subtype_name).strip()
    stmt = select(FiberSubtype).where(
        (FiberSubtype.class_id == class_id) & (FiberSubtype.name == subtype_name)
    )
    subtype = db.execute(stmt).scalar_one_or_none()

    if not subtype:
        subtype = FiberSubtype(class_id=class_id, name=subtype_name)
        db.add(subtype)
        db.flush()

    return subtype.id


def get_or_create_synthetic_type(db, synthetic_type_name):
    """Get or create a synthetic type"""
    if pd.isna(synthetic_type_name) or synthetic_type_name == '':
        return None

    synthetic_type_name = str(synthetic_type_name).strip()
    stmt = select(SyntheticType).where(SyntheticType.name == synthetic_type_name)
    synthetic_type = db.execute(stmt).scalar_one_or_none()

    if not synthetic_type:
        synthetic_type = SyntheticType(name=synthetic_type_name)
        db.add(synthetic_type)
        db.flush()

    return synthetic_type.id


def get_or_create_polymerization_type(db, poly_type_name):
    """Get or create a polymerization type"""
    if pd.isna(poly_type_name) or poly_type_name == '':
        return None

    poly_type_name = str(poly_type_name).strip()
    stmt = select(PolymerizationType).where(PolymerizationType.name == poly_type_name)
    poly_type = db.execute(stmt).scalar_one_or_none()

    if not poly_type:
        poly_type = PolymerizationType(name=poly_type_name)
        db.add(poly_type)
        db.flush()

    return poly_type.id


def parse_array_field(value):
    """Parse array fields from Excel (comma or semicolon separated)"""
    if pd.isna(value) or value == '':
        return None

    value_str = str(value).strip()
    if not value_str:
        return None

    # Split by comma or semicolon and strip whitespace
    items = [item.strip() for item in value_str.replace(';', ',').split(',') if item.strip()]
    return items if items else None


def import_fibers_from_excel(excel_path):
    """Import fiber data from Excel file"""

    if not os.path.exists(excel_path):
        print(f"Error: File not found: {excel_path}")
        return

    print(f"Loading Excel file: {excel_path}")
    df = pd.read_excel(excel_path, sheet_name='Fibres')
    print(f"Loaded {len(df)} rows from Excel")

    db = SessionLocal()

    try:
        imported_count = 0
        updated_count = 0
        error_count = 0

        for idx, row in df.iterrows():
            try:
                fiber_id = str(row.get('_id', f'F{idx:04d}')).strip()
                fiber_name = str(row.get('name', '')).strip()

                if not fiber_name:
                    print(f"Row {idx + 2}: Skipping - no fiber name")
                    continue

                print(f"\nProcessing row {idx + 2}: {fiber_name} ({fiber_id})")

                # Check if fiber already exists
                stmt = select(Fiber).where(Fiber.fiber_id == fiber_id)
                fiber = db.execute(stmt).scalar_one_or_none()

                is_new = fiber is None

                if not fiber:
                    fiber = Fiber(fiber_id=fiber_id, name=fiber_name)
                else:
                    print(f"  → Updating existing fiber: {fiber_name}")

                # Set classification fields
                class_id = get_or_create_class(db, row.get('class'))
                fiber.class_id = class_id

                if class_id:
                    subtype_id = get_or_create_subtype(db, class_id, row.get('subtype'))
                    fiber.subtype_id = subtype_id

                fiber.synthetic_type_id = get_or_create_synthetic_type(db, row.get('Synthetic type'))
                fiber.polymerization_type_id = get_or_create_polymerization_type(db, row.get('Polymerization type'))

                # Set array fields
                fiber.trade_names = parse_array_field(row.get('Trade names'))
                fiber.sources = parse_array_field(row.get('sources'))
                fiber.applications = parse_array_field(row.get('applications'))
                fiber.manufacturing_process = parse_array_field(row.get('manufacturing process'))
                fiber.spinning_method = parse_array_field(row.get('spinning method'))
                fiber.post_treatments = parse_array_field(row.get('manufacturing.post_treatments'))
                fiber.functional_groups = parse_array_field(row.get('chemical.functional_groups'))
                fiber.dye_affinity = parse_array_field(row.get('chemical.dye_affinity'))

                # Set physical properties - RANGE FIELDS
                # Density (now has min/max)
                density_val = row.get('physical.density_g_cm3')
                density_min, density_max = parse_range_value(density_val)
                fiber.density_g_cm3_min = density_min
                fiber.density_g_cm3_max = density_max

                # Fineness (already has min/max)
                fineness_val = row.get('physical.fineness/diameter_um')
                fineness_min, fineness_max = parse_range_value(fineness_val)
                fiber.fineness_min_um = fineness_min
                fiber.fineness_max_um = fineness_max

                # Staple length (now min/max in Excel, maps to staple_length)
                staple_val = row.get('physical.staple_length(mm)')
                staple_min, staple_max = parse_range_value(staple_val)
                fiber.staple_length_min_mm = staple_min
                fiber.staple_length_max_mm = staple_max

                # Tenacity (now min/max in Excel)
                tenacity_val = row.get('physical.tenacity_(cN/tex)')
                tenacity_min, tenacity_max = parse_range_value(tenacity_val)
                fiber.tenacity_min_cn_tex = tenacity_min
                fiber.tenacity_max_cn_tex = tenacity_max

                # Elongation (now min/max in Excel)
                elongation_val = row.get('physical.elongation_percent(%)')
                elongation_min, elongation_max = parse_range_value(elongation_val)
                fiber.elongation_min_percent = elongation_min
                fiber.elongation_max_percent = elongation_max

                # Moisture Regain (now min/max - NEW)
                moisture_col = 'physical.moisture_regain(%)\nstd.conditons'
                moisture_val = row.get(moisture_col)
                moisture_min, moisture_max = parse_range_value(moisture_val)
                fiber.moisture_regain_min_percent = moisture_min
                fiber.moisture_regain_max_percent = moisture_max

                # Absorption Capacity (now min/max - NEW)
                absorption_val = row.get('Absorption capcity (% of weight)')
                absorption_min, absorption_max = parse_range_value(absorption_val)
                fiber.absorption_capacity_min_percent = absorption_min
                fiber.absorption_capacity_max_percent = absorption_max

                # Elastic Modulus (already has min/max)
                elastic_val = row.get('Elastic modulus_(GPa)')
                elastic_min, elastic_max = parse_range_value(elastic_val)
                fiber.elastic_modulus_min_gpa = elastic_min
                fiber.elastic_modulus_max_gpa = elastic_max

                # Set chemical properties
                fiber.polymer_composition = row.get('chemical.polymer')
                fiber.degree_of_polymerization = row.get('Degree of Polymerization')
                fiber.acid_resistance = row.get('chemical.acid_resistance')
                fiber.alkali_resistance = row.get('chemical.alkali_resistance')
                fiber.microbial_resistance = row.get('microbial resistance')

                # Set thermal properties
                fiber.thermal_properties = row.get('Thermal properties_°C')

                # Set structure
                fiber.repeating_unit = row.get('Structure (repeating unit)')

                # Set identification and testing methods
                fiber.identification_methods = row.get('Fibre identification')
                fiber.property_analysis_methods = row.get('Property analysis')

                # Set sustainability
                fiber.sustainability_notes = row.get('sustainability.notes')

                # Set active and metadata
                fiber.is_active = True
                fiber.data_source = "Excel Import"
                fiber.data_quality_score = 5

                if is_new:
                    db.add(fiber)
                    imported_count += 1
                    print(f"  ✓ Created new fiber")
                else:
                    updated_count += 1
                    print(f"  ✓ Updated fiber")

            except Exception as e:
                error_count += 1
                print(f"  ✗ Error processing row {idx + 2}: {str(e)}")
                import traceback
                traceback.print_exc()

        # Commit all changes
        db.commit()
        print(f"\n{'='*50}")
        print(f"Import Complete:")
        print(f"  Imported: {imported_count}")
        print(f"  Updated: {updated_count}")
        print(f"  Errors: {error_count}")
        print(f"  Total: {imported_count + updated_count + error_count}")
        print(f"{'='*50}")

    except Exception as e:
        db.rollback()
        print(f"Error during import: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    excel_path = "/Users/bojitha/Desktop/fibersNew.xlsx"

    if len(sys.argv) > 1:
        excel_path = sys.argv[1]

    import_fibers_from_excel(excel_path)
