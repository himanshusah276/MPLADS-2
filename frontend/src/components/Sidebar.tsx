import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  FileText, 
  Flag, 
  Building2, 
  Users, 
  Download, 
  CheckCircle2, 
  HelpCircle, 
  Globe, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, t, setShowExplainer, role } = useApp();
  const [openAlertsCount, setOpenAlertsCount] = useState<number>(42);

  useEffect(() => {
    api.getKPIs().then(res => {
      if (res && res.open_alerts_count !== undefined) {
        setOpenAlertsCount(res.open_alerts_count);
      }
    }).catch(() => {});
  }, []);

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'digigov', label: 'eSAKSHI Public Portal', icon: Globe, highlight: true },
    { id: 'works', label: t('works'), icon: FileText },
    { 
      id: 'alerts', 
      label: t('alerts'), 
      icon: Flag, 
      badge: openAlertsCount, 
      badgeColor: 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/40' 
    },
    { id: 'agencies', label: t('agencies'), icon: Building2 },
    { id: 'mps', label: t('mp_dossiers'), icon: Users },
    { id: 'simulator', label: t('simulator'), icon: CheckCircle2, roleHint: role === 'mp' ? 'MP Tool' : undefined },
    { id: 'reports', label: t('reports'), icon: Download, roleHint: role === 'auditor' ? 'CAG Audit' : undefined },
  ];

  return (
    <aside className="w-64 bg-gov-sidebar border-r border-gov-border flex flex-col justify-between h-[calc(100vh-65px)] sticky top-[65px] select-none shadow-xs transition-colors duration-200">
      <div className="p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer group ${
                isActive
                  ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 shadow-xs'
                  : 'text-gov-secondary hover:text-gov-primary hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-gov-muted'}`} />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center space-x-1.5">
                {item.roleHint && (
                  <span className="text-[9px] bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/40 px-1.5 py-0.2 rounded-md font-bold uppercase">
                    {item.roleHint}
                  </span>
                )}
                {item.badge !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
                {item.highlight && !isActive && (
                  <span className="text-[9px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider">
                    Live
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Official MoSPI & NIC Footer Attribution */}
      <div className="p-3 border-t border-gov-border space-y-2 bg-gov-card-muted/40">
        <button
          onClick={() => setShowExplainer(true)}
          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gov-secondary hover:text-gov-primary hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Statutory Guidelines 2023</span>
        </button>

        <div className="p-3 bg-gov-card border border-gov-border rounded-xl text-[11px] space-y-1 shadow-xs">
          <div className="font-bold text-gov-primary flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              eSAKSHI v2.4
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              99.9% Up
            </span>
          </div>
          <p className="text-[10px] text-gov-muted leading-tight font-medium">
            MoSPI Central Nodal Engine • NIC Govt of India
          </p>
        </div>
      </div>
    </aside>
  );
};
