import { createTheme } from '@mui/material';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1DB954', // Spotify Green
      contrastText: '#ffffff',
    },
    background: {
      default: '#121212', // Very Dark Grey
      paper: '#181818',   // Card Grey
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B3B3B3',
    },
  },
  typography: {
    fontFamily: '"Circular Std", "Helvetica", "Arial", sans-serif',
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 50,
          padding: '10px 24px',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          '& fieldset': { borderColor: '#535353' },
          '&:hover fieldset': { borderColor: '#b3b3b3' },
          '&.Mui-focused fieldset': { borderColor: '#1DB954' },
        },
      },
    },
  },
});