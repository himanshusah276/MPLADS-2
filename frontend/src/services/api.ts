import { 
  DashboardKPIs, 
  DistrictRiskSummary, 
  MP, 
  Work, 
  AnomalyAlert, 
  ImplementingAgency, 
  PreCheckWorkResponse,
  UserProfile,
  TokenResponse,
  DigiGovSummary,
  DigiGovMPRecord
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Simple in-memory response cache with TTL (15 seconds)
const cache = new Map<string, { data: any; expiry: number }>();

function getCached<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key: string, data: any, ttlMs: number = 15000) {
  cache.set(key, { data, expiry: Date.now() + ttlMs });
}

export function clearApiCache() {
  cache.clear();
}

async function fetchJSON<T>(endpoint: string, options?: RequestInit, useCache: boolean = false): Promise<T> {
  const cacheKey = `${endpoint}_${JSON.stringify(options || {})}`;
  if (useCache && (!options || !options.method || options.method === 'GET')) {
    const cached = getCached<T>(cacheKey);
    if (cached !== null) return cached;
  }

  const token = localStorage.getItem('mplads_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options?.headers }
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `API Error ${res.status}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.detail) errorMsg = typeof parsed.detail === 'string' ? parsed.detail : JSON.stringify(parsed.detail);
      } catch {
        if (errText) errorMsg = errText;
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    if (useCache) setCached(cacheKey, data);
    return data;
  } catch (err: any) {
    // Graceful error logging
    console.warn(`[API] Failed fetch to ${endpoint}:`, err.message || err);
    throw err;
  }
}

export const api = {
  // Authentication & Roles
  login: (username: string, password: string): Promise<TokenResponse> => {
    return fetchJSON<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  getMe: (): Promise<UserProfile> => {
    return fetchJSON<UserProfile>('/auth/me');
  },

  getDemoRoles: (): Promise<UserProfile[]> => {
    return fetchJSON<UserProfile[]>('/auth/demo-roles', undefined, true);
  },

  // KPIs & Stats
  getKPIs: (state?: string, financial_year?: string): Promise<DashboardKPIs> => {
    const params = new URLSearchParams();
    if (state && state !== 'All' && state !== 'All states') params.append('state', state);
    if (financial_year && financial_year !== 'All') params.append('financial_year', financial_year);
    return fetchJSON<DashboardKPIs>(`/stats/kpis?${params.toString()}`, undefined, true);
  },

  getDistrictsHeatmap: (state?: string): Promise<DistrictRiskSummary[]> => {
    const params = new URLSearchParams();
    if (state && state !== 'All' && state !== 'All states') params.append('state', state);
    return fetchJSON<DistrictRiskSummary[]>(`/stats/districts-heatmap?${params.toString()}`, undefined, true);
  },

  getHighestRiskMPs: (state?: string, limit: number = 10): Promise<any[]> => {
    const params = new URLSearchParams();
    if (state && state !== 'All' && state !== 'All states') params.append('state', state);
    params.append('limit', limit.toString());
    return fetchJSON<any[]>(`/stats/highest-risk-mps?${params.toString()}`, undefined, true);
  },

  getCategoryDistribution: (state?: string): Promise<{ category: string; works_count: number; total_amount_cr: number }[]> => {
    const params = new URLSearchParams();
    if (state && state !== 'All' && state !== 'All states') params.append('state', state);
    return fetchJSON<{ category: string; works_count: number; total_amount_cr: number }[]>(`/stats/category-distribution?${params.toString()}`, undefined, true);
  },

  // Alerts
  getAlerts: (severity?: string, status?: string, state?: string, district?: string): Promise<AnomalyAlert[]> => {
    const params = new URLSearchParams();
    if (severity && severity !== 'All' && severity !== 'All severities') params.append('severity', severity);
    if (status && status !== 'All') params.append('status', status);
    if (state && state !== 'All' && state !== 'All states') params.append('state', state);
    if (district && district !== 'All') params.append('district', district);
    params.append('limit', '300');
    return fetchJSON<AnomalyAlert[]>(`/alerts?${params.toString()}`);
  },

  getAlertDetail: (alert_id: string): Promise<AnomalyAlert> => {
    return fetchJSON<AnomalyAlert>(`/alerts/${alert_id}`);
  },

  triageAlert: (alert_id: string, status: string, comment: string, reviewer_role: string = 'Auditor'): Promise<any> => {
    clearApiCache();
    return fetchJSON<any>(`/alerts/${alert_id}/triage`, {
      method: 'POST',
      body: JSON.stringify({ status, comment, reviewer_role })
    });
  },

  // Works
  getWorks: (filters?: { state?: string; district?: string; mp_id?: string; category?: string; status?: string; risk_band?: string; search?: string }): Promise<Work[]> => {
    const params = new URLSearchParams();
    if (filters?.state && filters.state !== 'All' && filters.state !== 'All states') params.append('state', filters.state);
    if (filters?.district && filters.district !== 'All') params.append('district', filters.district);
    if (filters?.mp_id && filters.mp_id !== 'All') params.append('mp_id', filters.mp_id);
    if (filters?.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters?.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters?.risk_band && filters.risk_band !== 'All' && filters.risk_band !== 'All severities') params.append('risk_band', filters.risk_band);
    if (filters?.search) params.append('search', filters.search);
    params.append('limit', '250');
    return fetchJSON<Work[]>(`/works?${params.toString()}`);
  },

  getWorkDetail: (work_id: string): Promise<{
    work: Work;
    mp: MP;
    agency: ImplementingAgency;
    releases: any[];
    alerts: AnomalyAlert[];
    timeline: any[];
    cost_analytics: any;
  }> => {
    return fetchJSON<{
      work: Work;
      mp: MP;
      agency: ImplementingAgency;
      releases: any[];
      alerts: AnomalyAlert[];
      timeline: any[];
      cost_analytics: any;
    }>(`/works/${work_id}`);
  },

  // MPs
  getMPs: (filters?: { state?: string; house?: string; risk_band?: string; search?: string }): Promise<MP[]> => {
    const params = new URLSearchParams();
    if (filters?.state && filters.state !== 'All' && filters.state !== 'All states') params.append('state', filters.state);
    if (filters?.house && filters.house !== 'All') params.append('house', filters.house);
    if (filters?.risk_band && filters.risk_band !== 'All' && filters.risk_band !== 'All severities') params.append('risk_band', filters.risk_band);
    if (filters?.search) params.append('search', filters.search);
    return fetchJSON<MP[]>(`/mps?${params.toString()}`, undefined, true);
  },

  getMPDossier: (mp_id: string): Promise<{
    mp: MP;
    works_count: number;
    works: Work[];
    ucs: any[];
    alerts: AnomalyAlert[];
    entitlement_summary: any;
  }> => {
    return fetchJSON<{
      mp: MP;
      works_count: number;
      works: Work[];
      ucs: any[];
      alerts: AnomalyAlert[];
      entitlement_summary: any;
    }>(`/mps/${mp_id}`);
  },

  preCheckWorkRecommendation: (payload: {
    mp_id: string;
    state: string;
    district: string;
    category: string;
    description: string;
    estimated_cost: number;
    implementing_agency_id?: string;
    is_outside_constituency: boolean;
  }): Promise<PreCheckWorkResponse> => {
    return fetchJSON<PreCheckWorkResponse>('/mps/pre-check-recommendation', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Agencies
  getAgencies: (filters?: { state?: string; district?: string; agency_type?: string; risk_band?: string; search?: string }): Promise<ImplementingAgency[]> => {
    const params = new URLSearchParams();
    if (filters?.state && filters.state !== 'All' && filters.state !== 'All states') params.append('state', filters.state);
    if (filters?.district && filters.district !== 'All') params.append('district', filters.district);
    if (filters?.agency_type && filters.agency_type !== 'All') params.append('agency_type', filters.agency_type);
    if (filters?.risk_band && filters.risk_band !== 'All' && filters.risk_band !== 'All severities') params.append('risk_band', filters.risk_band);
    if (filters?.search) params.append('search', filters.search);
    return fetchJSON<ImplementingAgency[]>(`/agencies?${params.toString()}`, undefined, true);
  },

  // DigiGov Portal Public APIs
  getDigiGovConstituencies: (): Promise<{ states: string[]; constituency_map: Record<string, string[]> }> => {
    return fetchJSON<{ states: string[]; constituency_map: Record<string, string[]> }>('/digigov/constituencies', undefined, true);
  },

  getDigiGovSummary: (tenure?: string, state?: string): Promise<DigiGovSummary> => {
    const params = new URLSearchParams();
    if (tenure && tenure !== 'All') params.append('tenure', tenure);
    if (state && state !== 'All' && state !== 'All states') params.append('state', state);
    return fetchJSON<DigiGovSummary>(`/digigov/summary?${params.toString()}`, undefined, true);
  },

  getDigiGovMPs: (params?: { tenure?: string; state?: string; constituency?: string; search?: string }): Promise<DigiGovMPRecord[]> => {
    const q = new URLSearchParams();
    if (params?.tenure && params.tenure !== 'All') q.append('tenure', params.tenure);
    if (params?.state && params.state !== 'All' && params.state !== 'All states') q.append('state', params.state);
    if (params?.constituency && params.constituency !== 'All') q.append('constituency', params.constituency);
    if (params?.search) q.append('search', params.search);
    return fetchJSON<DigiGovMPRecord[]>(`/digigov/mps?${q.toString()}`);
  },

  getDigiGovExportUrl: (): string => {
    return `${API_BASE}/digigov/export`;
  },

  // ML Analysis trigger
  runMLAnalysis: (): Promise<{
    status: string;
    total_alerts_generated: number;
    critical_count: number;
    high_count: number;
    analyzed_works_count: number;
    timestamp: string;
  }> => {
    clearApiCache();
    return fetchJSON<{
      status: string;
      total_alerts_generated: number;
      critical_count: number;
      high_count: number;
      analyzed_works_count: number;
      timestamp: string;
    }>('/ml/run-analysis', {
      method: 'POST'
    });
  },

  getMLMetrics: (): Promise<any> => {
    return fetchJSON<any>('/ml/metrics');
  }
};
