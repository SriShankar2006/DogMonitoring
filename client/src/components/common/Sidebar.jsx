import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  useTheme
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/DashboardRounded';
import MapIcon from '@mui/icons-material/MapRounded';
import WhatshotIcon from '@mui/icons-material/WhatshotRounded';
import UploadIcon from '@mui/icons-material/CloudUploadRounded';
import SearchIcon from '@mui/icons-material/SearchRounded';
import InsightsIcon from '@mui/icons-material/InsightsRounded';
import PetsIcon from '@mui/icons-material/PetsRounded';
import PersonIcon from '@mui/icons-material/PersonRounded';
import SettingsIcon from '@mui/icons-material/SettingsRounded';

export const DRAWER_WIDTH = 260;

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Map', icon: <MapIcon />, path: '/map' },
  { label: 'Heatmap', icon: <WhatshotIcon />, path: '/heatmap' },
  { label: 'Upload', icon: <UploadIcon />, path: '/upload' },
  { label: 'Search', icon: <SearchIcon />, path: '/search' },
  { label: 'Statistics', icon: <InsightsIcon />, path: '/statistics' }
];

const SECONDARY_ITEMS = [
  { label: 'Profile', icon: <PersonIcon />, path: '/profile' },
  { label: 'Settings', icon: <SettingsIcon />, path: '/settings' }
];

export default function Sidebar({ mobileOpen, onClose, variant }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ gap: 1.5, px: 3 }}>
        <PetsIcon color="primary" fontSize="large" />
        <Box>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.1}>
            Stray Dog AI
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Detection & Monitoring
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 2, py: 2, flexGrow: 1 }}>
        {NAV_ITEMS.map((item) => {
          const selected = location.pathname.startsWith(item.path);
          return (
            <ListItemButton
              key={item.path}
              selected={selected}
              onClick={() => {
                navigate(item.path);
                if (variant === 'temporary') onClose();
              }}
              sx={{
                borderRadius: 3,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: theme.palette.mode === 'light' ? 'primary.light' : 'primary.dark',
                  color: theme.palette.primary.contrastText,
                  '& .MuiListItemIcon-root': { color: theme.palette.primary.contrastText }
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          );
        })}
      </List>
      <Divider />
      <List sx={{ px: 2, py: 2 }}>
        {SECONDARY_ITEMS.map((item) => {
          const selected = location.pathname.startsWith(item.path);
          return (
            <ListItemButton
              key={item.path}
              selected={selected}
              onClick={() => {
                navigate(item.path);
                if (variant === 'temporary') onClose();
              }}
              sx={{ borderRadius: 3, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={variant === 'permanent' ? true : mobileOpen}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider'
        }
      }}
    >
      {content}
    </Drawer>
  );
}
