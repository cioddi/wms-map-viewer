import { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, IconButton, Typography, useMediaQuery, useTheme, Backdrop } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import Map from './components/Map';
import MapContent from './components/MapContent';
import LayerTree from './components/LayerTree';
import './App.css';

function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Close sidebar by default on mobile, open on desktop
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleCloseSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Top Bar */}
      <AppBar 
        position="static" 
        elevation={2}
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'primary.main'
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 48 }}>
          <IconButton
            color="inherit"
            aria-label="toggle sidebar"
            edge="start"
            onClick={handleToggleSidebar}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontSize: { xs: '0.95rem', sm: '1.1rem' },
                display: { xs: 'none', sm: 'block' }
              }}
            >
              WMS Map Viewer
            </Typography>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontSize: '0.95rem',
                display: { xs: 'block', sm: 'none' }
              }}
            >
              Map Viewer
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box
        sx={{
          display: 'flex',
          flexGrow: 1,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Sidebar - LayerTree with WMSLibrary */}
        <LayerTree open={sidebarOpen} />

        {/* Mobile Backdrop */}
        {isMobile && (
          <Backdrop
            open={sidebarOpen}
            onClick={handleCloseSidebar}
            sx={{
              zIndex: (theme) => theme.zIndex.drawer - 1,
              top: 48,
              bgcolor: 'rgba(0, 0, 0, 0.5)'
            }}
          />
        )}

        {/* Map Container */}
        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          <Map />
          <MapContent />
        </Box>
      </Box>
    </Box>
  );
}

export default App;
