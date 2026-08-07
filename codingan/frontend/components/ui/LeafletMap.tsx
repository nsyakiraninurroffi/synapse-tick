'use client';

import { useEffect, useRef, useState } from 'react';

interface LeafletMapProps {
  lat: number;
  lng: number;
  label: string;
}

declare global {
  interface Window {
    L: any;
  }
}

export default function LeafletMap({ lat, lng, label }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Load Leaflet CSS if not already present
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS script or use window.L if already loaded
    if (window.L) {
      if (isMounted) setMapLoaded(true);
    } else {
      let script = document.getElementById('leaflet-js') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        document.head.appendChild(script);
      }
      const onLoad = () => {
        if (isMounted) setMapLoaded(true);
      };
      script.addEventListener('load', onLoad);

      return () => {
        isMounted = false;
        script.removeEventListener('load', onLoad);
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstance.current || !window.L) return;

    const L = window.L;

    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: true,
      attributionControl: true,
    });

    // Dark-themed tile layer (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Custom marker icon (brand colored)
    const customIcon = L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="
          width: 40px; height: 40px;
          background: linear-gradient(135deg, #6366F1, #4F46E5);
          border-radius: 50% 50% 50% 4px;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 4px 16px rgba(99,102,241,0.4), 0 2px 4px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
        ">
          <svg style="transform: rotate(45deg); width: 18px; height: 18px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -42],
    });

    // Add marker
    L.marker([lat, lng], { icon: customIcon })
      .addTo(map)
      .bindPopup(
        `<div style="font-family: system-ui; padding: 4px 0;">
          <strong style="font-size: 13px; color: #1e293b;">${label}</strong><br/>
          <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" 
             target="_blank" rel="noopener" 
             style="color: #6366F1; font-size: 11px; text-decoration: none; font-weight: 600;">
            📍 Buka di Google Maps →
          </a>
        </div>`,
        { closeButton: false, className: 'venue-popup' }
      )
      .openPopup();

    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mapLoaded, lat, lng, label]);

  return <div ref={mapRef} className="w-full h-full" />;
}
