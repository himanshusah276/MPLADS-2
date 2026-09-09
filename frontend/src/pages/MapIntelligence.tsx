import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Filter, Layers, Flame, ExternalLink, RefreshCw } from 'lucide-react';
import apiClient from '../lib/api';
import RiskBadge from '../components/risk/RiskBadge';

export const MapIntelligence: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [riskBandFilter, setRiskBandFilter] = useState('');
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const navigate = useNavigate();

  const fetchMapData = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { limit: 400 };
      if (stateFilter) params.state = stateFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (riskBandFilter) params.risk_band = riskBandFilter;

      const res = await apiClient.get('/map/projects', { params });
      setProjects(res.data.projects);
      if (res.data.projects.length > 0 && !selectedProject) {
        setSelectedProject(res.data.projects[0]);
      }
    } catch (err) {
      console.error('Failed to load map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, [stateFilter, categoryFilter, riskBandFilter]);

  // Dynamic Leaflet Map setup
  useEffect(() => {
    // Only run if window and leaflet are loaded
    const initLeaflet = async () => {
      const L = (await import('leaflet')).default;
      const container = document.getElementById('leaflet-map-container');
      if (!container) return;

      // Clean existing map instance if any
      (container as any)._leaflet_id = null;
      container.innerHTML = '';

      // Default center: India (e.g. 20.5937, 78.9629) or Karnataka (13.05, 77.59)
      const map = L.map('leaflet-map-container').setView([14.5, 77.5], 6);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | MPLADS Sentinel',
        maxZoom: 18,
      }).addTo(map);

      // Add pins for projects
      projects.forEach((p) => {
        if (p.latitude && p.longitude) {
          const color =
            p.risk_band === 'Critical'
              ? '#B3261E'
              : p.risk_band === 'High'
              ? '#C4551C'
              : p.risk_band === 'Medium'
              ? '#B98900'
              : '#2E7D46';

          const radius = p.risk_band === 'Critical' ? 9 : p.risk_band === 'High' ? 7 : 5;

          const marker = L.circleMarker([p.latitude, p.longitude], {
            radius: radius,
            fillColor: color,
            color: '#FFFFFF',
            weight: 1.5,
            opacity: 1,
            fillOpacity: 0.85,
          }).addTo(map);

          marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 11px; max-width: 200px;">
              <div style="font-weight: bold; color: #1B4F8C;">${p.project_code}</div>
              <div style="font-weight: 600; margin: 2px 0;">${p.title}</div>
              <div style="color: #5B6270;">Sanctioned: ₹${(p.sanctioned_cost / 100000).toFixed(1)}L</div>
              <div style="font-weight: bold; color: ${color}; margin-top: 4px;">Score: ${p.current_risk_score} (${p.risk_band})</div>
            </div>
          `);

          marker.on('click', () => {
            setSelectedProject(p);
          });
        }
      });
    };

    if (projects.length > 0) {
      initLeaflet();
    }
  }, [projects]);

  return (
    <div className="space-y-4 h-[calc(100vh-100px)] flex flex-col">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E3E6EA] shrink-0">
        <div>
          <h1 className="text-xl font-bold text-[#1A1D22] flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#1B4F8C]" />
            Geospatial Risk Intelligence & Clustering
          </h1>
          <p className="text-xs text-[#5B6270] mt-0.5">
            Geographic hotspot analysis across sanctioned MPLADS coordinates and density clusters.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-white border border-[#E3E6EA] rounded px-2.5 py-1 text-xs text-[#1A1D22] shadow-sm"
          >
            <option value="">All States</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Rajasthan">Rajasthan</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
          </select>

          <select
            value={riskBandFilter}
            onChange={(e) => setRiskBandFilter(e.target.value)}
            className="bg-white border border-[#E3E6EA] rounded px-2.5 py-1 text-xs text-[#1A1D22] shadow-sm"
          >
            <option value="">All Risk Bands</option>
            <option value="Critical">● Critical</option>
            <option value="High">● High</option>
            <option value="Medium">● Medium</option>
            <option value="Low">● Low</option>
          </select>
        </div>
      </div>

      {/* Map + Detail Drawer Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        {/* Map Canvas (3 Cols) */}
        <div className="lg:col-span-3 bg-white rounded border border-[#E3E6EA] shadow-sm relative overflow-hidden flex flex-col">
          <div id="leaflet-map-container" className="flex-1 w-full h-full min-h-[420px]" />

          {/* Map Legend Overlay */}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm border border-[#E3E6EA] rounded p-2.5 shadow-md text-xs z-[1000] space-y-1.5">
            <div className="font-bold text-[10px] text-[#5B6270] uppercase tracking-wider">Risk Legend</div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px] font-medium text-[#B3261E]">
                <span className="w-3 h-3 rounded-full bg-[#B3261E] inline-block border border-white"></span>
                Critical (85+)
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-[#C4551C]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C4551C] inline-block border border-white"></span>
                High (65-84)
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-[#B98900]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B98900] inline-block border border-white"></span>
                Medium (40-64)
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-[#2E7D46]">
                <span className="w-2 h-2 rounded-full bg-[#2E7D46] inline-block border border-white"></span>
                Low (0-39)
              </span>
            </div>
          </div>
        </div>

        {/* Selected Project Drawer (1 Col) */}
        <div className="bg-white rounded border border-[#E3E6EA] shadow-sm p-4 flex flex-col justify-between overflow-y-auto">
          {selectedProject ? (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-[#EEF0F3] pb-2">
                <span className="font-mono font-bold text-sm text-[#1B4F8C]">
                  {selectedProject.project_code}
                </span>
                <RiskBadge band={selectedProject.risk_band} score={selectedProject.current_risk_score} size="sm" />
              </div>

              <div>
                <h3 className="font-bold text-[#1A1D22] text-sm leading-snug">{selectedProject.title}</h3>
                <span className="text-[11px] text-[#8A92A0] mt-0.5 inline-block">{selectedProject.category}</span>
              </div>

              <div className="space-y-2 p-3 bg-[#F7F8FA] rounded border border-[#E3E6EA]">
                <div className="flex justify-between">
                  <span className="text-[#8A92A0]">Sanctioned Cost:</span>
                  <span className="font-mono font-bold text-[#1A1D22]">
                    ₹{(selectedProject.sanctioned_cost / 100000).toFixed(1)} Lakhs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A92A0]">Location:</span>
                  <span className="font-medium text-[#1A1D22]">{selectedProject.state_name} · {selectedProject.district_name}</span>
                </div>
                {selectedProject.address && (
                  <div className="text-[10px] text-[#5B6270] pt-1 border-t border-[#E3E6EA]">
                    {selectedProject.address}
                  </div>
                )}
                {selectedProject.contractor_name && (
                  <div className="flex justify-between">
                    <span className="text-[#8A92A0]">Contractor:</span>
                    <span className="font-medium text-[#1A1D22] truncate max-w-[140px]">{selectedProject.contractor_name}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate(`/projects/${selectedProject.id}`)}
                className="w-full py-2 bg-[#1B4F8C] hover:bg-[#143D6D] text-white rounded text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Open Project Risk Panel</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="text-center text-xs text-[#8A92A0] py-12">
              Click any project pin on the map to inspect telemetry details.
            </div>
          )}

          <div className="pt-3 border-t border-[#EEF0F3] text-[10px] text-[#8A92A0]">
            OpenStreetMap geospatial layer · Coordinates verified against MoSPI master registers.
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapIntelligence;
