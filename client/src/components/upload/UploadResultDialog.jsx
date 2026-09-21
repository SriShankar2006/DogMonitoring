import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Avatar,
  Typography,
  Chip,
  Button,
  Stack,
  Box,
  Tooltip,
  IconButton
} from '@mui/material';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import ErrorRounded from '@mui/icons-material/ErrorRounded';
import PetsRounded from '@mui/icons-material/PetsRounded';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import { useNavigate } from 'react-router-dom';

export default function UploadResultDialog({ open, result, error, onClose, onUploadAnother }) {
  const navigate = useNavigate();
  const success = Boolean(result?.isDog);
  const [copied, setCopied] = useState(false);

  const handleCopyId = async () => {
    const dogId = result?.dog?.dogId;
    if (!dogId) return;
    try {
      await navigator.clipboard.writeText(dogId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard permission denied - ignore, ID is still visible on screen */
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
        {error ? (
          <>
            <ErrorRounded sx={{ fontSize: 64, color: 'error.main', mb: 1 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Upload Failed
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {error}
            </Typography>
          </>
        ) : success ? (
          <>
            <Avatar
              src={result?.dog?.imageUrl}
              variant="rounded"
              sx={{ width: 96, height: 96, mx: 'auto', mb: 2, boxShadow: 3 }}
            >
              <PetsRounded />
            </Avatar>
            <CheckCircleRounded sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {result?.message}
            </Typography>

            <Box
              sx={{
                mt: 1,
                mb: 1.5,
                py: 1.5,
                px: 2,
                borderRadius: 3,
                bgcolor: 'action.hover',
                border: '1px dashed',
                borderColor: 'primary.main'
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Dog ID · save this to search for this dog later
              </Typography>
              <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                <Typography variant="h5" fontWeight={800} color="primary.main" sx={{ letterSpacing: 1 }}>
                  {result?.dog?.dogId}
                </Typography>
                <Tooltip title={copied ? 'Copied!' : 'Copy Dog ID'}>
                  <IconButton size="small" onClick={handleCopyId}>
                    <ContentCopyRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 1 }}>
              <Chip
                label={result?.isNewDog ? 'New Dog' : 'Repeat Sighting'}
                color={result?.isNewDog ? 'success' : 'secondary'}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Detection confidence: {result?.confidence ?? '—'}%
            </Typography>
          </>
        ) : (
          <>
            <ErrorRounded sx={{ fontSize: 64, color: 'warning.main', mb: 1 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>
              No Dog Detected
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The AI couldn&apos;t confirm a dog in this image
              {typeof result?.confidence === 'number' ? ` (confidence ${result.confidence}%)` : ''}. Please try
              another photo.
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center', gap: 1 }}>
        {success && !error && (
          <Button variant="contained" onClick={() => navigate(`/dogs/${result.dog.dogId}`)}>
            View Dog
          </Button>
        )}
        {success && !error && (
          <Button
            variant="text"
            onClick={() => navigate('/search', { state: { dogId: result.dog.dogId } })}
          >
            Search This ID
          </Button>
        )}
        <Button variant="outlined" onClick={onUploadAnother}>
          Upload Another
        </Button>
      </DialogActions>
    </Dialog>
  );
}
