import React, { useState, useRef, useEffect } from 'react';
import { cloudinaryService, type CloudinaryUploadResponse } from '../services/cloudinary';

interface ImageUploadComponentProps {
  value?: string | null; // Current image URL
  publicId?: string | null; // Current image public ID for Cloudinary
  onChange: (imageUrl: string | null, publicId: string | null) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  customFileName?: string; // Custom filename (e.g., fiber_id) to use when uploading
  folder?: string; // Custom folder to upload to (e.g., 'morphology')
}

const ImageUploadComponent: React.FC<ImageUploadComponentProps> = ({
  value,
  publicId,
  onChange,
  label = 'Image',
  disabled = false,
  className = '',
  customFileName,
  folder
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview URL when value prop changes
  useEffect(() => {
    setPreviewUrl(value || null);
  }, [value]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setUploading(true);

      // Validate file
      cloudinaryService.isValidImageFile(file);

      // Upload to Cloudinary with custom filename and folder if provided
      const response: CloudinaryUploadResponse = await cloudinaryService.uploadImage(file, customFileName, folder);

      // Update the form with the new image data
      setPreviewUrl(response.secure_url);
      onChange(response.secure_url, response.public_id);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onChange(null, null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Upload/Delete Controls */}
      {!previewUrl ? (
        // Show upload button when no image
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <div className="space-y-2">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-sm text-gray-600">Upload structure image</div>
            <button
              type="button"
              onClick={triggerFileSelect}
              disabled={disabled || uploading}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading...' : 'Choose File'}
            </button>
          </div>
        </div>
      ) : (
        // Show image preview with delete and replace options
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm font-medium text-gray-700">Structure Image</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={triggerFileSelect}
                disabled={disabled || uploading}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={disabled || uploading}
                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="relative">
            <img
              src={previewUrl}
              alt="Structure preview"
              className="max-w-full max-h-64 object-contain rounded border bg-white"
              onError={() => {
                setError('Failed to load image.');
                setPreviewUrl(null);
              }}
            />
          </div>

          {/* Image Info */}
          {publicId && (
            <div className="mt-2 text-xs text-gray-500">
              Cloudinary ID: {publicId}
            </div>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded p-2">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Uploading image to Cloudinary...
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadComponent;