import { memo, useEffect, useMemo } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';
import { MlGeoJsonLayer } from '@mapcomponents/react-maplibre';
import { useMapStore } from '../store/mapStore';
import { useShallow } from 'zustand/react/shallow';
import WMSLayers from './WMSLayers';

function MapBoundsTracker() {
  const mapHook = useMap({ mapId: 'map-1' });
  const setMapBounds = useMapStore((state) => state.setMapBounds);
  const zoomToExtent = useMapStore((state) => state.zoomToExtent);
  const setZoomToExtent = useMapStore((state) => state.setZoomToExtent);

  useEffect(() => {
    if (!mapHook.map) return;

    const updateBounds = () => {
      const bounds = mapHook.map?.getBounds();
      if (bounds) {
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        setMapBounds([sw.lng, sw.lat, ne.lng, ne.lat]);
      }
    };

    // Update bounds initially
    mapHook.map.on('load', updateBounds);
    mapHook.map.on('moveend', updateBounds);

    return () => {
      mapHook.map?.off('load', updateBounds);
      mapHook.map?.off('moveend', updateBounds);
    };
  }, [mapHook.map, setMapBounds]);

  // Handle zoom to extent
  useEffect(() => {
    if (!mapHook.map || !zoomToExtent) return;

    const [minX, minY, maxX, maxY] = zoomToExtent;
    mapHook.map.fitBounds(
      [
        [minX, minY],
        [maxX, maxY]
      ],
      { padding: 50 }
    );

    // Clear the zoom request after handling it
    setZoomToExtent(null);
  }, [mapHook.map, zoomToExtent, setZoomToExtent]);

  return null;
}

const MapContent = memo(() => {
  const wmsServices = useMapStore(useShallow((state) => state.wmsServices));
  const hoveredExtent = useMapStore(useShallow((state) => state.hoveredExtent));

  console.log('MapContent rendering with services:', wmsServices.map(s => ({ id: s.id, title: s.title })));

  // Create GeoJSON for hovered extent
  const extentGeoJson = useMemo(() => {
    if (!hoveredExtent) return null;
    const [minX, minY, maxX, maxY] = hoveredExtent;
    return {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[
              [minX, minY],
              [maxX, minY],
              [maxX, maxY],
              [minX, maxY],
              [minX, minY]
            ]]
          },
          properties: {}
        }
      ]
    };
  }, [hoveredExtent]);



  return (
    <>
      <MapBoundsTracker />
      {wmsServices.map((service) => (
        <WMSLayers key={service.id} service={service} />
      ))}
      {extentGeoJson && (
        <MlGeoJsonLayer
          geojson={extentGeoJson}
          layerId="hovered-extent"
          type="line"
          paint={{
            'line-color': '#ff0000',
            'line-width': 2,
            'line-dasharray': [2, 2]
          }}
        />
      )}
    </>
  );
});

MapContent.displayName = 'MapContent';

export default MapContent;
