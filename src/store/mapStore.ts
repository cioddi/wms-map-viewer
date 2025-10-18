import { create } from 'zustand';
import type { WMSService } from '../types/wms.types';

interface MapState {
  wmsServices: WMSService[];
  mapBounds: [number, number, number, number] | null; // [minx, miny, maxx, maxy]
  zoomToExtent: [number, number, number, number] | null; // Extent to zoom to
  hoveredExtent: [number, number, number, number] | null; // Extent to highlight on hover
  addWMSService: (service: WMSService) => void;
  removeWMSService: (serviceId: string) => void;
  toggleWMSService: (serviceId: string) => void;
  toggleWMSLayer: (serviceId: string, layerId: string) => void;
  updateWMSOpacity: (serviceId: string, opacity: number) => void;
  setMapBounds: (bounds: [number, number, number, number]) => void;
  setZoomToExtent: (extent: [number, number, number, number] | null) => void;
  setHoveredExtent: (extent: [number, number, number, number] | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  wmsServices: [],
  mapBounds: null,
  zoomToExtent: null,
  hoveredExtent: null,
  
  addWMSService: (service) => 
    set((state) => {
      // Check if service already exists
      const exists = state.wmsServices.some((s) => s.id === service.id);
      if (exists) {
        console.log('⚠️ Service already exists, not adding:', service.id);
        return state; // Don't add if already exists
      }
      console.log('➕ Adding WMS service:', service.id, 'Total services will be:', state.wmsServices.length + 1);
      return {
        wmsServices: [...state.wmsServices, service]
      };
    }),
  
  removeWMSService: (serviceId) =>
    set((state) => {
      console.log('➖ Removing WMS service:', serviceId, 'Total services will be:', state.wmsServices.length - 1);
      return {
        wmsServices: state.wmsServices.filter((s) => s.id !== serviceId)
      };
    }),
  
  toggleWMSService: (serviceId) =>
    set((state) => ({
      wmsServices: state.wmsServices.map((s) =>
        s.id === serviceId ? { ...s, visible: !s.visible } : s
      )
    })),
  
  toggleWMSLayer: (serviceId, layerId) =>
    set((state) => ({
      wmsServices: state.wmsServices.map((s) =>
        s.id === serviceId
          ? {
              ...s,
              layers: s.layers.map((l) =>
                l.id === layerId ? { ...l, visible: !l.visible } : l
              )
            }
          : s
      )
    })),
  
  updateWMSOpacity: (serviceId, opacity) =>
    set((state) => ({
      wmsServices: state.wmsServices.map((s) =>
        s.id === serviceId ? { ...s, opacity } : s
      )
    })),
  
  setMapBounds: (bounds) =>
  set({ mapBounds: bounds }),

  setZoomToExtent: (extent) =>
  set({ zoomToExtent: extent }),

  setHoveredExtent: (extent) =>
  set({ hoveredExtent: extent })
}));
