# WebGIS Application

A modern React-based WebGIS application built with Vite, MapLibre GL JS, and Material-UI.

## Features

- 🗺️ **Interactive Map** - Built with MapLibre GL JS and @mapcomponents/react-maplibre
- 📚 **WMS Library** - Searchable catalog of WMS services with filters by category, country, and map extent
- 🌲 **Layer Tree** - Interactive layer management with:
  - Toggle visibility for services and individual layers
  - Adjust opacity with sliders
  - Zoom to service extent
  - Remove services from the map
- 🎨 **Material-UI Design** - Beautiful, extensible UI components
- 💾 **State Management** - Centralized state using Zustand
- 📝 **TypeScript** - Fully typed for better development experience
- 🔄 **WMS Capabilities** - Automatic fetching and parsing of WMS GetCapabilities

## Tech Stack

- **Vite** - Fast build tool and dev server
- **React 19** - UI library
- **TypeScript** - Type safety
- **MapLibre GL JS** - Map rendering engine
- **@mapcomponents/react-maplibre** - React wrapper for MapLibre
- **@mui/material** - UI component library
- **Zustand** - State management
- **wms-capabilities** - WMS capabilities parser

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Usage

### Adding WMS Services

1. Click the **floating action button** (library icon) in the bottom-left corner
2. Browse or search the WMS library
3. Filter by category or country
4. Click **Add** to add a service to the map

### Managing Layers

The **Layer Tree** sidebar on the right provides:
- **Visibility Toggle** - Checkbox to show/hide services and layers
- **Opacity Slider** - Adjust transparency of WMS services
- **Zoom to Extent** - Focus map on service's geographic bounds
- **Remove Service** - Delete service and all its layers from the map

## Current WMS Services

- **StatCan - Multiple Deprivation** (Canada, Demographics)
- **USGS - Shaded Relief** (USA, Topography)

## License

MIT
