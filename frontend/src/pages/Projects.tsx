import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FolderGit2,
} from 'lucide-react';
import apiClient from '../lib/api';
import { ProjectListItem } from '../types';
import RiskBadge from '../components/risk/RiskBadge';
import RiskBar from '../components/risk/RiskBar';

export const Projects: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [stateFilter, setStateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [riskBandFilter, setRiskBandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('risk_score_desc');

  const navigate = useNavigate();

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        page_size: pageSize,
        sort_by: sortBy,
      };
      if (search) params.search = search;
      if (stateFilter) params.state = stateFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (riskBandFilter) params.risk_band = riskBandFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await apiClient.get('/projects', { params });
      setProjects(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, sortBy, stateFilter, categoryFilter, riskBandFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProjects();
  };

  const clearFilters = () => {
    setSearch('');
    setStateFilter('');
    setCategoryFilter('');
    setRiskBandFilter('');
    setStatusFilter('');
    setSortBy('risk_score_desc');
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E3E6EA]">
        <div>
          <h1 className="text-xl font-bold text-[#1A1D22] flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-[#1B4F8C]" />
            MPLADS Projects Directory
          </h1>
          <p className="text-xs text-[#5B6270] mt-0.5">
            Comprehensive audit registry with multi-detector risk scoring and physical milestone tracking.
          </p>
        </div>

        <div className="text-xs text-[#5B6270] font-medium bg-white px-3 py-1.5 rounded border border-[#E3E6EA] shadow-sm tabular-nums">
          Showing <span className="font-bold text-[#1A1D22]">{projects.length}</span> of{' '}
          <span className="font-bold text-[#1A1D22]">{total.toLocaleString()}</span> projects
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded border border-[#E3E6EA] shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="md:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-[#8A92A0] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, title, description..."
              className="w-full bg-[#F7F8FA] border border-[#E3E6EA] rounded pl-8 pr-3 py-1.5 text-xs text-[#1A1D22] focus:outline-none focus:border-[#1B4F8C] focus:bg-white"
            />
          </form>

          {/* State Filter */}
          <div>
            <select
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#F7F8FA] border border-[#E3E6EA] rounded px-2.5 py-1.5 text-xs text-[#1A1D22] focus:outline-none focus:border-[#1B4F8C]"
            >
              <option value="">All States</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Rajasthan">Rajasthan</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Assam">Assam</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#F7F8FA] border border-[#E3E6EA] rounded px-2.5 py-1.5 text-xs text-[#1A1D22] focus:outline-none focus:border-[#1B4F8C]"
            >
              <option value="">All Categories</option>
              <option value="Road Construction">Road Construction</option>
              <option value="School Infrastructure">School Infrastructure</option>
              <option value="Community Hall">Community Hall</option>
              <option value="Drinking Water & Sanitation">Drinking Water</option>
              <option value="Drainage & Flood Mitigation">Drainage</option>
              <option value="Health Sub-center">Health Sub-center</option>
              <option value="Sports Facility & Youth Center">Sports Facility</option>
              <option value="Solar & Street Lighting">Solar Lighting</option>
            </select>
          </div>

          {/* Risk Band Filter */}
          <div>
            <select
              value={riskBandFilter}
              onChange={(e) => {
                setRiskBandFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#F7F8FA] border border-[#E3E6EA] rounded px-2.5 py-1.5 text-xs text-[#1A1D22] focus:outline-none focus:border-[#1B4F8C]"
            >
              <option value="">All Risk Bands</option>
              <option value="Critical">● Critical (85-100)</option>
              <option value="High">● High (65-84)</option>
              <option value="Medium">● Medium (40-64)</option>
              <option value="Low">● Low (0-39)</option>
            </select>
          </div>

          {/* Sort Control */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-[#F7F8FA] border border-[#E3E6EA] rounded px-2.5 py-1.5 text-xs text-[#1A1D22] focus:outline-none focus:border-[#1B4F8C] font-medium"
            >
              <option value="risk_score_desc">Sort: Risk (Highest First)</option>
              <option value="risk_score_asc">Sort: Risk (Lowest First)</option>
              <option value="cost_desc">Sort: Cost (High to Low)</option>
              <option value="cost_asc">Sort: Cost (Low to High)</option>
              <option value="date_desc">Sort: Sanction Date (Newest)</option>
              <option value="date_asc">Sort: Sanction Date (Oldest)</option>
            </select>
          </div>
        </div>

        {(search || stateFilter || categoryFilter || riskBandFilter || statusFilter) && (
          <div className="flex items-center justify-between pt-2 border-t border-[#EEF0F3] text-xs">
            <span className="text-[#5B6270]">Active filters applied</span>
            <button
              onClick={clearFilters}
              className="text-[#B3261E] hover:underline font-medium"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded border border-[#E3E6EA] shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-xs text-[#5B6270]">
            <RefreshCw className="w-4 h-4 animate-spin mr-2 text-[#1B4F8C]" />
            Loading registry records...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8A92A0]">
            No projects match the current filter criteria. Try broadening your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8FA] border-b border-[#E3E6EA] text-[#5B6270] font-semibold sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Project Code & Title</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5">State · District</th>
                  <th className="px-3 py-2.5">Sanctioned</th>
                  <th className="px-3 py-2.5">Sanction Date</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Risk Level</th>
                  <th className="px-3 py-2.5 w-40">Detector Weights</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E6EA]">
                {projects.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="hover:bg-[#F7F8FA] transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-[#1B4F8C] text-[11px] group-hover:underline">
                        {p.project_code}
                      </div>
                      <div className="font-medium text-[#1A1D22] line-clamp-1 max-w-sm">{p.title}</div>
                      {p.contractor_name && (
                        <div className="text-[10px] text-[#8A92A0] truncate">Contractor: {p.contractor_name}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[#5B6270] whitespace-nowrap">{p.category}</td>
                    <td className="px-3 py-3 text-[#5B6270] whitespace-nowrap">
                      <div>{p.state_name}</div>
                      <div className="text-[10px] text-[#8A92A0]">{p.district_name}</div>
                    </td>
                    <td className="px-3 py-3 font-mono text-[#1A1D22] tabular-nums font-medium whitespace-nowrap">
                      ₹{(p.sanctioned_cost / 100000).toFixed(1)}L
                    </td>
                    <td className="px-3 py-3 text-[#5B6270] font-mono text-[11px] whitespace-nowrap">
                      {p.sanction_date}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          p.status === 'Completed'
                            ? 'bg-[#EAF5EC] text-[#2E7D46]'
                            : p.status === 'Stalled'
                            ? 'bg-[#FCE8E6] text-[#B3261E]'
                            : 'bg-[#E8F0FA] text-[#1B4F8C]'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <RiskBadge band={p.risk_band} score={p.current_risk_score} size="sm" />
                    </td>
                    <td className="px-3 py-3">
                      <RiskBar subscores={p.subscores} totalScore={p.current_risk_score} height="sm" />
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projects/${p.id}`);
                        }}
                        className="p-1 text-[#5B6270] hover:text-[#1B4F8C] rounded hover:bg-[#E8F0FA]"
                        title="View Full Breakdown"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-3 bg-[#F7F8FA] border-t border-[#E3E6EA] flex items-center justify-between text-xs text-[#5B6270]">
          <div>
            Page <span className="font-semibold text-[#1A1D22]">{page}</span> of{' '}
            <span className="font-semibold text-[#1A1D22]">{totalPages}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-2.5 py-1 rounded bg-white border border-[#E3E6EA] hover:bg-[#F0F2F5] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="px-2.5 py-1 rounded bg-white border border-[#E3E6EA] hover:bg-[#F0F2F5] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;
