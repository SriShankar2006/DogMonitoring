import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import CloudUploadRounded from '@mui/icons-material/CloudUploadRounded';
import CameraAltRounded from '@mui/icons-material/CameraAltRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import ImageRounded from '@mui/icons-material/ImageRounded';
import { validateImageFile } from '../../utils/validators';

export default function DropzoneUpload({ onFileSelected, disabled }) {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const processFile = useCallback((file) => {
    setError('');
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setPreview(URL.createObjectURL(file));
    setFileName(file.name || 'Camera photo');
    onFileSelected(file);
  }, [onFileSelected]);

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      setError('');
      if (rejectedFiles?.length) {
        setError('Only JPG, JPEG, and PNG images under 10MB are allowed.');
        return;
      }
      const file = acceptedFiles[0];
      if (!file) return;
      processFile(file);
    },
    [processFile]
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

  const handleCameraChange = (event) => {
    processFile(event.target.files?.[0]);
    event.target.value = '';
  };

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOpen]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const openCamera = async (event) => {
    event.stopPropagation();
    setError('');

    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      setCameraOpen(true);
    } catch {
      setError('Camera access was blocked. Please allow camera permission or use Browse Files.');
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      processFile(new File([blob], `dog-photo-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      closeCamera();
    }, 'image/jpeg', 0.92);
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
            <Button
              variant="text"
              startIcon={<CameraAltRounded />}
              disabled={disabled}
              onClick={(event) => {
                openCamera(event);
              }}
              sx={{ mt: 1 }}
            >
              Use Camera
            </Button>
          </>
        )}
      </Box>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        onChange={handleCameraChange}
        disabled={disabled}
        style={{ display: 'none' }}
      />

      <Dialog open={cameraOpen} onClose={closeCamera} maxWidth="sm" fullWidth>
        <DialogTitle>Take a dog photo</DialogTitle>
        <DialogContent>
          <Box
            component="video"
            ref={videoRef}
            autoPlay
            playsInline
            muted
            sx={{ display: 'block', width: '100%', maxHeight: '60vh', objectFit: 'contain', bgcolor: 'common.black', borderRadius: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCamera}>Cancel</Button>
          <Button variant="contained" startIcon={<CameraAltRounded />} onClick={takePhoto}>
            Take Photo
          </Button>
        </DialogActions>
      </Dialog>

      {error && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
