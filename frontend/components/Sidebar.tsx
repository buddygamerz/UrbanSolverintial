'use client';

import { Report, Issue, Project } from '@/lib/api';
import ReportCard from './ReportCard';
import { MapPin, Filter, X, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  reports: Report[];
  issues: Issue[];
  projects: Project[];
  selectedItem?: Report | Issue | Project;
  selectedType?: 'report' | 'issue' | 'project';
  onSelectItem: (item: Report | Issue | Project, type: 'report' | 'issue' | 'project') => void;
  onClose: () => void;
  onFilterChange: (filters: { category?: string; severity?: string; status?: string }) => void;
}

export default function Sidebar({
  reports,
  issues,
  projects,
  selectedItem,
  selectedType,
  onSelectItem,
  onClose,
  onFilterChange,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'reports' | 'issues' | 'projects'>('reports');
  const [filters, setFilters] = useState({ category: '', severity: '', status: '' });
  const [showFilters, setShowFilters] = useState(false);

  const filteredReports = reports.filter(r => {
    if (filters.category && r.category !== filters.category) return false;
    if (filters.severity && r.severity !== filters.severity) return false;
    return true;
  });

  const filteredIssues = issues.filter(i => {
    if (filters.category && i.category !== filters.category) return false;
    if (filters.severity && i.severity !== filters.severity) return false;
    if (filters.status && i.status !== filters.status) return false;
    return true;
  });

  const filteredProjects = projects.filter(p => {
    if (filters.status && p.current_status !== filters.status) return false;
    return true;
  });

  const categories = ['pothole', 'waterlogging', 'congestion', 'footpath', 'drainage', 'traffic_signal', 'construction', 'road_damage', 'accessibility', 'garbage', 'other'];
  const severities = ['low', 'moderate', 'high', 'critical'];
  const statuses = ['open', 'in_progress', 'resolved', 'verified', 'rejected', 'planning', 'underway', 'completed'];

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">Explore</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {activeTab === 'reports' && `${filteredReports.length} reports`}
              {activeTab === 'issues' && `${filteredIssues.length} issues`}
              {activeTab === 'projects' && `${filteredProjects.length} projects`}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 px-4">
        {[
          { id: 'reports', label: 'Reports', icon: MapPin },
          { id: 'issues', label: 'Issues', icon: Filter },
          { id: 'projects', label: 'Projects', icon: Building2 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'text-primary-600 border-primary-600'
                : 'text-gray-500 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className={`p-4 border-b border-gray-200 dark:border-gray-700 transition-all ${showFilters ? '' : 'hidden'}`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">Filters</h4>
          <button onClick={() => setShowFilters(false)} className="text-sm text-primary-600">Hide</button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <select
            value={filters.category}
            onChange={e => handleFilterChange('category', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
            ))}
          </select>
          <select
            value={filters.severity}
            onChange={e => handleFilterChange('severity', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="">All Severities</option>
            {severities.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={e => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="">All Statuses</option>
            {statuses.map(s => (
              <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
            ))}
          </select>
        </div>
        {(filters.category || filters.severity || filters.status) && (
          <button
            onClick={() => {
              setFilters({ category: '', severity: '', status: '' });
              onFilterChange({ category: '', severity: '', status: '' });
            }}
            className="mt-3 text-sm text-primary-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2 border-t border-gray-200 dark:border-gray-700"
      >
        <Layers className="h-4 w-4" />
        {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        Filters
      </button>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'reports' && (
          <>
            {filteredReports.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No reports found
              </div>
            ) : (
              filteredReports.map(report => (
                <ReportCard
                  key={report.id}
                  item={report}
                  type="report"
                  onClick={() => onSelectItem(report, 'report')}
                />
              ))
            )}
          </>
        )}

        {activeTab === 'issues' && (
          <>
            {filteredIssues.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No issues found
              </div>
            ) : (
              filteredIssues.map(issue => (
                <ReportCard
                  key={issue.id}
                  item={issue}
                  type="issue"
                  onClick={() => onSelectItem(issue, 'issue')}
                />
              ))
            )}
          </>
        )}

        {activeTab === 'projects' && (
          <>
            {filteredProjects.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No projects found
              </div>
            ) : (
              filteredProjects.map(project => (
                <ReportCard
                  key={project.id}
                  item={project}
                  type="project"
                  onClick={() => onSelectItem(project, 'project')}
                />
              ))
            )}
          </>
        )}
      </div>

      {/* Selected Item Detail */}
      {selectedItem && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
          <h4 className="font-medium mb-3">Details</h4>
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
            {selectedType === 'report' && (
              <>
                <p><strong>Category:</strong> {selectedItem.category.replace('_', ' ')}</p>
                <p><strong>Severity:</strong> {selectedItem.severity}</p>
                <p><strong>Location:</strong> {selectedItem.location.address || 'Unknown'}</p>
                <p className="mt-2">{selectedItem.description}</p>
              </>
            )}
            {selectedType === 'issue' && (
              <>
                <p><strong>Title:</strong> {selectedItem.title}</p>
                <p><strong>Reports:</strong> {selectedItem.recurrence}</p>
                <p><strong>Priority:</strong> {selectedItem.priority_score?.toFixed(1) || 'N/A'}</p>
                <p className="mt-2">{selectedItem.description}</p>
              </>
            )}
            {selectedType === 'project' && (
              <>
                <p><strong>Authority:</strong> {selectedItem.authority}</p>
                <p><strong>Status:</strong> {selectedItem.current_status}</p>
                {selectedItem.stated_objective && (
                  <p className="mt-2">{selectedItem.stated_objective}</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}