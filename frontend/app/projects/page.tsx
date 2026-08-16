'use client';

import { useState, useEffect } from 'react';
import { Project } from '@/lib/api';
import { api } from '@/lib/api';
import { Building2, FileText, MapPin, Clock, AlertCircle, CheckCircle, ExternalLink, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate, getSeverityColor } from '@/lib/api';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await api.projects.list(0, 100);
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const statuses = ['planning', 'underway', 'completed', 'on_hold', 'cancelled'];
  const filteredProjects = filterStatus 
    ? projects.filter(p => p.current_status === filterStatus)
    : projects;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'underway': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'planning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'on_hold': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatStatus = (status: string) => 
    status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a href="/" className="flex items-center gap-2">
                <Building2 className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">UrbanSolver</span>
              </a>
              <nav className="hidden md:flex items-center gap-6">
                <a href="/" className="text-gray-600 dark:text-gray-300 hover:text-primary-600">Home</a>
                <a href="/explore" className="text-gray-600 dark:text-gray-300 hover:text-primary-600">Explore</a>
                <a href="/report" className="text-gray-600 dark:text-gray-300 hover:text-primary-600">Report</a>
                <a href="/projects" className="text-primary-600 font-medium">Projects</a>
              </nav>
            </div>
            <a
              href="/report"
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Report Issue
            </a>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Government Projects</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Track infrastructure projects, their stated objectives, and impact on civic issues.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Status:</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="">All Statuses</option>
              {statuses.map(s => (
                <option key={s} value={s}>{formatStatus(s)}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchProjects}
            disabled={loading}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                Refreshing...
              </>
            ) : (
              <>
                <Loading className="h-4 w-4 inline mr-2" />
                Refresh
              </>
            )}
          </button>
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No projects found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                isExpanded={expandedProject === project.id}
                onToggle={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                getStatusColor={getStatusColor}
                formatStatus={formatStatus}
              />
            ))}
          </div>
        )}

        {/* Stats Summary */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Projects"
            value={projects.length}
            icon={Building2}
            color="blue"
          />
          <StatCard
            title="Underway"
            value={projects.filter(p => p.current_status === 'underway').length}
            icon={AlertCircle}
            color="yellow"
          />
          <StatCard
            title="Completed"
            value={projects.filter(p => p.current_status === 'completed').length}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Planning"
            value={projects.filter(p => p.current_status === 'planning').length}
            icon={FileText}
            color="purple"
          />
        </div>
      </main>
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  isExpanded: boolean;
  onToggle: () => void;
  getStatusColor: (status: string) => string;
  formatStatus: (status: string) => string;
}

function ProjectCard({ project, isExpanded, onToggle, getStatusColor, formatStatus }: ProjectCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{project.name}</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-3">{project.authority}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(project.current_status)}`}>
                {formatStatus(project.current_status)}
              </span>
              {project.department && (
                <span className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full">
                  {project.department}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
            {project.stated_objective && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Stated Objective</h4>
                <p className="text-gray-600 dark:text-gray-300">{project.stated_objective}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {project.contractor && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Contractor</p>
                  <p className="font-medium text-gray-900 dark:text-white">{project.contractor}</p>
                </div>
              )}
              {project.estimated_cost && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Estimated Cost</p>
                  <p className="font-medium text-gray-900 dark:text-white">₹{project.estimated_cost.toLocaleString()}</p>
                </div>
              )}
              {project.start_date && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Start Date</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(project.start_date)}</p>
                </div>
              )}
              {project.expected_completion && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Expected Completion</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(project.expected_completion)}</p>
                </div>
              )}
              {project.current_status && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Current Status</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatStatus(project.current_status)}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <ExternalLink className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">View project details and impact analysis</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'yellow' | 'green' | 'purple';
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

// Need to import Loading icon
const Loading = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);