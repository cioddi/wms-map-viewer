import * as duckdb from '@duckdb/duckdb-wasm';
import type { WMSLibraryItem } from '../types/wms.types';

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;
let initialized = false;
let initPromise: Promise<{ db: duckdb.AsyncDuckDB; conn: duckdb.AsyncDuckDBConnection }> | null = null;

export async function initDuckDB() {
  // If already initialized, return existing instances
  if (initialized && db && conn) {
    return { db, conn };
  }

  // If initialization is in progress, wait for it
  if (initPromise) {
    return initPromise;
  }

  // Start initialization
  initPromise = (async () => {
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

    // Select a bundle based on browser capabilities
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    // Override with local WASM files
    const worker_url = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker}");`], {
        type: 'text/javascript'
      })
    );

    const worker = new Worker(worker_url);
    const logger = new duckdb.ConsoleLogger();
    db = new duckdb.AsyncDuckDB(logger, worker);

    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    URL.revokeObjectURL(worker_url);

    // Open connection
    conn = await db.connect();

    // Install and load spatial extension
    await conn.query(`INSTALL spatial;`);
    await conn.query(`LOAD spatial;`);

    // Load the database file from public folder
    const response = await fetch(`${import.meta.env.BASE_URL}wms_unrestricted.duckdb`);
    const buffer = await response.arrayBuffer();
    await db.registerFileBuffer('wms_unrestricted.duckdb', new Uint8Array(buffer));

    // Attach the database
    await conn.query(`ATTACH 'wms_unrestricted.duckdb' AS wms (READ_ONLY);`);

    initialized = true;
    return { db, conn };
  })();

  return initPromise;
}

// Helper function to escape SQL strings
function escapeSQLString(str: string): string {
  return str.replace(/'/g, "''");
}

export async function queryWMSLibrary(
  searchQuery: string = '',
  categoryFilter: string = 'all',
  countryFilter: string = 'all',
  limit: number = 5,
  offset: number = 0
): Promise<{ data: WMSLibraryItem[], total: number }> {
  const { conn } = await initDuckDB();

  const whereClause: string[] = [];

  if (searchQuery) {
    const escapedQuery = escapeSQLString(searchQuery.toLowerCase());
    whereClause.push(`(LOWER(name) LIKE '%${escapedQuery}%' OR LOWER(description) LIKE '%${escapedQuery}%')`);
  }

  if (categoryFilter !== 'all') {
    const escapedCategory = escapeSQLString(categoryFilter);
    whereClause.push(`category = '${escapedCategory}'`);
  }

  if (countryFilter !== 'all') {
    const escapedCountry = escapeSQLString(countryFilter);
    whereClause.push(`country = '${escapedCountry}'`);
  }

  const whereSQL = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM wms.wms_resources ${whereSQL}`;
  const countResult = await conn!.query(countQuery);
  const totalBigInt = countResult.toArray()[0].total;
  const total = Number(totalBigInt); // Convert BigInt to number

  // Get paginated data - extract bbox from geometry
  const dataQuery = `
    SELECT
      id,
      name,
      url,
      category,
      country,
      description,
      ST_XMin(geom) as minx,
      ST_YMin(geom) as miny,
      ST_XMax(geom) as maxx,
      ST_YMax(geom) as maxy,
      area
    FROM wms.wms_resources
    ${whereSQL}
    ORDER BY name
    LIMIT ${limit} OFFSET ${offset}
  `;

  const dataResult = await conn!.query(dataQuery);
  const rows = dataResult.toArray();

  // Transform to match WMSLibraryItem interface
  const data: WMSLibraryItem[] = rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    url: row.url as string,
    category: row.category as string,
    country: row.country as string,
    description: row.description as string | undefined,
    extent: row.minx !== null ? [row.minx as number, row.miny as number, row.maxx as number, row.maxy as number] as [number, number, number, number] : undefined,
    area: row.area as number | undefined
  }));

  return { data, total };
}

export async function getCategories(): Promise<string[]> {
  const { conn } = await initDuckDB();
  
  const result = await conn!.query(`
    SELECT DISTINCT category 
    FROM wms.wms_resources 
    WHERE category IS NOT NULL 
    ORDER BY category
  `);
  
  return result.toArray().map((row) => row.category as string);
}

export async function getCountries(): Promise<string[]> {
  const { conn } = await initDuckDB();
  
  const result = await conn!.query(`
    SELECT DISTINCT country 
    FROM wms.wms_resources 
    WHERE country IS NOT NULL 
    ORDER BY country
  `);
  
  return result.toArray().map((row) => row.country as string);
}

export async function queryWMSByBounds(bounds: [number, number, number, number], maxAreaMultiplier: number = 1.5): Promise<WMSLibraryItem[]> {
  const { conn } = await initDuckDB();

  const [minX, minY, maxX, maxY] = bounds;
  const polygon = `POLYGON((${minX} ${minY}, ${maxX} ${minY}, ${maxX} ${maxY}, ${minX} ${maxY}, ${minX} ${minY}))`;

  // Calculate map bounds area and max allowed area
  const mapBoundsArea = (maxX - minX) * (maxY - minY);
  const maxArea = mapBoundsArea * maxAreaMultiplier;

  const result = await conn!.query(`
    SELECT
      id,
      name,
      url,
      category,
      country,
      description,
      ST_XMin(geom) as minx,
      ST_YMin(geom) as miny,
      ST_XMax(geom) as maxx,
      ST_YMax(geom) as maxy,
      area
    FROM wms.wms_resources
    WHERE ST_Intersects(geom, ST_GeomFromText('${polygon}'))
    AND area <= ${maxArea}
    ORDER BY area ASC NULLS LAST, name ASC
  `);
  
  const rows = result.toArray();
  
  const data: WMSLibraryItem[] = rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    url: row.url as string,
    category: row.category as string,
    country: row.country as string,
    description: row.description as string | undefined,
    extent: row.minx !== null ? [row.minx as number, row.miny as number, row.maxx as number, row.maxy as number] as [number, number, number, number] : undefined,
    area: row.area as number | undefined
  }));
  
  return data;
}

export async function getWMSDetailsById(id: string): Promise<WMSLibraryItem | null> {
  const { conn } = await initDuckDB();
  
  const escapedId = escapeSQLString(id);
  const result = await conn!.query(`
    SELECT
      id,
      name,
      url,
      category,
      country,
      description,
      ST_XMin(geom) as minx,
      ST_YMin(geom) as miny,
      ST_XMax(geom) as maxx,
      ST_YMax(geom) as maxy,
      area
    FROM wms.wms_resources
    WHERE id = '${escapedId}'
  `);
  
  const rows = result.toArray();
  if (rows.length === 0) {
    return null;
  }
  
  const row = rows[0];
  return {
    id: row.id as string,
    name: row.name as string,
    url: row.url as string,
    category: row.category as string,
    country: row.country as string,
    description: row.description as string | undefined,
    extent: row.minx !== null ? [row.minx as number, row.miny as number, row.maxx as number, row.maxy as number] as [number, number, number, number] : undefined,
    area: row.area as number | undefined
  };
}
