import axios from 'axios';

// Create an API instance with auth interceptors (similar to your main API service)
const createAuthenticatedApi = () => {
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

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

  async uploadImage(file: File): Promise<CloudinaryUploadResponse> {
    try {
      // Validate file first
      this.isValidImageFile(file);

      // Upload through backend API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', this.folder);

      const api = createAuthenticatedApi();

      console.log('Uploading via backend API...');
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

  async deleteImage(_publicId: string): Promise<CloudinaryDeleteResponse> {
    // This would typically go through your backend API for security
    // For now, we'll just return a mock response since deletion should be handled server-side
    throw new Error('Image deletion should be handled through the backend API');
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