import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, Button, IconButton } from '@mui/material';
import CloudUploadRounded from '@mui/icons-material/CloudUploadRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import ImageRounded from '@mui/icons-material/ImageRounded';
import { validateImageFile } from '../../utils/validators';

export default function DropzoneUpload({ onFileSelected, disabled }) {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      setError('');
      if (rejectedFiles?.length) {
        setError('Only JPG, JPEG, and PNG images under 10MB are allowed.');
        return;
      }
      const file = acceptedFiles[0];
      if (!file) return;
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setPreview(URL.createObjectURL(file));
      setFileName(file.name);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    multiple: false,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }
  });

  const clearFile = (e) => {
    e.stopPropagation();
    setPreview(null);
    setFileName('');
    onFileSelected(null);
  };

  return (
    <Box>
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          borderRadius: 4,
          p: { xs: 3, sm: 5 },
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s ease',
          position: 'relative',
          minHeight: 260,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <input {...getInputProps()} />

        {preview ? (
          <>
            <IconButton
              onClick={clearFile}
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'background.paper',
                boxShadow: 2,
                '&:hover': { bgcolor: 'background.paper' }
              }}
            >
              <CloseRounded fontSize="small" />
            </IconButton>
            <Box
              component="img"
              src={preview}
              alt="Preview"
              sx={{ maxHeight: 220, maxWidth: '100%', borderRadius: 3, objectFit: 'contain', boxShadow: 3 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }} noWrap>
              <ImageRounded fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
              {fileName}
            </Typography>
          </>
        ) : (
          <>
            <CloudUploadRounded sx={{ fontSize: 56, color: 'primary.main', mb: 1.5 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {isDragActive ? 'Drop the image here' : 'Drag & drop a dog photo'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              JPG, JPEG, or PNG · up to 10MB
            </Typography>
            <Button variant="outlined" component="span" disabled={disabled}>
              Browse Files
            </Button>
          </>
        )}
      </Box>

      {error && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
