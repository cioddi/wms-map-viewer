# WMS Map Viewer

> ⚠️ **Disclaimer**: This project was vibecoded as part of an experiment to explore the state of AI coding agents.

A modern WMS (Web Map Service) viewer built with React, MapLibre GL JS, and DuckDB for efficient map service cataloging.

## Features

- 🗺️ **Interactive Map Viewer** - Built with MapLibre GL JS and @mapcomponents/react-maplibre
- 🦆 **DuckDB-Powered WMS Database** - Efficient storage and querying of WMS service metadata using DuckDB WASM
- 📚 **WMS Library Browser** - Searchable catalog of WMS services with filters by category, country, and map extent
- 🌲 **Layer Tree** - Interactive layer management with:
  - Toggle visibility for services and individual layers
  - Adjust opacity with sliders
  - Zoom to service extent
  - Remove services from the map
- 🎨 **Material-UI Design** - Clean, modern UI components
- 💾 **State Management** - Centralized state using Zustand
- 📝 **TypeScript** - Fully typed for better development experience
- 🔄 **WMS Capabilities** - Automatic fetching and parsing of WMS GetCapabilities documents

## Tech Stack

- **Vite** - Fast build tool and dev server
- **React 19** - UI library
- **TypeScript** - Type safety
- **MapLibre GL JS** - Map rendering engine
- **@mapcomponents/react-maplibre** - React wrapper for MapLibre
- **@mui/material** - UI component library
- **Zustand** - State management
- **DuckDB WASM** - In-browser SQL database for WMS service catalog
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

### Browsing the WMS Database

1. Click the **floating action button** (library icon) in the bottom-left corner to open the WMS library
2. Browse the DuckDB-powered catalog of WMS services
3. Use the search bar to find specific services
4. Filter by category, country, or current map extent
5. Click **Add** to add a WMS service to the map

### Managing Layers

The **Layer Tree** sidebar on the right provides:
- **Visibility Toggle** - Checkbox to show/hide services and layers
- **Opacity Slider** - Adjust transparency of WMS services
- **Zoom to Extent** - Focus map on service's geographic bounds
- **Remove Service** - Delete service and all its layers from the map

## Database

The application uses **DuckDB WASM** (`wms_unrestricted.duckdb`) to store and query WMS service metadata. This provides:
- Fast, SQL-based querying of WMS services
- Efficient filtering by category, country, and geographic extent
- In-browser database with no backend required
- Scalable storage for large WMS catalogs

## License

MIT
