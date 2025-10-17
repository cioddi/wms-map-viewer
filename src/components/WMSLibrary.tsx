import { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  TextField,
  Typography,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Stack
} from '@mui/material';
import { Close, Add, LibraryBooks, ZoomIn } from '@mui/icons-material';
import { useMapStore } from '../store/mapStore';
import { fetchWMSCapabilities, parseWMSCapabilities } from '../utils/wmsUtils';
import { queryWMSLibrary, getCategories, getCountries } from '../utils/duckdbUtils';
import type { WMSLibraryItem } from '../types/wms.types';

interface WMSLibraryProps {
  open?: boolean;
  onClose?: () => void;
  embedded?: boolean;
}

export default function WMSLibrary({ open = false, onClose, embedded = false }: WMSLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dbLoading, setDbLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [services, setServices] = useState<WMSLibraryItem[]>([]);
  const [totalServices, setTotalServices] = useState(0);
  const itemsPerPage = 5;
  const { addWMSService, mapBounds, wmsServices, setZoomToExtent } = useMapStore();

  // Load categories and countries on mount
  useEffect(() => {
    async function loadFilters() {
      try {
        const [cats, ctrs] = await Promise.all([
          getCategories(),
          getCountries()
        ]);
        setCategories(cats);
        setCountries(ctrs);
      } catch (err) {
        console.error('Failed to load filters:', err);
        setError('Failed to load database filters');
      }
    }
    loadFilters();
  }, []);

  // Load services when filters or pagination changes
  useEffect(() => {
    async function loadServices() {
      setDbLoading(true);
      try {
        const offset = (currentPage - 1) * itemsPerPage;
        const result = await queryWMSLibrary(
          searchQuery,
          categoryFilter,
          countryFilter,
          itemsPerPage,
          offset
        );
        setServices(result.data);
        setTotalServices(result.total);
      } catch (err) {
        console.error('Failed to load services:', err);
        setError('Failed to load WMS services from database');
        setServices([]);
        setTotalServices(0);
      } finally {
        setDbLoading(false);
      }
    }
    loadServices();
  }, [searchQuery, categoryFilter, countryFilter, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, countryFilter]);

  const handleAddService = async (item: WMSLibraryItem) => {
    setLoading(item.id);
    setError(null);

    try {
      const capabilities = await fetchWMSCapabilities(item.url);
      const serviceData = parseWMSCapabilities(capabilities);

      addWMSService({
        id: item.id,
        url: item.url,
        ...serviceData,
        extent: item.extent || serviceData.extent
      });

      setLoading(null);
    } catch (err) {
      // If capabilities fetch fails (e.g., CORS), add service with default configuration
      // The WMS tiles will still work as they're loaded as images (not subject to CORS for display)
      console.warn(`Could not fetch capabilities for ${item.name}, adding with default config:`, err);
      
      addWMSService({
        id: item.id,
        url: item.url,
        name: item.name,
        title: item.name,
        visible: true,
        opacity: 1,
        layers: [
          {
            id: 'default-layer',
            name: 'default-layer',
            title: 'Default Layer (capabilities unavailable)',
            abstract: 'Capabilities could not be fetched. You may need to configure layer names manually.',
            visible: true
          }
        ],
        extent: item.extent,
        version: '1.1.1' // Default to 1.1.1 when capabilities unavailable
      });

      setLoading(null);
      setError(`Added ${item.name} with default configuration. The server doesn't support CORS for capabilities, but tiles should still work. You may need to manually configure layer names.`);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  // Check if an extent intersects with the current map bounds
  const intersectsMapBounds = (extent?: [number, number, number, number]) => {
    if (!extent || !mapBounds || !Array.isArray(extent) || extent.length !== 4) return true;
    const [minX1, minY1, maxX1, maxY1] = extent;
    const [minX2, minY2, maxX2, maxY2] = mapBounds;
    return !(maxX1 < minX2 || minX1 > maxX2 || maxY1 < minY2 || minY1 > maxY2);
  };

  const totalPages = Math.ceil(totalServices / itemsPerPage);

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100%' }}>
      {/* Header - only show in drawer mode */}
      {!embedded && (
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: 'divider',
            flexShrink: 0
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LibraryBooks />
            <Typography variant="h6">WMS Library</Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      )}

      {/* Filters */}
      <Box sx={{ p: embedded ? 1.5 : 2, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: embedded ? 1 : 2 }}
        />

        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>Country</InputLabel>
            <Select
              value={countryFilter}
              label="Country"
              onChange={(e) => setCountryFilter(e.target.value)}
            >
              <MenuItem value="all">All Countries</MenuItem>
              {countries.map((country) => (
                <MenuItem key={country} value={country}>
                  {country}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: embedded ? 1 : 2, flexShrink: 0 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {dbLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Service List - Only this section scrolls */}
      {!dbLoading && (
        <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
          <List dense={embedded} sx={{ overflowX: 'hidden' }}>
            {services.map((item) => {
              const isInBounds = intersectsMapBounds(item.extent);
              const isAdded = wmsServices.some((s) => s.id === item.id);
              
              return (
                <Box key={item.id} sx={{ overflowX: 'hidden' }}>
                  <ListItem
                    disablePadding
                    sx={{ overflowX: 'hidden' }}
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {item.extent && (
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => setZoomToExtent(item.extent!)}
                            title="Zoom to extent"
                            sx={embedded ? { p: 0.25 } : {}}
                          >
                            <ZoomIn fontSize={embedded ? 'small' : 'medium'} />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleAddService(item)}
                          disabled={loading === item.id || isAdded}
                          title={isAdded ? 'Service added' : 'Add service'}
                          sx={embedded ? { p: 0.25 } : {}}
                        >
                          {loading === item.id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <Add fontSize={embedded ? 'small' : 'medium'} />
                          )}
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemButton dense={embedded} sx={{ overflowX: 'hidden', pr: embedded ? 8 : 10 }}>
                      <ListItemText
                        primary={item.name}
                        secondary={
                          <>
                            {item.description && !embedded && (
                              <Typography component="span" variant="caption" display="block" sx={{ mb: 0.5 }}>
                                {item.description}
                              </Typography>
                            )}
                            <Box component="span" sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: embedded ? 0.25 : 0 }}>
                              <Chip label={item.category} size="small" sx={embedded ? { height: 18, fontSize: '0.65rem' } : {}} />
                              <Chip label={item.country} size="small" color="primary" sx={embedded ? { height: 18, fontSize: '0.65rem' } : {}} />
                              {mapBounds && !embedded && (
                                <Chip
                                  label={isInBounds ? 'In View' : 'Out of View'}
                                  size="small"
                                  color={isInBounds ? 'success' : 'default'}
                                />
                              )}
                            </Box>
                          </>
                        }
                        primaryTypographyProps={embedded ? { 
                          variant: 'caption', 
                          fontSize: '0.75rem',
                          sx: {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }
                        } : {
                          sx: {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }
                        }}
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItemButton>
                  </ListItem>
                  <Divider />
                </Box>
              );
            })}
          </List>

          {services.length === 0 && (
            <Box sx={{ p: embedded ? 1 : 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" fontSize={embedded ? '0.75rem' : undefined}>
                No services found matching your criteria.
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Pagination Controls */}
      {totalServices > 0 && !dbLoading && (
        <Box sx={{ 
          p: embedded ? 1 : 2, 
          borderTop: 1, 
          borderColor: 'divider',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1
        }}>
          <Typography variant="caption" color="text.secondary">
            Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalServices)} of {totalServices} services
          </Typography>
          <Stack spacing={2}>
            <Pagination 
              count={totalPages} 
              page={currentPage} 
              onChange={(_, page) => setCurrentPage(page)}
              color="primary"
              size={embedded ? "small" : "medium"}
            />
          </Stack>
        </Box>
      )}
    </Box>
  );

  // If embedded, return content directly; otherwise wrap in Drawer
  if (embedded) {
    return content;
  }

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 400,
          boxSizing: 'border-box'
        }
      }}
    >
      {content}
    </Drawer>
  );
}
