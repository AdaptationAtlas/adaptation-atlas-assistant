// Admin level types and configuration for Map component

export type AdminLevel = 'admin0' | 'admin1' | 'admin2';

export interface MapGeoConfig {
    path: string;
    idProperty: string;
    nameProperty: string;
}

export const MAP_GEO_CONFIGS: Record<AdminLevel, MapGeoConfig> = {
    admin0: {
        path: '/data/african-nations-reduced.geojson',
        idProperty: 'adm0_a3',
        nameProperty: 'name',
    },
    admin1: {
        path: '/data/gaul24_admin1_africa_simplified.geojson',
        idProperty: 'admin1_name',
        nameProperty: 'admin1_name',
    },
    admin2: {
        path: '/data/gaul24_admin2_africa_simplified.geojson',
        idProperty: 'admin2_name',
        nameProperty: 'admin2_name',
    },
};
