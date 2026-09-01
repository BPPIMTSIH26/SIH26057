/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useRef, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from '../contexts/ThemeContext';

const MapContext = createContext<maplibregl.Map | null>(null);

let cachedDarkStyle: any = null;
let cachedLightStyle: any = null;

export function useMap() {
  return useContext(MapContext);
}

export const Map = forwardRef(({ initialViewState, children, onIdle }: any, ref: any) => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useImperativeHandle(ref, () => map, [map]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    let mapInstance: maplibregl.Map;
    let isMounted = true;

    async function init() {
      try {
        let jsStyleObject;
        if (theme === 'dark' && cachedDarkStyle) {
          jsStyleObject = cachedDarkStyle;
        } else if (theme === 'light' && cachedLightStyle) {
          jsStyleObject = cachedLightStyle;
        } else {
          const styleUrl = theme === 'dark' ? 'https://tiles.openfreemap.org/styles/dark' : 'https://tiles.openfreemap.org/styles/positron';
          const response = await fetch(styleUrl);
          jsStyleObject = await response.json();

          jsStyleObject.layers.forEach((layer: any) => {
            if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
              layer.layout['text-field'] = [
                'coalesce',
                ['get', 'name:en'],
                ['get', 'name']
              ];
            }
            if (layer.id.includes('state') || layer.id.includes('province')) {
              layer.minzoom = 4.5;
            }
            if (layer.id.includes('city') || layer.id.includes('town') || layer.id.includes('village')) {
              layer.minzoom = 6;
            }
          });
          if (theme === 'dark') cachedDarkStyle = jsStyleObject;
          else cachedLightStyle = jsStyleObject;
        }

        if (!isMounted) return;

        mapInstance = new maplibregl.Map({
          container: containerRef.current!,
          style: jsStyleObject,
          center: [initialViewState.longitude, initialViewState.latitude],
          zoom: initialViewState.zoom,
          pitch: initialViewState.pitch || 0,
          bearing: initialViewState.bearing || 0,
          attributionControl: false,
          antialias: true,
          fadeDuration: 600,
          crossSourceCollisions: false,
        });

        mapInstance.on('load', () => {
          if (isMounted) setIsLoaded(true);
          
          // Force resize after load to fix WebGL viewport boundary glitches
          requestAnimationFrame(() => mapInstance?.resize());
          setTimeout(() => mapInstance?.resize(), 100);
          setTimeout(() => mapInstance?.resize(), 500);
          setTimeout(() => mapInstance?.resize(), 1500);
        });
        
        mapInstance.on('idle', (e) => {
          if (onIdle) onIdle(e);
        });

        let resizeTimeout: any;
        const ro = new ResizeObserver(() => {
          if (resizeTimeout) clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            if (mapInstance) mapInstance.resize();
          }, 150); // Debounce to wait for flex transitions to end
        });
        ro.observe(containerRef.current!);

        setMap(mapInstance);
        
        // Save resize observer to the instance so we can disconnect it on cleanup
        (mapInstance as any)._ro = ro;
      } catch (err) {
        console.error("Failed to init map", err);
      }
    }
    
    init();

    return () => {
      isMounted = false;
      if (mapInstance && (mapInstance as any)._ro) {
        (mapInstance as any)._ro.disconnect();
      }
      mapInstance?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once to initialize the map

  // Dynamically update map style when theme changes
  useEffect(() => {
    if (!map) return;
    async function updateStyle() {
      let jsStyleObject;
      if (theme === 'dark' && cachedDarkStyle) {
        jsStyleObject = cachedDarkStyle;
      } else if (theme === 'light' && cachedLightStyle) {
        jsStyleObject = cachedLightStyle;
      } else {
        const styleUrl = theme === 'dark' ? 'https://tiles.openfreemap.org/styles/dark' : 'https://tiles.openfreemap.org/styles/positron';
        const response = await fetch(styleUrl);
        jsStyleObject = await response.json();
        jsStyleObject.layers.forEach((layer: any) => {
          if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
            layer.layout['text-field'] = ['coalesce', ['get', 'name:en'], ['get', 'name']];
          }
          if (layer.id.includes('state') || layer.id.includes('province')) layer.minzoom = 4.5;
          if (layer.id.includes('city') || layer.id.includes('town') || layer.id.includes('village')) layer.minzoom = 6;
        });
        if (theme === 'dark') cachedDarkStyle = jsStyleObject;
        else cachedLightStyle = jsStyleObject;
      }
      map?.setStyle(jsStyleObject);
    }
    updateStyle();
  }, [theme, map]);

  return (
    <div 
      style={{ 
        width: '100%', height: '100%', position: 'absolute', inset: 0, 
        backgroundColor: theme === 'dark' ? '#0A0A0A' : '#F4F4F5',
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.8s ease-in-out'
      }}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />
      {map && <MapContext.Provider value={map}>{children}</MapContext.Provider>}
    </div>
  );
});

export function Marker({ longitude, latitude, children, onClick, anchor = 'center' }: any) {
  const map = useMap();
  const markerContainer = useMemo(() => document.createElement('div'), []);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!map) return;

    markerRef.current = new maplibregl.Marker({ element: markerContainer, anchor })
      .setLngLat([longitude, latitude])
      .addTo(map);

    return () => {
      markerRef.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, anchor, markerContainer]);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLngLat([longitude, latitude]);
    }
  }, [longitude, latitude]);

  return createPortal(
    <div 
      onClick={(e) => {
        if (onClick) onClick(e);
      }} 
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {children}
    </div>,
    markerContainer
  );
}

export function Source({ id, type, data, children }: any) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    const addSource = () => {
      if (!map.getSource(id)) {
        map.addSource(id, { type, data });
      }
    };

    if (map.isStyleLoaded()) {
      addSource();
    } else {
      map.on('load', addSource);
    }

    return () => {
      map.off('load', addSource);
      if (map.getStyle() && map.getSource(id)) {
        setTimeout(() => {
            if (map.getStyle() && map.getSource(id)) map.removeSource(id);
        }, 0);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, id, type]);

  useEffect(() => {
    if (map && map.getSource(id) && type === 'geojson') {
      (map.getSource(id) as maplibregl.GeoJSONSource).setData(data);
    }
  }, [map, id, data, type]);

  return (
    <React.Fragment>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { sourceId: id } as any);
        }
        return child;
      })}
    </React.Fragment>
  );
}

export function Layer({ id, type, paint, layout, sourceId }: any) {
  const map = useMap();
  
  useEffect(() => {
    if (!map || !sourceId) return;

    const addLayer = () => {
      if (!map.getLayer(id) && map.getSource(sourceId)) {
        map.addLayer({
          id,
          type,
          source: sourceId,
          paint: paint || {},
          layout: layout || {}
        });
      }
    };

    if (map.isStyleLoaded() && map.getSource(sourceId)) {
        addLayer();
    } else {
        map.on('sourcedata', (e) => {
            if (e.sourceId === sourceId && map.getSource(sourceId)) {
                addLayer();
            }
        });
    }

    return () => {
      if (map.getStyle() && map.getLayer(id)) {
        map.removeLayer(id);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, id, type, sourceId]);

  return null;
}
