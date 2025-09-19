import cloudinary
import cloudinary.uploader
import cloudinary.api
from typing import Dict, Any, Optional
import os
from fastapi import HTTPException, UploadFile
from app.core.config import settings

class CloudinaryService:
    def __init__(self):
        # Try to get from settings first, then fallback to os.getenv
        cloud_name = getattr(settings, 'CLOUDINARY_CLOUD_NAME', None) or os.getenv("CLOUDINARY_CLOUD_NAME")
        api_key = getattr(settings, 'CLOUDINARY_API_KEY', None) or os.getenv("CLOUDINARY_API_KEY")
        api_secret = getattr(settings, 'CLOUDINARY_API_SECRET', None) or os.getenv("CLOUDINARY_API_SECRET")

        if not all([cloud_name, api_key, api_secret]):
            raise ValueError("Cloudinary credentials not found in environment variables")

        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True
        )

    def upload_image(self, file: UploadFile, folder: str = "fibers", public_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Upload an image to Cloudinary
        """
        try:
            # Validate file type
            allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
            if file.content_type not in allowed_types:
                raise HTTPException(status_code=400, detail="Invalid file type. Only images are allowed.")

            # Upload configuration
            upload_options = {
                "folder": folder,
                "resource_type": "image",
                "overwrite": True,
                "use_filename": False,
                "unique_filename": True,
                "tags": ["fiber", "structure"]
            }

            # Add public_id if provided
            if public_id:
                upload_options["public_id"] = public_id
                upload_options["unique_filename"] = False

            # Upload to Cloudinary
            result = cloudinary.uploader.upload(file.file, **upload_options)

            return {
                "secure_url": result["secure_url"],
                "public_id": result["public_id"],
                "asset_id": result.get("asset_id"),
                "version": result.get("version"),
                "format": result.get("format"),
                "width": result.get("width"),
                "height": result.get("height"),
                "bytes": result.get("bytes"),
                "created_at": result.get("created_at")
            }

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error uploading image: {str(e)}")

    def delete_image(self, public_id: str) -> Dict[str, Any]:
        """
        Delete an image from Cloudinary
        """
        try:
            result = cloudinary.uploader.destroy(public_id)
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error deleting image: {str(e)}")


_cloudinary_service = None

def get_cloudinary_service() -> CloudinaryService:
    """Get the Cloudinary service instance (lazy initialization)"""
    global _cloudinary_service
    if _cloudinary_service is None:
        _cloudinary_service = CloudinaryService()
    return _cloudinary_service