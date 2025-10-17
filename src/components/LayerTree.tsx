import {
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Checkbox,
  Collapse,
  Slider,
  Typography,
  Tooltip,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Stack,
  Chip,
  Pagination
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  Delete,
  ZoomIn,
  Layers as LayersIcon,
  LibraryBooks,
  Info,
  ContentCopy
} from '@mui/icons-material';
import { useState } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';
import { useMapStore } from '../store/mapStore';
import type { WMSService } from '../types/wms.types';
import type { WMSLibraryItem } from '../types/wms.types';
import WMSLibrary from './WMSLibrary';
import { getWMSDetailsById } from '../utils/duckdbUtils';

interface LayerTreeItemProps {
  service: WMSService;
}

function LayerTreeItem({ service }: LayerTreeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [dbInfo, setDbInfo] = useState<WMSLibraryItem | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [layerPage, setLayerPage] = useState(1);
  const [infoLayerPage, setInfoLayerPage] = useState(1);
  const layersPerPage = 10;
  const mapHook = useMap({ mapId: 'map-1' });
  const { toggleWMSService, toggleWMSLayer, removeWMSService, updateWMSOpacity } = useMapStore();

  const handleZoomToExtent = () => {
    if (service.extent && mapHook.map) {
      const [minLng, minLat, maxLng, maxLat] = service.extent;
      mapHook.map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat]
        ],
        { padding: 50, duration: 1000 }
      );
    }
  };

  const handleOpenInfo = async () => {
    setInfoOpen(true);
    if (!dbInfo) {
      setLoadingInfo(true);
      try {
        const details = await getWMSDetailsById(service.id);
        setDbInfo(details);
      } catch (err) {
        console.error('Failed to load WMS details:', err);
      } finally {
        setLoadingInfo(false);
      }
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const capabilitiesUrl = `${service.url}?service=WMS&request=GetCapabilities`;

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', overflowX: 'hidden' }}>
      <ListItem
        dense
        sx={{
          py: 0.25,
          bgcolor: 'background.paper',
          '&:hover': { bgcolor: 'action.hover' },
          overflowX: 'hidden'
        }}
      >
        <Checkbox
          edge="start"
          checked={service.visible}
          onChange={() => toggleWMSService(service.id)}
          size="small"
          sx={{ py: 0 }}
        />
        <ListItemText
          primary={service.title}
          secondary={`${service.layers.length} layer(s)`}
          primaryTypographyProps={{ 
            variant: 'caption', 
            fontSize: '0.8rem',
            sx: {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }
          }}
          secondaryTypographyProps={{ variant: 'caption', fontSize: '0.7rem' }}
        />
        <Tooltip title="Service info">
          <IconButton size="small" onClick={handleOpenInfo} sx={{ p: 0.5 }}>
            <Info fontSize="small" />
          </IconButton>
        </Tooltip>
        {service.extent && (
          <Tooltip title="Zoom to extent">
            <IconButton size="small" onClick={handleZoomToExtent} sx={{ p: 0.5 }}>
              <ZoomIn fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Remove service">
          <IconButton
            size="small"
            onClick={() => removeWMSService(service.id)}
            color="error"
            sx={{ p: 0.5 }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
        <IconButton size="small" onClick={() => setExpanded(!expanded)} sx={{ p: 0.5 }}>
          {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </IconButton>
      </ListItem>

      {/* Info Dialog */}
      <Dialog open={infoOpen} onClose={() => setInfoOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{service.title}</Typography>
            <IconButton size="small" onClick={() => setInfoOpen(false)}>
              <ExpandLess />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {/* Service Info from Capabilities */}
            {service.abstract && (
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {service.abstract}
                </Typography>
              </Box>
            )}

            {/* DB Info */}
            {loadingInfo && (
              <Typography variant="body2" color="text.secondary">Loading details...</Typography>
            )}
            {dbInfo && (
              <>
                {dbInfo.description && (
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Additional Info
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dbInfo.description}
                    </Typography>
                  </Box>
                )}
                <Box>
                  <Stack direction="row" spacing={1}>
                    <Chip label={dbInfo.category} size="small" />
                    <Chip label={dbInfo.country} size="small" color="primary" />
                  </Stack>
                </Box>
              </>
            )}

            <Divider />

            {/* Technical Details */}
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Technical Details
              </Typography>
              <Stack spacing={1}>
                {service.version && (
                  <Typography variant="body2">
                    <strong>WMS Version:</strong> {service.version}
                  </Typography>
                )}
                <Typography variant="body2">
                  <strong>Layers:</strong> {service.layers.length}
                </Typography>
                {service.extent && (
                  <Typography variant="body2">
                    <strong>Extent:</strong> [{service.extent.map(v => v.toFixed(2)).join(', ')}]
                  </Typography>
                )}
              </Stack>
            </Box>

            {/* Attribution */}
            {service.attribution && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Attribution
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {service.attribution}
                  </Typography>
                </Box>
              </>
            )}

            <Divider />

            {/* Available Layers */}
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Available Layers ({service.layers.length})
              </Typography>
              <List dense disablePadding sx={{ maxHeight: 200, overflowY: 'auto' }}>
                {service.layers
                  .slice((infoLayerPage - 1) * layersPerPage, infoLayerPage * layersPerPage)
                  .map((layer) => (
                    <ListItem key={layer.id} sx={{ px: 0, py: 0.5 }}>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="medium">
                            {layer.title}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="caption" component="span" display="block" color="text.secondary">
                              Name: {layer.name}
                            </Typography>
                            {layer.abstract && (
                              <Typography variant="caption" component="span" display="block" color="text.secondary">
                                {layer.abstract}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
              </List>
              {service.layers.length > layersPerPage && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <Pagination
                    count={Math.ceil(service.layers.length / layersPerPage)}
                    page={infoLayerPage}
                    onChange={(_, page) => setInfoLayerPage(page)}
                    size="small"
                    color="primary"
                  />
                </Box>
              )}
            </Box>

            <Divider />

            {/* Capabilities URL */}
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                GetCapabilities URL
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    flexGrow: 1,
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    bgcolor: 'action.hover',
                    p: 1,
                    borderRadius: 1
                  }}
                >
                  {capabilitiesUrl}
                </Typography>
                <Tooltip title="Copy to clipboard">
                  <IconButton 
                    size="small" 
                    onClick={() => handleCopyToClipboard(capabilitiesUrl)}
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ mt: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => window.open(capabilitiesUrl, '_blank')}
                  fullWidth
                >
                  Open Capabilities in New Tab
                </Button>
              </Box>
            </Box>

            {/* Service URL */}
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Service URL
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    flexGrow: 1,
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    bgcolor: 'action.hover',
                    p: 1,
                    borderRadius: 1
                  }}
                >
                  {service.url}
                </Typography>
                <Tooltip title="Copy to clipboard">
                  <IconButton 
                    size="small" 
                    onClick={() => handleCopyToClipboard(service.url)}
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Collapse in={expanded} timeout={0} unmountOnExit>
        <Box sx={{ pl: 3, pr: 1.5, py: 0.5, bgcolor: 'action.hover', overflowX: 'hidden' }}>
          <Box sx={{ mb: 0.5 }}>
            <Typography variant="caption" fontSize="0.7rem" gutterBottom display="block">
              Opacity
            </Typography>
            <Slider
              value={service.opacity}
              onChange={(_, value) => updateWMSOpacity(service.id, value as number)}
              min={0}
              max={1}
              step={0.1}
              valueLabelDisplay="auto"
              size="small"
              sx={{ mt: 0.5 }}
            />
          </Box>

          <List dense disablePadding>
            {service.layers
              .slice((layerPage - 1) * layersPerPage, layerPage * layersPerPage)
              .map((layer) => (
                <ListItem key={layer.id} sx={{ py: 0.15, pl: 0, overflowX: 'hidden' }}>
                  <Checkbox
                    edge="start"
                    checked={layer.visible}
                    onChange={() => toggleWMSLayer(service.id, layer.id)}
                    size="small"
                    sx={{ py: 0, flexShrink: 0 }}
                  />
                  <ListItemText
                    primary={layer.title}
                    secondary={layer.abstract}
                    primaryTypographyProps={{ 
                      variant: 'caption', 
                      fontSize: '0.75rem',
                      sx: {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      sx: {
                        fontSize: '0.65rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical'
                      }
                    }}
                  />
                </ListItem>
              ))}
          </List>

          {service.layers.length > layersPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, mb: 0.5 }}>
              <Pagination
                count={Math.ceil(service.layers.length / layersPerPage)}
                page={layerPage}
                onChange={(_, page) => setLayerPage(page)}
                size="small"
                color="primary"
              />
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

interface LayerTreeProps {
  open: boolean;
}

export default function LayerTree({ open }: LayerTreeProps) {
  const { wmsServices } = useMapStore();
  const [libraryExpanded, setLibraryExpanded] = useState(true);

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: open ? { xs: '100%', sm: 320, md: 350 } : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 320, md: 350 },
          maxWidth: { xs: '85vw', sm: 350 },
          boxSizing: 'border-box',
          top: 48, // Height of the AppBar
          height: 'calc(100% - 48px)',
          border: 'none',
          borderRight: 1,
          borderColor: 'divider',
          transition: 'width 0.3s ease-in-out',
          overflowX: 'hidden',
          overflowY: 'auto'
        }
      }}
    >
      <Box
        sx={{
          height: '100%',
          minHeight: 'fit-content',
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* WMS Library Section */}
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            flexGrow: libraryExpanded ? 1 : 0,
            minHeight: libraryExpanded ? 0 : 'auto',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              p: 1.5,
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              cursor: 'pointer',
              flexShrink: 0,
              '&:hover': { bgcolor: 'primary.dark' }
            }}
            onClick={() => setLibraryExpanded(!libraryExpanded)}
          >
            <LibraryBooks fontSize="small" />
            <Typography variant="subtitle2" fontSize="0.9rem" sx={{ flexGrow: 1 }}>
              WMS Library
            </Typography>
            <IconButton size="small" sx={{ color: 'inherit', p: 0.5 }}>
              {libraryExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </IconButton>
          </Box>
          
          <Collapse in={libraryExpanded} timeout={300} sx={{ flexGrow: 1, minHeight: 0 }}>
            <Box 
              sx={{ 
                height: '100%',
                overflow: 'hidden',
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <WMSLibrary embedded />
            </Box>
          </Collapse>
        </Box>

        {/* Layer Tree Section */}
        <Box
          sx={{
            p: 1.5,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'background.paper',
            flexShrink: 0
          }}
        >
          <LayersIcon fontSize="small" />
          <Typography variant="subtitle2" fontSize="0.9rem">Active Layers</Typography>
        </Box>

        <Box sx={{ flexGrow: libraryExpanded ? 0 : 1, flexShrink: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
          {wmsServices.length === 0 ? (
            <Box sx={{ p: 1.5, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                No layers added yet. Use the WMS Library above to add services.
              </Typography>
            </Box>
          ) : (
            <List disablePadding sx={{ overflowX: 'hidden' }}>
              {wmsServices.map((service) => (
                <LayerTreeItem key={service.id} service={service} />
              ))}
            </List>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
