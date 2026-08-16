const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Report {
  id: string;
  category: string;
  severity: string;
  description: string;
  impact_description?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    ward?: string;
    locality?: string;
  };
  created_at: string;
  status: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  priority_score?: number;
  status: string;
  recurrence: number;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  authority: string;
  current_status: string;
  stated_objective?: string;
}

export interface ReportCreate {
  latitude: number;
  longitude: number;
  category: string;
  severity: string;
  description: string;
  impact_description?: string;
  photos?: string[];
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  reports: {
    list: (skip = 0, limit = 100) => 
      fetchApi<Report[]>(`/reports/?skip=${skip}&limit=${limit}`),
    get: (id: string) => fetchApi<Report>(`/reports/${id}`),
    create: (data: ReportCreate) => fetchApi<Report>('/reports/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },
  issues: {
    list: (skip = 0, limit = 100) => 
      fetchApi<Issue[]>(`/issues/?skip=${skip}&limit=${limit}`),
    get: (id: string) => fetchApi<Issue>(`/issues/${id}`),
  },
  projects: {
    list: (skip = 0, limit = 100) => 
      fetchApi<Project[]>(`/projects/?skip=${skip}&limit=${limit}`),
    get: (id: string) => fetchApi<Project>(`/projects/${id}`),
  },
  ai: {
    analyzeImage: (imageBase64: string) => fetchApi<any>('/ai/analyze-image', {
      method: 'POST',
      body: JSON.stringify({ image_base64: imageBase64 }),
    }),
    classifyReport: (text: string, imageAnalysis?: any) => fetchApi<any>('/ai/classify-report', {
      method: 'POST',
      body: JSON.stringify({ text, image_analysis: imageAnalysis }),
    }),
    analyzeProjectImpact: (project: any, nearbyIssues: any[]) => fetchApi<any>('/ai/analyze-project-impact', {
      method: 'POST',
      body: JSON.stringify({ project, nearby_issues: nearbyIssues }),
    }),
    generateRecommendations: (issue: any, context: any) => fetchApi<any>('/ai/generate-recommendations', {
      method: 'POST',
      body: JSON.stringify({ issue, context }),
    }),
    ragQuery: (question: string, topK = 5) => fetchApi<any>('/ai/rag/query', {
      method: 'POST',
      body: JSON.stringify({ question, top_k: topK }),
    }),
  },
};

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#991b1b';
    case 'high': return '#ef4444';
    case 'moderate': return '#f59e0b';
    case 'low': return '#22c55e';
    default: return '#6b7280';
  }
}

export function getSeverityLabel(severity: string): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}