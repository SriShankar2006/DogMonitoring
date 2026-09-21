import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Stack,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';
import GpsFixedRounded from '@mui/icons-material/GpsFixedRounded';
import SmartToyRounded from '@mui/icons-material/SmartToyRounded';
import FingerprintRounded from '@mui/icons-material/FingerprintRounded';
import SaveRounded from '@mui/icons-material/SaveRounded';
import CloudUploadRounded from '@mui/icons-material/CloudUploadRounded';
import PetsRounded from '@mui/icons-material/PetsRounded';
import DropzoneUpload from '../components/upload/DropzoneUpload';
import UploadResultDialog from '../components/upload/UploadResultDialog';
import { uploadDogSighting } from '../services/uploadService';
import { detectDogInImage } from '../utils/dogDetector';

const STEPS = [
  { icon: <GpsFixedRounded color="primary" />, text: 'GPS location, address, date, time, and a UUID are captured automatically.' },
  { icon: <SmartToyRounded color="primary" />, text: 'Your browser checks the photo with an on-device model to confirm it contains a dog before anything is uploaded.' },
  { icon: <FingerprintRounded color="primary" />, text: 'Duplicate detection checks whether this is a known dog or a new one.' },
  { icon: <SaveRounded color="primary" />, text: 'The sighting is saved to the dashboard, map, and search instantly.' }
];

export default function Upload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detection, setDetection] = useState(null);
  const [detectionError, setDetectionError] = useState('');

  const resetState = () => {
    setFile(null);
    setResult(null);
    setError('');
    setProgress(0);
    setStage('');
    setDetection(null);
    setDetectionError('');
  };

  // Runs the bundled TFLite model on the photo the moment it's selected -
  // before anything is sent to the server - so a non-dog image can never
  // reach the upload endpoint in the first place, and the person sees the
  // real confidence score immediately instead of a canned number.
  const handleFileSelected = (selectedFile) => {
    setFile(selectedFile);
    setDetection(null);
    setDetectionError('');
    setError('');

    if (!selectedFile) return;

    setDetecting(true);
    detectDogInImage(selectedFile)
      .then((res) => setDetection(res))
      .catch((err) => setDetectionError(err.message || 'Could not analyze this image.'))
      .finally(() => setDetecting(false));
  };

  const handleUpload = async () => {
    if (!file || !detection?.isDog) return;
    setUploading(true);
    setError('');
    setResult(null);
    setStage('Getting your location...');
    setProgress(0);

    try {
      const res = await uploadDogSighting(
        file,
        (pct) => {
          setStage('Uploading image...');
          setProgress(pct);
        },
        detection.confidence
      );
      setResult(res);
      setDialogOpen(true);
    } catch (err) {
      if (err.status === 422 && err.data) {
        // AI API confirmed no dog was found in the image
        setResult(err.data);
      } else {
        setError(err.message || 'Upload failed. Please try again.');
      }
      setDialogOpen(true);
    } finally {
      setUploading(false);
      setStage('');
    }
  };

  const handleUploadAnother = () => {
    setDialogOpen(false);
    resetState();
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Card>
            <CardHeader title="Upload a Sighting" titleTypographyProps={{ fontWeight: 700 }} />
            <CardContent>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <DropzoneUpload onFileSelected={handleFileSelected} disabled={uploading} />

              {detecting && (
                <Box sx={{ mt: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    Checking for a dog...
                  </Typography>
                </Box>
              )}

              {!detecting && detectionError && (
                <Alert severity="warning" sx={{ mt: 2.5 }}>
                  {detectionError}
                </Alert>
              )}

              {!detecting && detection && (
                <Alert
                  severity={detection.isDog ? 'success' : 'error'}
                  icon={<PetsRounded fontSize="inherit" />}
                  sx={{ mt: 2.5 }}
                >
                  {detection.isDog
                    ? `Dog detected — ${detection.confidence}% confidence.`
                    : `No dog detected in this photo (${detection.confidence}% confidence). Please choose a different image.`}
                </Alert>
              )}

              {uploading && (
                <Box sx={{ mt: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {stage || 'Processing...'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {progress}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant={progress > 0 ? 'determinate' : 'indeterminate'}
                    value={progress}
                    sx={{ borderRadius: 2, height: 6 }}
                  />
                </Box>
              )}

              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<CloudUploadRounded />}
                disabled={!file || detecting || !detection?.isDog || uploading}
                onClick={handleUpload}
                sx={{ mt: 3 }}
              >
                {uploading ? 'Processing...' : 'Submit Sighting'}
              </Button>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, textAlign: 'center' }}>
                Your browser will ask for location permission to tag this sighting accurately.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card>
            <CardHeader title="How it works" titleTypographyProps={{ fontWeight: 700 }} />
            <CardContent sx={{ pt: 0 }}>
              <List disablePadding>
                {STEPS.map((step, idx) => (
                  <ListItem key={idx} sx={{ px: 0, alignItems: 'flex-start' }}>
                    <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>{step.icon}</ListItemIcon>
                    <ListItemText primary={step.text} />
                  </ListItem>
                ))}
              </List>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                <Chip label="JPG" size="small" variant="outlined" />
                <Chip label="JPEG" size="small" variant="outlined" />
                <Chip label="PNG" size="small" variant="outlined" />
                <Chip label="Max 10MB" size="small" variant="outlined" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <UploadResultDialog
        open={dialogOpen}
        result={result}
        error={error}
        onClose={() => setDialogOpen(false)}
        onUploadAnother={handleUploadAnother}
      />
    </Box>
  );
}
