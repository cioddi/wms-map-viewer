import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MapComponentsProvider } from '@mapcomponents/react-maplibre';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import 'maplibre-gl/dist/maplibre-gl.css';
import './index.css';
import App from './App.tsx';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2'
    },
    secondary: {
      main: '#dc004e'
    }
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MapComponentsProvider>
        <App />
      </MapComponentsProvider>
    </ThemeProvider>
  </StrictMode>
);
