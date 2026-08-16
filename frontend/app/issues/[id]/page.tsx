'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Issue } from '@/lib/api';
import { api } from '@/lib/api';
import { formatDate, getSeverityColor } from '@/lib/api';
import { MapPin, AlertCircle, Users, Clock, TrendingUp, FileText, Building2, ExternalLink, Loader2, ArrowLeft, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function IssueDetailPage() {
  const params = useParams();
  const issueId = params.id as string;
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIssue();
  }, [issueId]);

  const fetchIssue = async () => {
    setLoading(true);
    try {
      const data = await api.issues.get(issueId);
      setIssue(data);
    } catch (err) {
      setError('Failed to load issue');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Issue not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{error || 'The issue you\'re looking for doesn\'t exist.'}</p>
          <Link href="/explore" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <ArrowLeft className="h-4 w-4" />
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const severity = issue.severity;
  const color = getSeverityColor(severity);
  const statusColors = {
    open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    verified: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/explore" className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <Link href="/" className="flex items-center gap-2">
                <AlertCircle className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">UrbanSolver</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[issue.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                {issue.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Meta */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                  <AlertCircle className="h-7 w-7" style={{ color }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{issue.title}</h1>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {issue.recurrence} reports
                    </span>
                    {issue.priority_score && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        Priority: {issue.priority_score.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">{issue.description}</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary-600" />
                Timeline
              </h2>
              <div className="space-y-4">
                <TimelineItem
                  date={issue.created_at}
                  title="Issue Created"
                  description={`Clustered from ${issue.recurrence} citizen reports`}
                  icon={AlertCircle}
                  color="blue"
                />
                {issue.status !== 'open' && (
                  <TimelineItem
                    date={issue.updated_at}
                    title={`Status: ${issue.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
                    description="Status updated by system"
                    icon={issue.status === 'resolved' || issue.status === 'verified' ? CheckCircle : AlertTriangle}
                    color={issue.status === 'resolved' || issue.status === 'verified' ? 'green' : 'yellow'}
                  />
                )}
              </div>
            </div>

            {/* Related Projects */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary-600" />
                Related Projects
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No projects directly linked to this issue yet. Projects within 1km will appear here.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Issue Info Card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 sticky top-24">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Issue Details</h3>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Category</dt>
                  <dd className="font-medium text-gray-900 dark:text-white capitalize">{issue.category.replace('_', ' ')}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Severity</dt>
                  <dd className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs font-medium rounded-full text-white" style={{ backgroundColor: color }}>
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Reports</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{issue.recurrence} citizen reports</dd>
                </div>
                {issue.priority_score && (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Priority Score</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{issue.priority_score.toFixed(1)} / 100</dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Status</dt>
                  <dd className="font-medium text-gray-900 dark:text-white capitalize">{issue.status.replace('_', ' ')}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Created</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{formatDate(issue.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Last Updated</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{formatDate(issue.updated_at)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Issue ID</dt>
                  <dd className="font-mono text-xs text-gray-600 dark:text-gray-400 break-all">{issue.id}</dd>
                </div>
              </dl>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Take Action</h3>
              <div className="space-y-3">
                <a
                  href={`/explore?issue=${issue.id}`}
                  className="w-full px-4 py-2 bg-primary-600 text-white text-center rounded-lg hover:bg-primary-700 transition-colors"
                >
                  View on Map
                </a>
                <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Follow for Updates
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Share Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

interface TimelineItemProps {
  date: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'yellow' | 'red';
}

function TimelineItem({ date, title, description, icon: Icon, color }: TimelineItemProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2" />
      </div>
      <div className="flex-1 pt-1">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
          <time className="text-sm text-gray-500 dark:text-gray-400">{formatDate(date)}</time>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{description}</p>
      </div>
    </div>
  );
}