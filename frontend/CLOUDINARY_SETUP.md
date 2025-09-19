# Cloudinary Setup Instructions

## Required Setup in Cloudinary Dashboard

To use the image upload functionality, you need to create an **unsigned upload preset** in your Cloudinary dashboard:

### Steps:

1. **Log in to Cloudinary Dashboard**
   - Go to [cloudinary.com](https://cloudinary.com)
   - Log in with your account credentials

2. **Navigate to Upload Settings**
   - Go to **Settings** > **Upload**
   - Scroll down to **Upload presets**

3. **Create New Upload Preset**
   - Click **Add upload preset**
   - Set the following configuration:

   **Preset name:** `ml_default` (or create a custom one and update the env variable)

   **Signing mode:** `Unsigned`

   **Folder:** `fibers` (or leave empty to use the folder specified in upload)

   **Resource type:** `Image`

   **Allowed formats:** `jpg,jpeg,png,gif,webp`

   **File size limit:** `10000000` (10MB)

   **Image transformations (optional):**
   - Max width: 2000px
   - Max height: 2000px
   - Quality: Auto
   - Format: Auto

4. **Advanced Settings (Optional)**
   - **Tags:** Add default tags like `fiber`, `structure`
   - **Context:** Add any metadata you want
   - **Notification URL:** If you want webhooks

5. **Save the Preset**
   - Click **Save**

## Environment Variables

Make sure the following environment variables are set:

### Frontend (.env)
```
REACT_APP_CLOUDINARY_CLOUD_NAME=ddhsizodk
REACT_APP_CLOUDINARY_API_KEY=476211735714153
REACT_APP_CLOUDINARY_API_SECRET=R4rvdpMHOhpDkSF4ButjBXpKJJw
REACT_APP_CLOUDINARY_FOLDER=fibers
```

### Backend (.env)
```
CLOUDINARY_CLOUD_NAME=ddhsizodk
CLOUDINARY_API_KEY=476211735714153
CLOUDINARY_API_SECRET=R4rvdpMHOhpDkSF4ButjBXpKJJw
```

## Features Implemented

### 1. **Image Upload Options**
- **File Upload**: Direct file selection and upload
- **Upload Widget**: Cloudinary's advanced upload widget with cropping and transformations
- **Manual URL Input**: Ability to manually enter image URLs

### 2. **Image Management**
- **Preview**: Live preview of uploaded/selected images
- **Delete**: Delete images from Cloudinary (requires CMS ID)
- **Error Handling**: Proper error messages for failed uploads/deletions

### 3. **Integration**
- **Edit Modal**: Full upload/delete functionality when editing existing fibers
- **Create Modal**: Same functionality when creating new fibers
- **Backend API**: Secure deletion endpoint for removing images from Cloudinary

## Usage

### Uploading Images
1. Click **"Upload File"** to select and upload a file directly
2. Or click **"Open Gallery"** to use Cloudinary's upload widget
3. Or manually enter the image URL in the text field

### Deleting Images
1. Only available when a CMS ID is present (uploaded through the system)
2. Click **"Delete Image"** button below the image preview
3. Image will be removed from both Cloudinary and the form

## Security Notes

- Upload preset is **unsigned** to allow frontend uploads
- Deletion requires authentication through the backend API
- File size and format restrictions are enforced
- Images are stored in the `fibers` folder for organization

## Troubleshooting

### Upload Errors
- Check that the upload preset `fiber_upload` exists and is unsigned
- Verify file size is under 10MB
- Ensure file is a valid image format

### Delete Errors
- Verify backend is running and accessible
- Check that user is authenticated
- Ensure CMS ID is valid

### Preview Errors
- Check that the image URL is accessible
- Verify the URL points to a valid image file