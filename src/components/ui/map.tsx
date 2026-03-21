'use client';

import * as React from 'react';
import { createContext, useContext, useEffect, useImperativeHandle, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

// ============================================================
// CONTEXT & TYPES
// ============================================================

interface MapContextType {
  map: maplibregl.Map | null;
  isLoaded: boolean;
}

const MapContext = createContext<MapContextType>({ map: null, isLoaded: false });

export const useMap = () => useContext(MapContext);

export type MapRef = maplibregl.Map;

interface MapViewport {
  center: [number, number]; // [lng, lat]
  zoom: number;
}

interface MapProps extends React.HTMLAttributes<HTMLDivElement> {
  longitude?: number;
  latitude?: number;
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  theme?: 'light' | 'dark';
  styles?: { light?: string | maplibregl.StyleSpecification; dark?: string | maplibregl.StyleSpecification };
  projection?: maplibregl.ProjectionSpecification;
  viewport?: Partial<MapViewport>;
  onViewportChange?: (viewport: MapViewport) => void;
  loading?: boolean;
  children?: React.ReactNode;
}

// ============================================================
// MAIN MAP COMPONENT
// ============================================================

export const Map = React.forwardRef<MapRef, MapProps>(({
  longitude = 20,
  latitude = 5,
  center, // [lat, lng]
  zoom = 2,
  theme,
  styles,
  projection,
  viewport,
  onViewportChange,
  loading = false,
  className,
  children,
  ...props
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Expose map instance via ref
  useImperativeHandle(ref, () => mapRef.current as maplibregl.Map, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = center ? [center[1], center[0]] : [longitude, latitude];

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styles?.dark || 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: initialCenter,
      zoom: zoom,
      attributionControl: false
    });

    if (projection) {
      map.setProjection(projection);
    }

    map.on('load', () => {
      setIsLoaded(true);
    });

    map.on('move', () => {
      if (onViewportChange) {
        const c = map.getCenter();
        onViewportChange({
          center: [c.lng, c.lat],
          zoom: map.getZoom()
        });
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync with viewport prop if provided
  useEffect(() => {
    if (mapRef.current && isLoaded && viewport) {
      if (viewport.center) mapRef.current.setCenter(viewport.center);
      if (viewport.zoom !== undefined) mapRef.current.setZoom(viewport.zoom);
    }
  }, [viewport, isLoaded]);

  return (
    <div 
      ref={containerRef} 
      className={cn("w-full h-full min-h-[400px] relative overflow-hidden", className)} 
      {...props}
    >
      <MapContext.Provider value={{ map: mapRef.current, isLoaded }}>
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        {isLoaded && children}
      </MapContext.Provider>
    </div>
  );
});

Map.displayName = 'Map';

// ============================================================
// MAP CONTROLS
// ============================================================

interface MapControlsProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  showZoom?: boolean;
  showCompass?: boolean;
  showLocate?: boolean;
  showFullscreen?: boolean;
  className?: string;
}

export function MapControls({
  position = "bottom-right",
  showZoom = true,
  showCompass = false,
  showFullscreen = false
}: MapControlsProps) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    const nav = new maplibregl.NavigationControl({
      showCompass,
      showZoom
    });

    map.addControl(nav, position);

    if (showFullscreen) {
      map.addControl(new maplibregl.FullscreenControl(), position);
    }

    return () => {
      if (map && nav) {
        try {
          map.removeControl(nav);
        } catch (e) {
          // Ignore removal errors during unmount or if already removed
        }
      }
    };
  }, [map, isLoaded, position, showZoom, showCompass, showFullscreen]);

  return null;
}

// ============================================================
// MAP MARKER & SUBCOMPONENTS
// ============================================================

interface MapMarkerProps {
  longitude: number;
  latitude: number;
  children?: React.ReactNode;
  onClick?: (e: any) => void;
  onMouseEnter?: (e: any) => void;
  onMouseLeave?: (e: any) => void;
}

const MarkerContext = createContext<{ marker: maplibregl.Marker | null }>({ marker: null });

export function MapMarker({
  longitude,
  latitude,
  children,
  onClick,
  onMouseEnter,
  onMouseLeave
}: MapMarkerProps) {
  const { map, isLoaded } = useMap();
  const [marker, setMarker] = useState<maplibregl.Marker | null>(null);
  const elementRef = useRef<HTMLDivElement>(document.createElement('div'));

  useEffect(() => {
    if (!map || !isLoaded) return;

    const element = elementRef.current;
    
    const newMarker = new maplibregl.Marker({
      element
    })
    .setLngLat([longitude, latitude])
    .addTo(map);

    if (onClick) element.onclick = onClick;
    if (onMouseEnter) element.onmouseenter = onMouseEnter;
    if (onMouseLeave) element.onmouseleave = onMouseLeave;

    setMarker(newMarker);

    return () => {
      newMarker.remove();
      setMarker(null);
    };
  }, [map, isLoaded, longitude, latitude]);

  return (
    <MarkerContext.Provider value={{ marker }}>
      {createPortal(children, elementRef.current)}
    </MarkerContext.Provider>
  );
}

export function MarkerContent({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      {children || <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-md" />}
    </div>
  );
}

export function MarkerPopup({ children, className, closeButton = false }: { children: React.ReactNode; className?: string; closeButton?: boolean }) {
  const { map } = useMap();
  const { marker } = useContext(MarkerContext);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const elementRef = useRef<HTMLDivElement>(document.createElement('div'));

  useEffect(() => {
    if (!map || !marker) return;

    const popup = new maplibregl.Popup({
      closeButton,
      closeOnClick: true,
      className: cn('mapcn-popup', className),
      offset: 15
    })
    .setDOMContent(elementRef.current);

    marker.setPopup(popup);
    popupRef.current = popup;

    return () => {
      if (marker) {
        marker.setPopup(null as any);
      }
    };
  }, [map, marker, className, closeButton]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn("bg-slate-900/95 border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden pointer-events-auto", className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>,
    elementRef.current
  );
}

export function MarkerTooltip({ children, className }: { children: React.ReactNode; className?: string }) {
  const { map } = useMap();
  const { marker } = useContext(MarkerContext);
  const tooltipRef = useRef<maplibregl.Popup | null>(null);
  const elementRef = useRef<HTMLDivElement>(document.createElement('div'));

  useEffect(() => {
    if (!map || !marker) return;

    const tooltip = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: cn('mapcn-tooltip', className),
      offset: 15
    })
    .setDOMContent(elementRef.current);

    const onEnter = () => {
      tooltip.setLngLat(marker.getLngLat()).addTo(map);
    };
    const onLeave = () => {
      tooltip.remove();
    };

    marker.getElement().addEventListener('mouseenter', onEnter);
    marker.getElement().addEventListener('mouseleave', onLeave);

    return () => {
      marker.getElement().removeEventListener('mouseenter', onEnter);
      marker.getElement().removeEventListener('mouseleave', onLeave);
      if (tooltip) {
        tooltip.remove();
      }
    };
  }, [map, marker, className]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 5 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={cn("bg-slate-900/90 border border-slate-700/50 rounded-lg shadow-xl px-3 py-2 pointer-events-none backdrop-blur-md", className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>,
    elementRef.current
  );
}

// ============================================================
// GEOJSON LAYERS
// ============================================================

export function MapPolygonLayer({
  id,
  data,
  fillColor = '#06b6d4',
  fillOpacity = 0.3,
  strokeColor = '#0891b2',
  strokeWidth = 1,
  onClick
}: {
  id: string;
  data: any;
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  onClick?: (feature: any) => void;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    const sourceId = `${id}-source`;
    const fillLayerId = `${id}-fill`;
    const lineLayerId = `${id}-line`;

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, { type: 'geojson', data });
      
      map.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: { 'fill-color': fillColor, 'fill-opacity': fillOpacity }
      });

      map.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        paint: { 'line-color': strokeColor, 'line-width': strokeWidth }
      });

      if (onClick) {
        map.on('click', fillLayerId, (e) => {
          if (e.features && e.features.length > 0) onClick(e.features[0]);
        });
      }
    }

    return () => {
      if (map) {
        if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
        if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      }
    };
  }, [map, isLoaded, id, data]);

  return null;
}

export default Map;

/* 
PREVIOUS VERSION FOR REFERENCE:
'use client';

import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapMarkerProps {
  position: [number, number];
  color?: string;
  size?: number;
  onClick?: () => void;
  children?: React.ReactNode;
}

interface MapProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  children?: React.ReactNode;
}

interface PolygonLayerProps {
  id: string;
  data: GeoJSON.FeatureCollection;
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  onClick?: (feature: any) => void;
}

// Map Component
export function Map({ 
  center = [0, 20], 
  zoom = 2, 
  className = '',
  children 
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [center[1], center[0]], // [lng, lat]
      zoom: zoom
    });
    
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);
  
  // Update center and zoom
  useEffect(() => {
    if (map.current) {
      map.current.flyTo({
        center: [center[1], center[0]],
        zoom: zoom,
        duration: 1000
      });
    }
  }, [center, zoom]);
  
  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none">
        {children}
      </div>
    </div>
  );
}

// Map Marker Component
export function MapMarker({ 
  position, 
  color = '#06b6d4', 
  size = 12,
  onClick,
  children 
}: MapMarkerProps) {
  return null; // Markers are handled differently with maplibregl
}

// Marker Content (for popups)
export function MarkerContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Marker Tooltip
export function MarkerTooltip({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Map Controls
export function MapControls({ position = 'top-right' }: { position?: string }) {
  return null; // Controls are added directly to the map
}

// Polygon Layer Component - handles GeoJSON polygons
export function MapPolygonLayer({ 
  id,
  data,
  fillColor = '#06b6d4',
  fillOpacity = 0.3,
  strokeColor = '#0891b2',
  strokeWidth = 1,
  onClick
}: PolygonLayerProps) {
  // This would be handled in the parent Map component in a real implementation
  return null;
}

// Simple static map with markers using Leaflet-style URL
export function StaticMap({
  markers,
  center,
  zoom,
  className = ''
}: {
  markers: Array<{
    lat: number;
    lng: number;
    color: string;
    size?: number;
    label?: string;
  }>;
  center: [number, number];
  zoom: number;
  className?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  
  useEffect(() => {
    if (!mapRef.current) return;
    
    if (!mapInstance.current) {
      mapInstance.current = new maplibregl.Map({
        container: mapRef.current,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256
            }
          },
          layers: [{
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
          }]
        },
        center: [center[1], center[0]],
        zoom: zoom
      });
      
      mapInstance.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    }
    
    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    
    // Add new markers
    markers.forEach(marker => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.width = `${marker.size || 12}px`;
      el.style.height = `${marker.size || 12}px`;
      el.style.backgroundColor = marker.color;
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      
      const mapMarker = new maplibregl.Marker({ element: el })
        .setLngLat([marker.lng, marker.lat])
        .addTo(mapInstance.current!);
      
      if (marker.label) {
        mapMarker.setPopup(
          new maplibregl.Popup({ offset: 25, closeButton: false })
            .setHTML(`<div class="p-2 text-sm">${marker.label}</div>`)
        );
      }
      
      markersRef.current.push(mapMarker);
    });
    
    return () => {
      markersRef.current.forEach(m => m.remove());
    };
  }, [markers, center, zoom]);
  
  return <div ref={mapRef} className={`w-full h-full ${className}`} />;
}

export default Map;
*/
