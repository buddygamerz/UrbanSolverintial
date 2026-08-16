'use client';

import { Report, Issue, Project } from '@/lib/api';
import { getSeverityColor, getSeverityLabel, formatDate } from '@/lib/api';
import { MapPin, Clock, AlertCircle, Users, FileText, Building2, ExternalLink } from 'lucide-react';

interface ReportCardProps {
  item: Report | Issue | Project;
  type: 'report' | 'issue' | 'project';
  onClick?: () => void;
}

export default function ReportCard({ item, type, onClick }: ReportCardProps) {
  const severity = 'severity' in item ? item.severity : 'moderate';
  const color = getSeverityColor(severity);
  const label = getSeverityLabel(severity);

  if (type === 'report') {
    const report = item as Report;
    return (
      <div 
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-start gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <AlertCircle className="h-5 w-5" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                {report.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h4>
              <span 
                className="px-2 py-1 text-xs font-medium rounded-full text-white flex-shrink-0"
                style={{ backgroundColor: color }}
              >
                {label}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
              {report.description}
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {report.location.address || `${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}`}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDate(report.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'issue') {
    const issue = item as Issue;
    return (
      <div 
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-start gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <Users className="h-5 w-5" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                {issue.title}
              </h4>
              <span 
                className="px-2 py-1 text-xs font-medium rounded-full text-white flex-shrink-0"
                style={{ backgroundColor: color }}
              >
                {label}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
              {issue.description}
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {issue.recurrence} reports
              </span>
              {issue.priority_score && (
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Priority: {issue.priority_score.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'project') {
    const project = item as Project;
    return (
      <div 
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {project.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {project.authority} • {project.current_status}
            </p>
            {project.stated_objective && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                {project.stated_objective}
              </p>
            )}
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {project.current_status}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}