import cloudinary
import cloudinary.uploader
import cloudinary.api
from typing import Dict, Any
import os
from fastapi import HTTPException

class CloudinaryService:
    def __init__(self):
        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "ddhsizodk"),
            api_key=os.getenv("CLOUDINARY_API_KEY", "476211735714153"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET", "R4rvdpMHOhpDkSF4ButjBXpKJJw"),
            secure=True
        )

    def delete_image(self, public_id: str) -> Dict[str, Any]:
        """
        Delete an image from Cloudinary
        """
        try:
            result = cloudinary.uploader.destroy(public_id)
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error deleting image: {str(e)}")


cloudinary_service = CloudinaryService()