'use client';

import { useState, useEffect, useRef } from 'react';
import Map from '@/components/Map';
import Sidebar from '@/components/Sidebar';
import { Report, Issue, Project } from '@/lib/api';
import { api } from '@/lib/api';
import { MapPin, Filter, Building2, Search, Loader2, RefreshCw, Map as MapIcon } from 'lucide-react';

const CITIES = [
  { name: 'Bengaluru', center: [77.5946, 12.9716] as [number, number], zoom: 11 },
  { name: 'Mumbai', center: [72.8777, 19.0760] as [number, number], zoom: 11 },
  { name: 'Delhi', center: [77.2090, 28.6139] as [number, number], zoom: 11 },
  { name: 'Hyderabad', center: [78.4867, 17.3850] as [number, number], zoom: 11 },
  { name: 'Chennai', center: [80.2707, 13.0827] as [number, number], zoom: 11 },
];

export default function ExplorePage() {
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [reports, setReports] = useState<Report[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Report | Issue | Project | null>(null);
  const [selectedType, setSelectedType] = useState<'report' | 'issue' | 'project' | null>(null);
  const [filters, setFilters] = useState({ category: '', severity: '', status: '' });
  const mapRef = useRef<React.RefObject<any>>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportsData, issuesData, projectsData] = await Promise.all([
        api.reports.list(0, 100),
        api.issues.list(0, 100),
        api.projects.list(0, 100),
      ]);
      setReports(reportsData);
      setIssues(issuesData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // In a real app, filter by city bounds
    fetchData();
  }, [selectedCity]);

  const handleMarkerClick = (item: Report | Issue | Project, type: 'report' | 'issue' | 'project') => {
    setSelectedItem(item);
    setSelectedType(type);
    setSidebarOpen(true);
  };

  const handleSelectItem = (item: Report | Issue | Project, type: 'report' | 'issue' | 'project') => {
    setSelectedItem(item);
    setSelectedType(type);
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSelectedItem(null);
    setSelectedType(null);
  };

  const handleFilterChange = (newFilters: { category: string; severity: string; status: string }) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a href="/" className="flex items-center gap-2">
                <MapPin className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">UrbanSolver</span>
              </a>
              <nav className="hidden md:flex items-center gap-6">
                <a href="/" className="text-gray-600 dark:text-gray-300 hover:text-primary-600">Home</a>
                <a href="/explore" className="text-primary-600 font-medium">Explore</a>
                <a href="/report" className="text-gray-600 dark:text-gray-300 hover:text-primary-600">Report</a>
                <a href="/projects" className="text-gray-600 dark:text-gray-300 hover:text-primary-600">Projects</a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedCity.name}
                onChange={e => setSelectedCity(CITIES.find(c => c.name === e.target.value) || CITIES[0])}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {CITIES.map(city => (
                  <option key={city.name} value={city.name}>{city.name}</option>
                ))}
              </select>
              <a
                href="/report"
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors hidden sm:inline-flex"
              >
                Report Issue
              </a>
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 text-gray-600 dark:text-gray-300"
              >
                <Filter className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Map Area */}
      <div className="relative flex-1">
        <Map
          ref={mapRef}
          center={selectedCity.center}
          zoom={selectedCity.zoom}
          reports={reports}
          issues={issues}
          projects={projects}
          onMarkerClick={handleMarkerClick}
        />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
              <p className="text-gray-600 dark:text-gray-300">Loading civic data...</p>
            </div>
          </div>
        )}

        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button
            onClick={() => {
              // Fly to city center
            }}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Center on city"
          >
            <MapIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={loading ? 'h-5 w-5 animate-spin text-gray-700' : 'h-5 w-5 text-gray-700 dark:text-gray-300'} />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Layers</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-white shadow" style={{ backgroundColor: '#991b1b' }} />
              <span className="text-gray-700 dark:text-gray-300">Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-white shadow" style={{ backgroundColor: '#ef4444' }} />
              <span className="text-gray-700 dark:text-gray-300">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-white shadow" style={{ backgroundColor: '#f59e0b' }} />
              <span className="text-gray-700 dark:text-gray-300">Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-white shadow" style={{ backgroundColor: '#22c55e' }} />
              <span className="text-gray-700 dark:text-gray-300">Low</span>
            </div>
            <div className="flex items-center gap-2 border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <div className="w-4 h-4 rounded-lg border-2 border-white shadow bg-blue-600" />
              <span className="text-gray-700 dark:text-gray-300">Projects</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={handleCloseSidebar}
          />
          <Sidebar
            reports={reports}
            issues={issues}
            projects={projects}
            selectedItem={selectedItem}
            selectedType={selectedType}
            onSelectItem={handleSelectItem}
            onClose={handleCloseSidebar}
            onFilterChange={handleFilterChange}
          />
        </>
      )}
    </div>
  );
}