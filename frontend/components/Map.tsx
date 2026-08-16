'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Report, Issue, Project } from '@/lib/api';

interface MapProps {
  center?: [number, number];
  zoom?: number;
  reports?: Report[];
  issues?: Issue[];
  projects?: Project[];
  onMarkerClick?: (item: Report | Issue | Project, type: 'report' | 'issue' | 'project') => void;
  style?: string;
}

export default function Map({
  center = [77.5946, 12.9716],
  zoom = 11,
  reports = [],
  issues = [],
  projects = [],
  onMarkerClick,
  style = 'https://demotiles.maplibre.org/style.json',
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style,
        center,
        zoom,
      });

      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      mapRef.current = map;

      map.on('load', () => {
        setMapLoaded(true);
        addMarkers(map);
      });

      return () => {
        map.remove();
        mapRef.current = null;
      };
    }
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      // Remove existing markers
      // Note: In production, use map.removeLayer/map.removeSource for better performance
      // For now, we'll recreate markers
      addMarkers(mapRef.current);
    }
  }, [reports, issues, projects, mapLoaded]);

  const addMarkers = (map: maplibregl.Map) => {
    // Clear existing markers by removing layers and sources
    // This is a simplified approach; in production use map.getSource().setData()
    
    // Add report markers
    reports.forEach((report, index) => {
      const el = document.createElement('div');
      const color = getSeverityColor(report.severity);
      el.innerHTML = `
        <div class="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer"
             style="background-color: ${color}"
             title="${report.category} - ${report.severity}">
          <span class="text-white text-xs font-bold">${index + 1}</span>
        </div>
      `;
      
      const marker = new maplibregl.Marker(el)
        .setLngLat([report.location.longitude, report.location.latitude])
        .addTo(map);
      
      el.addEventListener('click', () => {
        if (onMarkerClick) onMarkerClick(report, 'report');
      });
    });

    // Add issue markers (clustered)
    issues.forEach((issue, index) => {
      const el = document.createElement('div');
      const color = getSeverityColor(issue.severity);
      el.innerHTML = `
        <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer animate-pulse"
             style="background-color: ${color}"
             title="${issue.title} (${issue.recurrence} reports)">
          <span class="text-white text-sm font-bold">${issue.recurrence}</span>
        </div>
      `;
      
      // Issues don't have direct location, use first report's location or center
      // For demo, offset from center
      const offset = (index * 0.01) - 0.02;
      new maplibregl.Marker(el)
        .setLngLat([center[0] + offset, center[1] + offset])
        .addTo(map);
      
      el.addEventListener('click', () => {
        if (onMarkerClick) onMarkerClick(issue, 'issue');
      });
    });

    // Add project markers
    projects.forEach((project, index) => {
      const el = document.createElement('div');
      el.innerHTML = `
        <div class="w-6 h-6 rounded-lg border-2 border-white shadow-lg flex items-center justify-center cursor-pointer bg-blue-600"
             title="${project.name} - ${project.current_status}">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      `;
      
      const offset = (index * 0.015) - 0.01;
      new maplibregl.Marker(el)
        .setLngLat([center[0] + offset + 0.02, center[1] + offset - 0.01])
        .addTo(map);
      
      el.addEventListener('click', () => {
        if (onMarkerClick) onMarkerClick(project, 'project');
      });
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#991b1b';
      case 'high': return '#ef4444';
      case 'moderate': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const flyTo = (lngLat: [number, number], zoomLevel = 15) => {
    mapRef.current?.flyTo({ center: lngLat, zoom: zoomLevel, duration: 1000 });
  };

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapContainerRef} 
        className="w-full h-full" 
        style={{ minHeight: '400px' }}
      />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}
    </div>
  );
}