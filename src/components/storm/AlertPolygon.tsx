'use client';

import { Polygon, Popup } from 'react-leaflet';
import type { WeatherAlert } from './WeatherMap';

interface AlertPolygonProps {
  alert: WeatherAlert;
}

function getSeverityColor(severity: string): string {
  switch (severity?.toLowerCase()) {
    case 'extreme':
      return '#ef4444';
    case 'severe':
      return '#f97316';
    case 'moderate':
      return '#eab308';
    case 'minor':
      return '#3b82f6';
    default:
      return '#6b7280';
  }
}

export function AlertPolygon({ alert }: AlertPolygonProps) {
  if (!alert.geometry) return null;

  const color = getSeverityColor(alert.severity);

  // NOAA geometry can be Polygon or MultiPolygon
  const geometryType = alert.geometry.type;
  const coordinates = alert.geometry.coordinates;

  if (!coordinates || coordinates.length === 0) return null;

  // Convert GeoJSON coordinates [lon, lat] to Leaflet [lat, lon]
  const convertCoords = (ring: number[][]): [number, number][] =>
    ring.map(([lon, lat]) => [lat, lon] as [number, number]);

  const renderPolygon = (coords: number[][][], idx: number) => {
    const positions = convertCoords(coords[0]);
    return (
      <Polygon
        key={`${alert.id}-${idx}`}
        positions={positions}
        pathOptions={{
          color,
          fillColor: color,
          fillOpacity: 0.15,
          weight: 2,
          opacity: 0.7,
        }}
      >
        <Popup>
          <div className="text-sm max-w-xs">
            <p className="font-bold text-gray-900">{alert.event}</p>
            {alert.headline && (
              <p className="text-gray-700 text-xs mt-1">{alert.headline}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">{alert.areaDesc}</p>
          </div>
        </Popup>
      </Polygon>
    );
  };

  if (geometryType === 'Polygon') {
    return renderPolygon(coordinates, 0);
  }

  if (geometryType === 'MultiPolygon') {
    return (
      <>
        {coordinates.map((polygonCoords: number[][][], idx: number) =>
          renderPolygon(polygonCoords, idx)
        )}
      </>
    );
  }

  return null;
}
