"""
Import special fibers from Excel file to database.

This script reads the Special fibres.xlsx file and imports all special fiber data
into the database with JSON properties.

Usage:
    python -m scripts.import_special_fibers_from_excel /path/to/Special\ fibres.xlsx
"""

import sys
import logging
import openpyxl
from pathlib import Path
from typing import Dict, Any
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.models.models import SpecialFiber, Base
from app.core.config import settings

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SpecialFiberImporter:
    """Import special fibers from Excel file"""

    def __init__(self, db_session: Session):
        self.db = db_session
        self.imported_count = 0
        self.error_count = 0

    def clean_fiber_name(self, sheet_name: str) -> str:
        """
        Clean sheet name to create fiber name.

        Args:
            sheet_name: Original sheet name from Excel

        Returns:
            Cleaned fiber name
        """
        # Remove trailing spaces
        name = sheet_name.strip()
        # Replace underscores with spaces
        name = name.replace('_', ' ')
        # Convert to title case
        return name.title()


    def import_sheet(self, ws, sheet_name: str) -> bool:
        """
        Import a single sheet from Excel file.

        Args:
            ws: Worksheet object
            sheet_name: Name of the sheet

        Returns:
            True if import successful, False otherwise
        """
        try:
            # Parse properties from the sheet
            properties: Dict[str, Any] = {}
            property_count = 0

            for row_idx, row in enumerate(ws.iter_rows(values_only=True), 1):
                if row[0] and row[1]:  # Both columns have values
                    # Skip header row
                    if row_idx == 1 and row[0].lower() == 'property':
                        continue

                    prop_name = str(row[0]).strip()
                    prop_value = str(row[1]).strip() if row[1] else ""

                    properties[prop_name] = prop_value
                    property_count += 1

            if not properties:
                logger.warning(f"No properties found in sheet {sheet_name}")
                return False

            # Clean fiber name for display
            fiber_name = self.clean_fiber_name(sheet_name)

            # Create special fiber with JSON properties (standalone table)
            special_fiber = SpecialFiber(
                name=fiber_name,
                properties=properties
            )

            # Save to database
            self.db.add(special_fiber)
            self.db.commit()
            self.db.refresh(special_fiber)

            logger.info(f"✓ Imported {sheet_name}: {property_count} properties")
            self.imported_count += 1
            return True

        except Exception as e:
            logger.error(f"Error importing sheet {sheet_name}: {str(e)}")
            self.db.rollback()
            self.error_count += 1
            return False

    def import_from_excel(self, excel_file_path: str) -> None:
        """
        Import all sheets from Excel file.

        Args:
            excel_file_path: Path to the Excel file
        """
        try:
            # Load Excel file
            wb = openpyxl.load_workbook(excel_file_path, data_only=True)
            sheet_names = wb.sheetnames

            logger.info(f"Found {len(sheet_names)} sheets in Excel file")
            logger.info(f"Sheets: {', '.join(sheet_names)}")

            # Import each sheet
            for sheet_name in sheet_names:
                ws = wb[sheet_name]
                logger.info(f"\nProcessing sheet: {sheet_name}")
                self.import_sheet(ws, sheet_name)

            # Close workbook
            wb.close()

            # Print summary
            logger.info("\n" + "=" * 60)
            logger.info(f"IMPORT SUMMARY")
            logger.info("=" * 60)
            logger.info(f"Total sheets processed: {len(sheet_names)}")
            logger.info(f"Successfully imported: {self.imported_count}")
            logger.info(f"Errors: {self.error_count}")
            logger.info("=" * 60)

        except Exception as e:
            logger.error(f"Error opening Excel file: {str(e)}")
            raise


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage: python -m scripts.import_special_fibers_from_excel <path_to_excel_file>")
        print("\nExample:")
        print("  python -m scripts.import_special_fibers_from_excel '/Users/bojitha/Downloads/Special fibres.xlsx'")
        sys.exit(1)

    excel_file = sys.argv[1]

    # Check if file exists
    if not Path(excel_file).exists():
        logger.error(f"Excel file not found: {excel_file}")
        sys.exit(1)

    # Create database connection
    try:
        engine = create_engine(settings.DATABASE_URL)
        SessionLocal = sessionmaker(bind=engine)
        db = SessionLocal()

        # Run importer
        importer = SpecialFiberImporter(db)
        importer.import_from_excel(excel_file)

        db.close()

    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
