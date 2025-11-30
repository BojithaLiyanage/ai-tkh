import axios from 'axios';

// Create an API instance with cookie-based auth (similar to your main API service)
const createAuthenticatedApi = () => {
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    withCredentials: true,  // Enable sending cookies with requests
  });

  // No need to manually set Authorization header - cookies are sent automatically
  return api;
};

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  asset_id: string;
  version: number;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
}

export interface CloudinaryDeleteResponse {
  result: string;
  partial: boolean;
}

class CloudinaryService {
  private cloudName: string;
  private folder: string;
  private uploadPreset: string;

  constructor() {
    this.cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
    this.folder = import.meta.env.VITE_CLOUDINARY_FOLDER || 'fibers';
    this.uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

    if (!this.cloudName) {
      console.warn('Cloudinary cloud name not configured');
    }
    if (!this.uploadPreset) {
      console.warn('Cloudinary upload preset not configured');
    }
  }

  async uploadImage(file: File, customFileName?: string, folder?: string): Promise<CloudinaryUploadResponse> {
    try {
      console.log('Starting image upload...', { fileName: file.name, customFileName, folder, fileSize: file.size, fileType: file.type });

      // Validate file first
      this.isValidImageFile(file);
      console.log('File validation passed');

      // Upload through backend API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder || this.folder);

      // Add custom filename if provided (e.g., fiber_id)
      if (customFileName) {
        formData.append('public_id', customFileName);
        console.log('Using custom filename:', customFileName);
      }

      const api = createAuthenticatedApi();

      console.log('Uploading to backend API at /api/upload/image...');
      const response = await api.post(
        '/api/upload/image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Backend upload successful:', response.data);
      return response.data;

    } catch (error) {
      console.error('Cloudinary upload error:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to upload image';
        console.error('Backend error details:', error.response?.data);
        throw new Error(errorMessage);
      }
      throw new Error('Failed to upload image');
    }
  }

  async deleteImage(publicId: string): Promise<CloudinaryDeleteResponse> {
    try {
      console.log('Deleting image from Cloudinary...', { publicId });

      const api = createAuthenticatedApi();

      const response = await api.delete('/api/cloudinary/delete', {
        data: { public_id: publicId }
      });

      console.log('Image deletion successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to delete image';
        throw new Error(errorMessage);
      }
      throw new Error('Failed to delete image');
    }
  }

  generateImageUrl(publicId: string, transformations?: string): string {
    if (!this.cloudName || !publicId) {
      return '';
    }

    const baseUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload`;
    const transformationString = transformations || 'q_auto,f_auto';

    return `${baseUrl}/${transformationString}/${publicId}`;
  }

  generateThumbnailUrl(publicId: string): string {
    return this.generateImageUrl(publicId, 'w_200,h_200,c_fill,q_auto,f_auto');
  }


  isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
    }

    if (file.size > maxSize) {
      throw new Error('File size too large. Please upload an image smaller than 10MB.');
    }

    return true;
  }
}

export const cloudinaryService = new CloudinaryService();