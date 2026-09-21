import { createTheme } from '@mui/material/styles';

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    primary: {
      main: '#2E7D32',
      light: '#60ad5e',
      dark: '#005005',
      contrastText: '#fff'
    },
    secondary: {
      main: '#FF8F00',
      light: '#ffc046',
      dark: '#c56000',
      contrastText: '#000'
    },
    error: { main: '#D32F2F' },
    warning: { main: '#ED6C02' },
    success: { main: '#2E7D32' },
    info: { main: '#0288D1' },
    ...(mode === 'light'
      ? {
          background: { default: '#F4F6F5', paper: '#FFFFFF' },
          text: { primary: '#1A1D1B', secondary: '#4B4F4C' }
        }
      : {
          background: { default: '#101312', paper: '#171B19' },
          text: { primary: '#F1F3F1', secondary: '#B7BDB9' }
        })
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: `'Roboto', 'Poppins', sans-serif`,
    h1: { fontFamily: `'Poppins', sans-serif`, fontWeight: 700 },
    h2: { fontFamily: `'Poppins', sans-serif`, fontWeight: 700 },
    h3: { fontFamily: `'Poppins', sans-serif`, fontWeight: 600 },
    h4: { fontFamily: `'Poppins', sans-serif`, fontWeight: 600 },
    h5: { fontFamily: `'Poppins', sans-serif`, fontWeight: 600 },
    h6: { fontFamily: `'Poppins', sans-serif`, fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, paddingInline: 18 }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: 'none' }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { border: 'none' }
      }
    }
  }
});

export const buildTheme = (mode) => createTheme(getDesignTokens(mode));
