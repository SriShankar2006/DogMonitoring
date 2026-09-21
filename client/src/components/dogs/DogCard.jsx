import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Card, CardActionArea, CardMedia, CardContent, Box, Typography, Chip, Stack, IconButton, Tooltip } from '@mui/material';
import PetsRounded from '@mui/icons-material/PetsRounded';
import PlaceRounded from '@mui/icons-material/PlaceRounded';
import RepeatRounded from '@mui/icons-material/RepeatRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import AccountCircleRounded from '@mui/icons-material/AccountCircleRounded';
import { formatRelative } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import { dogService } from '../../services/dogService';
import ConfirmDialog from '../common/ConfirmDialog';

export default function DogCard({ dog, onDeleted }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isRepeat = (dog.totalSightings || 0) > 1;
  const isOwner = Boolean(currentUser?.uid) && dog.uploadedBy === currentUser.uid;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await dogService.deleteDog(dog.dogId);
      setConfirmOpen(false);
      onDeleted?.(dog.dogId);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete this dog.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardActionArea
        onClick={() => navigate(`/dogs/${dog.dogId}`)}
        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <Box sx={{ position: 'relative' }}>
          {dog.imageUrl ? (
            <CardMedia component="img" image={dog.imageUrl} alt={dog.dogId} sx={{ height: 180, objectFit: 'cover' }} />
          ) : (
            <Box
              sx={{
                height: 180,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'action.hover'
              }}
            >
              <PetsRounded sx={{ fontSize: 48, color: 'text.disabled' }} />
            </Box>
          )}
          <Chip
            icon={isRepeat ? <RepeatRounded /> : <PetsRounded />}
            label={isRepeat ? 'Repeat' : 'New'}
            size="small"
            color={isRepeat ? 'secondary' : 'success'}
            sx={{ position: 'absolute', top: 10, right: 10, fontWeight: 700 }}
          />
          {isOwner && (
            <Tooltip title="Uploaded by you">
              <Chip
                icon={<AccountCircleRounded />}
                label="Your upload"
                size="small"
                color="primary"
                sx={{ position: 'absolute', top: 10, left: 10, fontWeight: 700 }}
              />
            </Tooltip>
          )}
        </Box>
        <CardContent sx={{ flexGrow: 1, width: '100%' }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            {dog.dogId}
          </Typography>
          <Stack spacing={0.5}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <PlaceRounded fontSize="small" />
              <Typography variant="body2" noWrap>
                {dog.latestAddress || 'Unknown location'}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Last seen {formatRelative(dog.latestDetected)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {dog.totalSightings || 1} total sighting{(dog.totalSightings || 1) > 1 ? 's' : ''}
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>

      {isOwner && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1, pb: 1 }}>
          <Tooltip title="Delete this dog">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmOpen(true);
              }}
            >
              <DeleteRounded fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this dog?"
        message={`This will permanently remove ${dog.dogId} and all of its sighting history. This can't be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onClose={() => (!deleting ? setConfirmOpen(false) : null)}
      />
    </Card>
  );
}

DogCard.propTypes = {
  dog: PropTypes.shape({
    dogId: PropTypes.string.isRequired,
    imageUrl: PropTypes.string,
    latestAddress: PropTypes.string,
    latestDetected: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object]),
    totalSightings: PropTypes.number,
    uploadedBy: PropTypes.string
  }).isRequired,
  onDeleted: PropTypes.func
};
