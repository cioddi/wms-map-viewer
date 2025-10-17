import WMSCapabilities from 'wms-capabilities';
import type { WMSService, WMSLayer } from '../types/wms.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchWMSCapabilities(url: string): Promise<any> {
  const capabilitiesUrl = `${url}?service=WMS&request=GetCapabilities`;
  
  try {
    // Try with no-cors mode first - this allows the request but limits what we can read
    const response = await fetch(capabilitiesUrl, {
      mode: 'cors', // Try CORS first
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    const parser = new WMSCapabilities(text, DOMParser);
    return parser.toJSON();
  } catch (error) {
    // If CORS fails, throw a more helpful error
    console.warn('Failed to fetch WMS capabilities (likely CORS issue):', error);
    throw new Error('Unable to fetch service capabilities. The WMS server may not support CORS. You can still add the service, but layers must be manually specified.');
  }
}

export function parseWMSCapabilities(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  capabilities: any
): Omit<WMSService, 'id' | 'url'> {
  const service = capabilities.Service || {};
  const version = capabilities.version || '1.1.1'; // Default to 1.1.1 if not specified
  const layers: WMSLayer[] = [];
  
  // Parse layers recursively - processes a single layer and its children
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseLayer = (layer: any) => {
    // Add layer if it has a Name (it's a queryable/renderable layer)
    if (layer.Name) {
      layers.push({
        id: layer.Name,
        name: layer.Name,
        title: layer.Title || layer.Name,
        abstract: layer.Abstract,
        visible: layers.length < 3 // Only enable first 3 layers by default
      });
    }
    
    // Recursively parse child layers
    if (layer.Layer) {
      const childLayers = Array.isArray(layer.Layer) ? layer.Layer : [layer.Layer];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      childLayers.forEach((childLayer: any) => parseLayer(childLayer));
    }
  };
  
  // Start parsing from the root layer
  if (capabilities.Capability?.Layer) {
    parseLayer(capabilities.Capability.Layer);
  }
  
  // Extract extent from the first layer with a BoundingBox
  let extent: [number, number, number, number] | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const findExtent = (layer: any): boolean => {
    if (layer.EX_GeographicBoundingBox) {
      const bbox = layer.EX_GeographicBoundingBox;
      extent = [bbox.westBoundLongitude, bbox.southBoundLatitude, bbox.eastBoundLongitude, bbox.northBoundLatitude];
      return true;
    }
    if (layer.Layer) {
      // Ensure Layer is an array
      const layerArray = Array.isArray(layer.Layer) ? layer.Layer : [layer.Layer];
      for (const childLayer of layerArray) {
        if (findExtent(childLayer)) return true;
      }
    }
    return false;
  };
  
  if (capabilities.Capability?.Layer) {
    findExtent(capabilities.Capability.Layer);
  }
  
  // Extract attribution
  let attribution: string | undefined;
  if (service.ContactInformation?.ContactPersonPrimary?.ContactOrganization) {
    attribution = service.ContactInformation.ContactPersonPrimary.ContactOrganization;
  } else if (service.ContactInformation?.ContactOrganization) {
    attribution = service.ContactInformation.ContactOrganization;
  }
  
  return {
    name: service.Title || 'WMS Service',
    title: service.Title || 'WMS Service',
    visible: true,
    opacity: 1,
    layers,
    extent,
    version,
    abstract: service.Abstract,
    attribution
  };
}

export function createWMSLayerUrl(
  baseUrl: string
): string {
  return baseUrl;
}
