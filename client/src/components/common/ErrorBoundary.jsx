import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button, Stack } from '@mui/material';
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';

/**
 * Catches render/lifecycle errors anywhere below it in the tree (e.g. a
 * Leaflet map layer throwing during mount/unmount) and shows a recoverable
 * screen instead of an unhandled exception unmounting the whole app, which
 * is what previously showed up to users as a blank white page that only a
 * full browser reload could fix.
 *
 * React error boundaries only catch errors during render/lifecycle/
 * constructors - they do NOT catch errors in async code or event handlers,
 * so this is a safety net for rendering crashes specifically.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error caught by ErrorBoundary:', error, info);
  }

  componentDidUpdate(prevProps) {
    // If the route changes while an error is being shown, clear it so the
    // next page gets a fresh chance to render instead of staying stuck.
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            p: 4
          }}
        >
          <ErrorOutlineRounded sx={{ fontSize: 56, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Something went wrong loading this page
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 420 }}>
            An unexpected error occurred. You can try again, and if it keeps happening please
            let us know.
          </Typography>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<RefreshRounded />}
              onClick={() => this.setState({ hasError: false })}
            >
              Try Again
            </Button>
            <Button variant="outlined" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </Stack>
        </Box>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
  // Optional value (e.g. current route pathname) that, when it changes,
  // automatically clears a previously caught error.
  resetKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};
