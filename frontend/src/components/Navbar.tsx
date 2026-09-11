import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldAlert, 
  BookOpen, 
  Sun, 
  Moon, 
  ChevronDown, 
  LogOut, 
  ShieldCheck, 
  Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    currentUser, 
    lang, 
    setLang, 
    t, 
    setShowExplainer, 
    theme, 
    toggleTheme, 
    setShowLoginModal,
    logout
  } = useApp();

  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ministry': return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/40';
      case 'auditor': return 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/40';
      case 'state_nodal': return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40';
      case 'district_authority': return 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/40';
      case 'mp': return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40';
      default: return 'bg-slate-500/15 text-slate-700 border-slate-500/40';
    }
  };

  return (
    <header className="bg-gov-header border-b border-gov-border sticky top-0 z-40 select-none shadow-sm transition-colors duration-200">
      {/* Official Government of India Tricolor Ribbon */}
      <div className="h-1.5 w-full flex">
        <div className="flex-1 bg-[#FF9933]"></div>
        <div className="flex-1 bg-[#FFFFFF] border-y border-slate-200"></div>
        <div className="flex-1 bg-[#138808]"></div>
      </div>

      <div className="px-6 py-2.5 flex items-center justify-between">
        {/* Brand & National Portal Information */}
        <div className="flex items-center space-x-3.5">
          {/* Official Emblem & Portal Badge */}
          <div className="w-9 h-9 rounded-lg bg-[#0a2540] text-amber-400 flex items-center justify-center border border-amber-500/40 shadow-sm">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-extrabold tracking-tight text-gov-primary flex items-center gap-2">
                eSAKSHI <span className="text-[11px] bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/40 px-2 py-0.5 rounded-md font-mono font-bold">MPLADS AI v2.4</span>
              </span>
              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1 inline-block animate-pulse"></span>
                Official Live Engine
              </span>
            </div>
            <p className="text-[11px] text-gov-muted font-medium leading-tight">
              {t('sub_title')}
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center space-x-1.5 text-xs bg-gov-card hover:bg-gov-card-muted text-gov-primary px-3 py-1.5 rounded-full border border-gov-border hover:border-slate-400 dark:hover:border-slate-500 transition shadow-xs font-semibold cursor-pointer"
            title={`Switch to ${theme === 'light' ? 'Dark Mode' : 'Light Mode'}`}
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-700" />
                <span className="hidden sm:inline">Dark Theme</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            )}
          </button>

          {/* Risk Methodology Explainer Button */}
          <button
            onClick={() => setShowExplainer(true)}
            className="flex items-center space-x-1.5 text-xs bg-gov-card hover:bg-gov-card-muted text-gov-secondary hover:text-gov-primary px-3 py-1.5 rounded-full border border-gov-border transition shadow-xs font-medium cursor-pointer"
            title="Explainable AI & Statutory Guideline Rules Breakdown"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Risk Rules</span>
          </button>

          {/* Bilingual Switcher (Pill style) */}
          <div className="flex items-center bg-gov-card border border-gov-border p-0.5 rounded-full shadow-xs">
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-full transition cursor-pointer ${
                lang === 'en' 
                  ? 'bg-orange-600 text-white shadow-xs' 
                  : 'text-gov-muted hover:text-gov-primary'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('hi')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-full transition cursor-pointer ${
                lang === 'hi' 
                  ? 'bg-orange-600 text-white shadow-xs' 
                  : 'text-gov-muted hover:text-gov-primary'
              }`}
            >
              हिंदी
            </button>
          </div>

          {/* User Profile & Role Switcher Button / Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center space-x-2.5 bg-gov-card hover:bg-gov-card-muted border border-gov-border px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              {/* Avatar Icon */}
              <div className="w-7 h-7 rounded-lg bg-[#0a2540] text-amber-300 font-mono font-bold text-xs flex items-center justify-center border border-amber-500/30 shrink-0">
                {currentUser.full_name ? currentUser.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2) : 'MP'}
              </div>

              <div className="text-left hidden md:block max-w-[170px]">
                <div className="text-xs font-bold text-gov-primary truncate flex items-center gap-1">
                  <span>{currentUser.full_name.split('(')[0].trim()}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </div>
                <div className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold truncate">
                  {currentUser.role_title || currentUser.role}
                </div>
              </div>

              <ChevronDown className={`w-3.5 h-3.5 text-gov-muted transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-gov-card border border-gov-border rounded-xl shadow-gov-modal p-3 z-50 animate-scale-in space-y-3">
                <div className="p-2.5 bg-gov-card-muted rounded-lg border border-gov-border space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gov-primary">
                      {currentUser.full_name}
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${getRoleBadgeStyle(currentUser.role)}`}>
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-gov-muted truncate font-medium">
                    {currentUser.email}
                  </div>
                  {(currentUser.state || currentUser.district) && (
                    <div className="text-[10px] text-gov-secondary font-medium pt-1">
                      Jurisdiction: <strong className="text-gov-primary">{currentUser.district ? `${currentUser.district}, ` : ''}{currentUser.state || 'All India'}</strong>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setShowLoginModal(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-gov-primary hover:bg-orange-500/10 hover:text-orange-600 rounded-lg transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                      <span>Switch Role / Sign In</span>
                    </div>
                    <span className="text-[10px] bg-orange-500/15 text-orange-600 px-1.5 py-0.2 rounded font-mono">
                      NSSO
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-gov-border text-[10px] text-gov-muted text-center flex items-center justify-center gap-1 font-medium">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Session Protected by eSAKSHI v2.4</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
