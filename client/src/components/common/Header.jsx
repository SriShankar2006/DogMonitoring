import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useMediaQuery,
  useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/MenuRounded';
import Brightness4Icon from '@mui/icons-material/Brightness4Rounded';
import Brightness7Icon from '@mui/icons-material/Brightness7Rounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import PersonIcon from '@mui/icons-material/PersonRounded';
import { useThemeMode } from '../../context/ThemeModeContext';
import { DRAWER_WIDTH } from './Sidebar';

const ADMIN_API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export default function Header({ onMenuClick, title }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { mode, toggleMode } = useThemeMode();
  const navigate = useNavigate();
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const isAdmin = sessionStorage.getItem('dog_admin_session') === 'true';

  const handleUserClick = () => {
    sessionStorage.removeItem('dog_admin_session');
    navigate('/dashboard');
  };

  const handleAdminClick = () => {
    setAdminError('');
    setAdminDialogOpen(true);
  };

  const submitAdminPassword = async () => {
    setAdminError('');

    try {
      const response = await fetch(`${ADMIN_API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword })
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setAdminError(payload.message || 'Invalid password.');
        return;
      }

      sessionStorage.setItem('dog_admin_session', 'true');
      setAdminPassword('');
      setAdminDialogOpen(false);
      navigate('/dashboard');
    } catch (error) {
      setAdminError(error.message || 'Unable to verify the admin password.');
    }
  };

  return (
    <>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          width: isDesktop ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%',
          ml: isDesktop ? `${DRAWER_WIDTH}px` : 0,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {!isDesktop && (
            <IconButton edge="start" onClick={onMenuClick} aria-label="open navigation">
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }} noWrap>
            {title}
          </Typography>

          <Button
            variant={isAdmin ? 'outlined' : 'contained'}
            color="primary"
            startIcon={<PersonIcon />}
            onClick={handleUserClick}
            sx={{ minWidth: 110, borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
          >
            User
          </Button>

          <Button
            variant={isAdmin ? 'contained' : 'outlined'}
            color="primary"
            startIcon={<LockRoundedIcon />}
            onClick={handleAdminClick}
            sx={{ minWidth: 110, borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
          >
            Admin
          </Button>

          <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
            <IconButton onClick={toggleMode} aria-label="Toggle theme">
              {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Dialog open={adminDialogOpen} onClose={() => setAdminDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Admin Login</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="password"
            label="Password"
            value={adminPassword}
            onChange={(event) => setAdminPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                submitAdminPassword();
              }
            }}
            margin="dense"
            autoFocus
            error={Boolean(adminError)}
            helperText={adminError || 'Enter the admin password to continue.'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdminDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitAdminPassword}>Login</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
