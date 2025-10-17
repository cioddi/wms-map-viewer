export interface WMSLayer {
  id: string;
  name: string;
  title: string;
  abstract?: string;
  visible: boolean;
}

export interface WMSService {
  id: string;
  name: string;
  url: string;
  title: string;
  visible: boolean;
  opacity: number;
  layers: WMSLayer[];
  extent?: [number, number, number, number]; // [minx, miny, maxx, maxy]
  version?: string; // WMS version from GetCapabilities (e.g., '1.1.1', '1.3.0')
  abstract?: string; // Service description
  attribution?: string; // Attribution text
}

export interface WMSLibraryItem {
  id: string;
  name: string;
  url: string;
  category: string;
  country: string;
  description?: string;
  extent?: [number, number, number, number]; // [minx, miny, maxx, maxy]
}
