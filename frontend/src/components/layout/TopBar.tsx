import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  UserCheck,
  ChevronDown,
  Globe,
  Building,
  Shield,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

export const TopBar: React.FC = () => {
  const { user, role, switchPersona, demoUsers, logout } = useAuth();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/projects?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const roleLabels: Record<Role, { label: string; badge: string; color: string }> = {
    MINISTRY_ANALYST: { label: 'Ministry Analyst', badge: 'Central Oversight', color: 'bg-purple-100 text-purple-800' },
    STATE_NODAL_OFFICER: { label: 'State Nodal Officer', badge: 'State: Karnataka', color: 'bg-blue-100 text-blue-800' },
    DISTRICT_OFFICER: { label: 'District Officer', badge: 'Dist: Bengaluru Rural', color: 'bg-emerald-100 text-emerald-800' },
    MP_VIEWER: { label: 'MP / Constituency Viewer', badge: 'KA-014 Bengaluru', color: 'bg-amber-100 text-amber-800' },
    AUDITOR: { label: 'Investigation Auditor', badge: 'CAG Audit Wing', color: 'bg-rose-100 text-rose-800' },
    SYSTEM_ADMIN: { label: 'System Administrator', badge: 'Root Config', color: 'bg-slate-100 text-slate-800' },
  };

  const currentRoleInfo = roleLabels[role] || roleLabels.MINISTRY_ANALYST;

  return (
    <header className="h-14 bg-white border-b border-[#E3E6EA] px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Global Search */}
      <form onSubmit={handleSearch} className="relative w-96">
        <Search className="w-4 h-4 text-[#8A92A0] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search project ID (e.g. PRJ-2024-0091), contractor, MP..."
          className="w-full bg-[#F7F8FA] border border-[#E3E6EA] rounded pl-9 pr-4 py-1.5 text-xs text-[#1A1D22] placeholder-[#8A92A0] focus:outline-none focus:border-[#1B4F8C] focus:bg-white transition-all"
        />
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Geography Scope Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F0F2F5] border border-[#E3E6EA] text-xs text-[#5B6270]">
          <Globe className="w-3.5 h-3.5 text-[#1B4F8C]" />
          <span className="font-semibold text-[#1A1D22]">Scope:</span>
          <span>{user?.scope_description || 'National Scope (All States)'}</span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-1.5 text-[#5B6270] hover:text-[#1A1D22] hover:bg-[#F0F2F5] rounded transition-colors"
          title="Critical Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#B3261E] rounded-full ring-2 ring-white"></span>
        </button>

        {/* Demo Persona Switcher Dropdown (For SIH Presentation) */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#F7F8FA] hover:bg-[#F0F2F5] border border-[#E3E6EA] rounded text-xs transition-colors"
          >
            <div className="w-5 h-5 rounded bg-[#1B4F8C] text-white flex items-center justify-center font-bold text-[10px]">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="text-left">
              <div className="font-semibold text-[#1A1D22] leading-tight flex items-center gap-1">
                {user?.name?.split(' ')[0] || 'User'}
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${currentRoleInfo.color}`}>
                  {currentRoleInfo.label}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#8A92A0]" />
          </button>

          {showPersonaMenu && (
            <div className="absolute right-0 mt-1.5 w-72 bg-white border border-[#E3E6EA] rounded shadow-lg py-1 z-50 text-xs">
              <div className="px-3 py-2 border-b border-[#E3E6EA] bg-[#F7F8FA]">
                <div className="font-semibold text-[#1A1D22] text-xs">Switch Demo Persona (SIH)</div>
                <div className="text-[11px] text-[#5B6270]">Select a role to test scoped permissions</div>
              </div>

              <div className="py-1 max-h-64 overflow-y-auto">
                {demoUsers.map((u) => {
                  const info = roleLabels[u.role] || roleLabels.MINISTRY_ANALYST;
                  const isSelected = u.role === role;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchPersona(u.role, u.email);
                        setShowPersonaMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-[#F0F2F5] transition-colors ${
                        isSelected ? 'bg-[#E8F0FA]' : ''
                      }`}
                    >
                      <UserCheck className={`w-3.5 h-3.5 mt-0.5 ${isSelected ? 'text-[#1B4F8C]' : 'text-[#8A92A0]'}`} />
                      <div className="flex-1">
                        <div className="font-medium text-[#1A1D22] flex items-center justify-between">
                          <span>{u.name}</span>
                          <span className={`text-[9px] px-1 rounded font-mono font-bold ${info.color}`}>
                            {info.label}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8A92A0]">{u.scope_description || u.email}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-[#E3E6EA] p-1">
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#B3261E] hover:bg-[#FCE8E6] rounded flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
