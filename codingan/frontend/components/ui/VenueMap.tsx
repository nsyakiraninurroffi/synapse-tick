'use client';

import { useEffect, useState, useRef } from 'react';
import { MapPin, ExternalLink, Map, Navigation } from 'lucide-react';
import LeafletMap from './LeafletMap';

interface VenueMapProps {
  address: string;
  venueName?: string;
}

// Geocode address using Nominatim (free, no API key needed)
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const encoded = encodeURIComponent(address);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=id`,
      { headers: { 'User-Agent': 'SynapseTick/1.0' } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    // Retry without country code restriction
    const res2 = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
      { headers: { 'User-Agent': 'SynapseTick/1.0' } }
    );
    const data2 = await res2.json();
    if (data2 && data2.length > 0) {
      return { lat: parseFloat(data2[0].lat), lng: parseFloat(data2[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}

export function VenueMap({ address, venueName }: VenueMapProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  useEffect(() => {
    setIsClient(true);
    let cancelled = false;
    geocodeAddress(address).then((result) => {
      if (cancelled) return;
      if (result) {
        setCoords(result);
      } else {
        setError(true);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [address]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-accent-500/10 text-accent-500">
            <Map className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-[hsl(var(--text-primary))]">Lokasi Venue</h3>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            <Navigation className="w-3.5 h-3.5" />
            Google Maps
          </a>
        </div>
      </div>

      {/* Map Container */}
      <div
        className="relative rounded-2xl overflow-hidden border border-[hsl(var(--border-color))] shadow-card bg-[hsl(var(--bg-secondary))]"
        style={{ height: '340px' }}
      >
        {loading || !isClient ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-2">
              <MapPin className="w-8 h-8 text-brand-500/40 mx-auto animate-bounce" />
              <p className="text-xs text-[hsl(var(--text-muted))]">Mencari lokasi...</p>
            </div>
          </div>
        ) : coords && !error ? (
          <LeafletMap lat={coords.lat} lng={coords.lng} label={venueName || address} />
        ) : (
          /* Fallback — geocode failed */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-4">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-900/20 via-surface-900/50 to-accent-900/10" />
            <div className="relative z-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mx-auto">
                <MapPin className="w-8 h-8 text-accent-500" />
              </div>
              {venueName && (
                <p className="text-lg font-bold text-[hsl(var(--text-primary))]">{venueName}</p>
              )}
              <p className="text-sm text-[hsl(var(--text-secondary))] max-w-xs">{address}</p>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm inline-flex">
                <ExternalLink className="w-4 h-4" />
                Buka di Google Maps
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Address label */}
      <div className="flex items-start gap-2 px-1">
        <MapPin className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[hsl(var(--text-secondary))]">{address}</p>
      </div>
    </div>
  );
}
