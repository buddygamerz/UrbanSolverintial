'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Link from 'next/link';
import { MapPin, AlertCircle, FileText, Building2, ArrowRight, Menu, X, Map } from 'lucide-react';

const CITIES = [
  { name: 'Bengaluru', center: [77.5946, 12.9716], zoom: 11 },
  { name: 'Mumbai', center: [72.8777, 19.0760], zoom: 11 },
  { name: 'Delhi', center: [77.2090, 28.6139], zoom: 11 },
  { name: 'Hyderabad', center: [78.4867, 17.3850], zoom: 11 },
  { name: 'Chennai', center: [80.2707, 13.0827], zoom: 11 },
];

export default function HomePage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://demotiles.maplibre.org/style.json',
        center: selectedCity.center,
        zoom: selectedCity.zoom,
      });

      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      mapRef.current = map;

      // Add demo markers
      addDemoMarkers(map);
    }
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: selectedCity.center,
        zoom: selectedCity.zoom,
        duration: 1000,
      });
    }
  }, [selectedCity]);

  const addDemoMarkers = (map: maplibregl.Map) => {
    // Demo data for Bengaluru
    const demoIssues = [
      { coords: [77.5946, 12.9716], category: 'waterlogging', severity: 'critical', title: 'Severe Waterlogging at Majestic' },
      { coords: [77.6046, 12.9616], category: 'pothole', severity: 'high', title: 'Large Pothole on MG Road' },
      { coords: [77.5846, 12.9816], category: 'footpath', severity: 'moderate', title: 'Broken Footpath near Cubbon Park' },
      { coords: [77.6146, 12.9516], category: 'traffic', severity: 'high', title: 'Congestion at Silk Board Junction' },
      { coords: [77.5746, 12.9916], category: 'drainage', severity: 'moderate', title: 'Blocked Drain in Koramangala' },
    ];

    demoIssues.forEach((issue, index) => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.innerHTML = `
        <div class="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
             style="background-color: ${getSeverityColor(issue.severity)}"
             title="${issue.title}">
          <span class="text-white text-xs font-bold">${index + 1}</span>
        </div>
      `;

      new maplibregl.Marker(el)
        .setLngLat(issue.coords)
        .addTo(map);
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">UrbanSolver</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#explore" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Explore Cities
              </Link>
              <Link href="#report" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Report Problem
              </Link>
              <Link href="#projects" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Projects
              </Link>
              <Link href="#dashboard" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Dashboard
              </Link>
            </nav>

            {/* Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <select
                value={selectedCity.name}
                onChange={(e) => setSelectedCity(CITIES.find(c => c.name === e.target.value) || CITIES[0])}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {CITIES.map(city => (
                  <option key={city.name} value={city.name}>{city.name}</option>
                ))}
              </select>
              <Link
                href="#report"
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Report Issue
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-600 dark:text-gray-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
              <nav className="flex flex-col space-y-4">
                <Link href="#explore" className="text-gray-600 dark:text-gray-300">Explore Cities</Link>
                <Link href="#report" className="text-gray-600 dark:text-gray-300">Report Problem</Link>
                <Link href="#projects" className="text-gray-600 dark:text-gray-300">Projects</Link>
                <Link href="#dashboard" className="text-gray-600 dark:text-gray-300">Dashboard</Link>
                <div className="flex items-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <select
                    value={selectedCity.name}
                    onChange={(e) => setSelectedCity(CITIES.find(c => c.name === e.target.value) || CITIES[0])}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  >
                    {CITIES.map(city => (
                      <option key={city.name} value={city.name}>{city.name}</option>
                    ))}
                  </select>
                </div>
                <Link
                  href="#report"
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg text-center"
                >
                  Report Issue
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                See the problem. Understand the cause. Demand the fix.
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
                UrbanSolver turns everyday civic problems into evidence-backed public issues with transparent accountability.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="#explore"
                  className="px-8 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-lg"
                >
                  Explore a City
                  <ArrowRight className="ml-2 h-5 w-5 inline-block" />
                </Link>
                <Link
                  href="#report"
                  className="px-8 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-lg"
                >
                  Report a Problem
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section id="explore" className="relative h-[60vh] min-h-[400px]">
          <div className="absolute inset-0" ref={mapContainerRef} />
          
          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Issue Severity</h3>
            <div className="flex flex-col gap-2">
              {[
                { color: '#991b1b', label: 'Critical' },
                { color: '#ef4444', label: 'High' },
                { color: '#f59e0b', label: 'Moderate' },
                { color: '#22c55e', label: 'Low' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white shadow" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* City Selector on Map */}
          <div className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select City</label>
            <select
              value={selectedCity.name}
              onChange={(e) => setSelectedCity(CITIES.find(c => c.name === e.target.value) || CITIES[0])}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
            >
              {CITIES.map(city => (
                <option key={city.name} value={city.name}>{city.name}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">Take Action</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Link
                href="#report"
                className="group p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <MapPin className="h-6 w-6 text-primary-600 dark:text-primary-400 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Report a Problem</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Submit a photo and location of any civic issue. Our AI will analyze and categorize it automatically.
                </p>
              </Link>

              <Link
                href="#explore"
                className="group p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <Map className="h-6 w-6 text-green-600 dark:text-green-400 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Explore Issues</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Browse the interactive map to see reported problems, government projects, and infrastructure health.
                </p>
              </Link>

              <Link
                href="#projects"
                className="group p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Track Projects</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Monitor government infrastructure projects, their stated objectives, and actual impact on reported issues.
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">12,847</div>
                <div className="text-gray-600 dark:text-gray-400 mt-1">Issues Reported</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 dark:text-green-400">3,241</div>
                <div className="text-gray-600 dark:text-gray-400 mt-1">Issues Resolved</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">156</div>
                <div className="text-gray-600 dark:text-gray-400 mt-1">Active Projects</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">8,932</div>
                <div className="text-gray-600 dark:text-gray-400 mt-1">Active Citizens</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="h-8 w-8 text-primary-400" />
                <span className="text-xl font-bold text-white">UrbanSolver</span>
              </div>
              <p className="text-sm">
                Evidence-based civic infrastructure intelligence platform. Turning observations into accountability.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Explore Cities</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Report Issues</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Track Projects</a></li>
                <li><a href="#" className="hover:text-white transition-colors">City Dashboard</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Data Sources</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Methodology</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Data Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>Built with transparency. Data from citizens, OpenStreetMap, and public government sources.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}