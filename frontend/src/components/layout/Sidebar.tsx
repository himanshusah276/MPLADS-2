import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  AlertTriangle,
  FileSearch,
  BarChart3,
  MapPin,
  FileText,
  Sliders,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const { role } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', path: '/projects', icon: FolderGit2 },
    { label: 'Risk & Alerts', path: '/alerts', icon: AlertTriangle, badge: '12' },
    { label: 'Investigations', path: '/cases', icon: FileSearch },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Map Intelligence', path: '/map', icon: MapPin },
    { label: 'Reports', path: '/reports', icon: FileText },
    { label: 'Administration', path: '/admin', icon: Sliders },
  ];

  return (
    <aside className="w-60 shrink-0 bg-[#FFFFFF] border-r border-[#E3E6EA] flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#E3E6EA] flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-[#1B4F8C] flex items-center justify-center text-white font-bold text-sm shadow-sm">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-sm text-[#1A1D22] tracking-tight flex items-center gap-1.5">
            MPLADS Sentinel
          </div>
          <div className="text-[10px] text-[#5B6270] font-medium uppercase tracking-wider">
            MoSPI · DIID · SIH 2026
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-semibold text-[#8A92A0] uppercase px-3 mb-2 tracking-wider">
          Main Console
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#E8F0FA] text-[#1B4F8C] font-semibold'
                    : 'text-[#5B6270] hover:bg-[#F0F2F5] hover:text-[#1A1D22]'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold bg-[#B3261E] text-white px-1.5 py-0.2 rounded-full tabular-nums">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Role / Scheme Status Footer */}
      <div className="p-3 border-t border-[#E3E6EA] bg-[#F7F8FA]">
        <div className="flex items-center gap-2 text-xs">
          <Building2 className="w-4 h-4 text-[#5B6270]" />
          <div>
            <div className="font-semibold text-[#1A1D22] text-[11px]">MPLADS Fund Oversight</div>
            <div className="text-[10px] text-[#5B6270]">Autonomous Risk Engine v1.0</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
