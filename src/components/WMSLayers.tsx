import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';
import type { WMSService } from '../types/wms.types';

interface WMSLayersProps {
  service: WMSService;
}

export default function WMSLayers({ service }: WMSLayersProps) {
  const mapHook = useMap({ mapId: 'map-1' });
  const mapRef = useRef(mapHook.map);
  const currentLayersRef = useRef<string>(''); // Track current layers on map

  // Keep map ref updated
  useEffect(() => {
    mapRef.current = mapHook.map;
  }, [mapHook.map]);

  // Create a stable representation of layers that only changes when visibility changes
  const layersKey = useMemo(
    () => service.layers.map((l) => `${l.id}:${l.name}:${l.visible}`).join('|'),
    [service.layers]
  );

  useLayoutEffect(() => {
    if (!mapHook.map) return;

    const map = mapHook.map;

    const syncLayers = () => {
      if (!map) return;

      console.log('=== Syncing layers for service:', service.id);
      console.log('Service visible:', service.visible);
      console.log('Layers config:', service.layers.map(l => ({ id: l.id, name: l.name, visible: l.visible })));

      // Get all visible layer names
      const visibleLayerNames = service.visible
        ? service.layers
            .filter((layer) => layer.visible)
            .map((layer) => layer.name)
        : [];

      console.log('Visible layer names:', visibleLayerNames);

      const sourceId = `${service.id}-source`;
      const layerId = `${service.id}-layer`;

      // If service is not visible or no layers are visible, remove everything
      if (!service.visible || visibleLayerNames.length === 0) {
        try {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
            console.log('Removed layer:', layerId);
          }
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
            console.log('Removed source:', sourceId);
          }
          // Reset the ref since nothing is on the map
          currentLayersRef.current = '';
        } catch (e) {
          console.warn('Error removing layer/source:', e);
        }
        return;
      }

      // Join all visible layer names with comma (WMS supports multiple layers in one request)
      const layersParam = visibleLayerNames.join(',');

      console.log('Current layers on map:', currentLayersRef.current);
      console.log('New layers param:', layersParam);

      // Check if we need to update the source
      const needsUpdate = currentLayersRef.current !== layersParam;

      if (!needsUpdate && map.getLayer(layerId)) {
        // Layers haven't changed, just update opacity if needed
        const currentOpacity = map.getPaintProperty(layerId, 'raster-opacity');
        if (currentOpacity !== service.opacity) {
          map.setPaintProperty(layerId, 'raster-opacity', service.opacity);
          console.log('Updated opacity only:', service.opacity);
        } else {
          console.log('No changes needed, layers already correct');
        }
        return;
      }

      // Use the version from GetCapabilities, default to 1.1.1 for compatibility
      const wmsVersion = service.version || '1.1.1';
      // WMS 1.3.0+ uses CRS parameter, earlier versions use SRS
      const srsParam = wmsVersion >= '1.3.0' ? 'CRS' : 'SRS';

      // Build the WMS tile URL
      const tileUrl = `${service.url}?SERVICE=WMS&VERSION=${wmsVersion}&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=TRUE&LAYERS=${layersParam}&STYLES=&${srsParam}=EPSG:3857&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}`;

      try {
        // Always remove existing layer and source before re-adding
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }

        // Add source with new layer configuration
        const sourceConfig: { type: 'raster'; tiles: string[]; tileSize: number; attribution?: string } = {
          type: 'raster',
          tiles: [tileUrl],
          tileSize: 256
        };

        // Add attribution if available
        if (service.attribution) {
          sourceConfig.attribution = service.attribution;
        }

        map.addSource(sourceId, sourceConfig);
        console.log('Added/updated source with layers:', layersParam);

        // Add the layer
        map.addLayer({
          id: layerId,
          type: 'raster',
          source: sourceId,
          paint: {
            'raster-opacity': service.opacity
          }
        });
        console.log('Added/updated layer with opacity:', service.opacity);

        // Update the ref to track what's currently on the map
        currentLayersRef.current = layersParam;
      } catch (e) {
        console.warn('Error syncing layer:', e);
      }
    };

    // Wait for map to be fully loaded
    if (!map.isStyleLoaded()) {
      const onStyleLoad = () => {
        map.off('styledata', onStyleLoad);
        // Trigger sync after style is loaded
        setTimeout(() => {
          if (mapRef.current) {
            syncLayers();
          }
        }, 0);
      };
      map.on('styledata', onStyleLoad);
      return () => {
        map.off('styledata', onStyleLoad);
      };
    }

    // If style is already loaded, sync immediately
    syncLayers();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapHook.map, service.id, service.visible, service.opacity, service.url, layersKey]);

  // Cleanup on unmount - always remove layers/sources for this service
  useEffect(() => {
    const serviceId = service.id;
    
    return () => {
      const map = mapRef.current;
      if (!map) return;

      const layerId = `${serviceId}-layer`;
      const sourceId = `${serviceId}-source`;

      console.log('Cleaning up service:', serviceId);

      try {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
          console.log('Removed layer:', layerId);
        }
      } catch (err) {
        console.warn(`Error removing layer:`, err);
      }

      try {
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
          console.log('Removed source:', sourceId);
        }
      } catch (err) {
        console.warn(`Error removing source:`, err);
      }

      // Reset the ref
      currentLayersRef.current = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only cleanup on unmount

  return null;
}
