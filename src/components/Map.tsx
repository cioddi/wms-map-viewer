import { MapLibreMap } from '@mapcomponents/react-maplibre'

export default function Map() {
  console.log('Rendering Map component');
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapLibreMap
        mapId="map-1"
        options={{
          center: [-98, 39],
          zoom: 3,
          style: {
            version: 8,
            sources: {
              'osm-tiles': {
                type: 'raster',
                tiles: [
                  'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
                ],
                tileSize: 256,
                attribution:
                  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              }
            },
            layers: [
              {
                id: 'osm-tiles-layer',
                type: 'raster',
                source: 'osm-tiles',
                minzoom: 0,
                maxzoom: 19
              }
            ]
          }
        }}
      />
    </div>
  );
}
