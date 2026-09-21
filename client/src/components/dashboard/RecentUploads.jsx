import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Typography,
  Box
} from '@mui/material';
import PetsIcon from '@mui/icons-material/PetsRounded';
import { useNavigate } from 'react-router-dom';
import { formatRelative } from '../../utils/format';

export default function RecentUploads({ uploads = [] }) {
  const navigate = useNavigate();

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title="Recent Uploads" titleTypographyProps={{ fontWeight: 700 }} />
      <CardContent sx={{ pt: 0 }}>
        {uploads.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            No sightings uploaded yet.
          </Typography>
        ) : (
          <List disablePadding>
            {uploads.map((sighting, idx) => (
              <ListItem
                key={sighting.sightingId || `${sighting.dogId || 'sighting'}-${idx}`}
                sx={{ px: 0, cursor: 'pointer', borderRadius: 2 }}
                onClick={() => navigate(`/dogs/${sighting.dogId}`)}
              >
                <ListItemAvatar>
                  <Avatar
                    src={sighting.imageUrl}
                    variant="rounded"
                    sx={{ width: 48, height: 48 }}
                  >
                    <PetsIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {sighting.dogId}
                      </Typography>
                      {sighting.isNewDog && (
                        <Chip label="New" size="small" color="success" sx={{ height: 20 }} />
                      )}
                    </Box>
                  }
                  secondary={`${sighting.address || 'Unknown location'} · ${formatRelative(
                    sighting.date
                  )}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
