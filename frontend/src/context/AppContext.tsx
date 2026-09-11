import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole, UserProfile } from '../types';
import { api, clearApiCache } from '../services/api';

export type AppTheme = 'light' | 'dark';

interface AppContextType {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  toggleTheme: () => void;
  role: UserRole;
  setRole: (r: UserRole) => void;
  currentUser: UserProfile;
  setCurrentUser: (u: UserProfile) => void;
  isAuthenticated: boolean;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  quickLogin: (username: string) => Promise<boolean>;
  logout: () => void;
  showLoginModal: boolean;
  setShowLoginModal: (s: boolean) => void;
  demoRoles: UserProfile[];
  financialYear: string;
  setFinancialYear: (fy: string) => void;
  selectedState: string;
  setSelectedState: (s: string) => void;
  selectedSeverity: string;
  setSelectedSeverity: (s: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang: 'en' | 'hi';
  setLang: (l: 'en' | 'hi') => void;
  t: (key: string) => string;
  isAnalyzing: boolean;
  runAnalysis: () => Promise<void>;
  selectedWorkId: string | null;
  setSelectedWorkId: (id: string | null) => void;
  selectedMPId: string | null;
  setSelectedMPId: (id: string | null) => void;
  lastSynced: string;
  openTriageAlertId: string | null;
  setOpenTriageAlertId: (id: string | null) => void;
  showExplainer: boolean;
  setShowExplainer: (s: boolean) => void;
}

const translations = {
  en: {
    portal_title: "eSAKSHI — National MPLADS Monitoring & Fraud Detection Platform",
    sub_title: "Ministry of Statistics and Programme Implementation (MoSPI) • Govt. of India",
    dashboard: "Dashboard",
    works: "Works",
    alerts: "Alerts",
    agencies: "Agencies",
    mp_dossiers: "MP Dossiers",
    reports: "Audit Reports",
    simulator: "Pre-Check Simulator",
    settings: "Risk Explainer & Settings",
    run_analysis: "Run analysis",
    synced_ago: "Synced just now",
    sanctioned: "Sanctioned",
    utilized: "Utilized",
    uc_overdue: "UC overdue",
    open_alerts: "Open alerts",
    critical: "critical",
    high: "high",
    medium: "medium",
    low: "low",
    across_works: "across {n} works",
    of_sanctioned: "of sanctioned",
    vs_last_month: "vs last month",
    district_risk_map: "District risk map",
    highest_risk_mps: "Highest risk MPs",
    view_all: "view all",
    recent_alerts: "Recent alerts",
    work_id: "Work ID",
    mp: "MP",
    district: "District",
    type: "Type",
    severity: "Severity",
    status: "Status",
    actions: "Actions",
    all_states: "All states",
    all_severities: "All severities",
    all_financial_years: "Apr 2025 – Mar 2026",
    role_ministry: "Central Nodal Agency (MoSPI)",
    role_auditor: "CAG Principal Director of Audit",
    role_state: "State Nodal Authority (MH)",
    role_da: "District Authority (Nashik)",
    role_mp: "Hon'ble MP Rajesh Sharma",
    light_mode: "Light Mode",
    dark_mode: "Dark Theme",
    sign_in: "Sign In",
    switch_account: "Switch Role",
    logged_in_as: "Logged in as",
    secure_session: "GovTech NSSO Session Verified"
  },
  hi: {
    portal_title: "ई-साक्षी — राष्ट्रीय एमपीएलएडीएस निगरानी एवं विसंगति पहचान पोर्टल",
    sub_title: "सांख्यिकी एवं कार्यक्रम कार्यान्वयन मंत्रालय (MoSPI) • भारत सरकार",
    dashboard: "डैशबोर्ड",
    works: "कार्य सूची",
    alerts: "सतर्कता अलर्ट",
    agencies: "कार्यदायी संस्थाएं",
    mp_dossiers: "सांसद प्रोफाइल",
    reports: "लेखापरीक्षा रिपोर्ट",
    simulator: "स्वीकृति पूर्व जांच सिम्युलेटर",
    settings: "जोखिम विश्लेषण विधि",
    run_analysis: "एनालिसिस चलाएं",
    synced_ago: "अभी अद्यतन किया गया",
    sanctioned: "स्वीकृत राशि",
    utilized: "उपयोग की गई राशि",
    uc_overdue: "यूसी अतिदेय",
    open_alerts: "सक्रिय अलर्ट",
    critical: "गंभीर",
    high: "उच्च",
    medium: "मध्यम",
    low: "निम्न",
    across_works: "{n} कार्यों में",
    of_sanctioned: "स्वीकृत राशि का",
    vs_last_month: "पिछले माह की तुलना में",
    district_risk_map: "जिलावार जोखिम मानचित्र",
    highest_risk_mps: "उच्च जोखिम सांसद सूची",
    view_all: "सभी देखें",
    recent_alerts: "हाल के अलर्ट",
    work_id: "कार्य क्रमांक",
    mp: "सांसद",
    district: "जिला",
    type: "प्रकार",
    severity: "गंभीरता",
    status: "स्थिति",
    actions: "कार्रवाई",
    all_states: "सभी राज्य",
    all_severities: "सभी गंभीरता स्तर",
    all_financial_years: "अप्रैल 2025 – मार्च 2026",
    role_ministry: "केंद्रीय नोडल एजेंसी (MoSPI)",
    role_auditor: "सीएजी प्रधान लेखा परीक्षा निदेशक",
    role_state: "राज्य नोडल प्राधिकरण (महाराष्ट्र)",
    role_da: "जिला प्राधिकारी (नासिक)",
    role_mp: "माननीय सांसद राजेश शर्मा",
    light_mode: "लाइट मोड",
    dark_mode: "डार्क थीम",
    sign_in: "लॉग इन करें",
    switch_account: "भूमिका बदलें",
    logged_in_as: "लॉग इन उपयोगकर्ता",
    secure_session: "सत्यापित सत्र"
  }
};

const defaultUser: UserProfile = {
  username: "ministry",
  full_name: "S. C. Garg (Central Nodal Officer)",
  email: "cna-mplads@mospi.gov.in",
  role: "ministry",
  role_title: "Central Nodal Agency (MoSPI)"
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('mplads_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('mplads_token'));
  const [currentUser, setCurrentUserState] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('mplads_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return defaultUser;
  });

  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('mplads_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u.role) return u.role;
      } catch {}
    }
    return 'ministry';
  });

  const [demoRoles, setDemoRoles] = useState<UserProfile[]>([]);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [financialYear, setFinancialYear] = useState<string>('Apr 2025 – Mar 2026');
  const [selectedState, setSelectedState] = useState<string>('All states');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All severities');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [selectedMPId, setSelectedMPId] = useState<string | null>(null);
  const [openTriageAlertId, setOpenTriageAlertId] = useState<string | null>(null);
  const [showExplainer, setShowExplainer] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<string>('Synced just now');

  // Load demo roles on mount
  useEffect(() => {
    api.getDemoRoles().then(roles => {
      if (roles && roles.length > 0) setDemoRoles(roles);
    }).catch(console.warn);
  }, []);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('mplads_theme', theme);
  }, [theme]);

  const setTheme = (t: AppTheme) => {
    setThemeState(t);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const syncUserFilters = useCallback((u: UserProfile) => {
    if (u.role === 'state_nodal' && u.state) {
      setSelectedState(u.state);
    } else if (u.role === 'district_authority' && u.state) {
      setSelectedState(u.state);
    } else if (u.role === 'mp' && u.mp_id) {
      setSelectedMPId(u.mp_id);
      if (u.state) setSelectedState(u.state);
    } else {
      setSelectedState('All states');
    }
  }, []);

  const setCurrentUser = (u: UserProfile) => {
    setCurrentUserState(u);
    setRoleState(u.role);
    localStorage.setItem('mplads_user', JSON.stringify(u));
    syncUserFilters(u);
  };

  const setRole = (r: UserRole) => {
    setRoleState(r);
    // Find matching demo role if available
    const matched = demoRoles.find(dr => dr.role === r);
    if (matched) {
      setCurrentUser(matched);
    } else {
      const updated: UserProfile = {
        ...currentUser,
        role: r,
        role_title: {
          ministry: "Central Nodal Agency (MoSPI)",
          auditor: "CAG Principal Director of Audit",
          state_nodal: "State Nodal Authority (MH)",
          district_authority: "District Authority (Nashik)",
          mp: "Hon'ble MP Rajesh Sharma"
        }[r] || r
      };
      setCurrentUser(updated);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const resp = await api.login(username, password);
      if (resp && resp.access_token) {
        localStorage.setItem('mplads_token', resp.access_token);
        setToken(resp.access_token);

        const profile: UserProfile = {
          username: resp.username,
          full_name: resp.full_name,
          email: `${resp.username}@gov.in`,
          role: resp.role,
          state: resp.state,
          district: resp.district,
          mp_id: resp.mp_id,
          role_title: {
            ministry: "Central Nodal Agency (MoSPI)",
            auditor: "CAG Principal Director of Audit",
            state_nodal: "State Nodal Authority (Maharashtra)",
            district_authority: "District Magistrate (Nashik Nodal DA)",
            mp: "Hon'ble MP Rajesh Sharma (LS)"
          }[resp.role] || resp.role
        };

        setCurrentUser(profile);
        setShowLoginModal(false);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const quickLogin = async (username: string): Promise<boolean> => {
    const passwordMap: Record<string, string> = {
      ministry: "admin123",
      auditor: "audit123",
      sna_mh: "state123",
      da_nashik: "dist123",
      mp_rsharma: "mp123"
    };
    const password = passwordMap[username] || "admin123";
    return login(username, password);
  };

  const logout = () => {
    localStorage.removeItem('mplads_token');
    localStorage.removeItem('mplads_user');
    setToken(null);
    clearApiCache();
    // Default to ministry demo profile
    setCurrentUserState(defaultUser);
    setRoleState('ministry');
    setSelectedState('All states');
  };

  const t = (key: string): string => {
    return (translations[lang] as any)[key] || (translations.en as any)[key] || key;
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      await api.runMLAnalysis();
      setLastSynced('Synced just now');
    } catch (err) {
      console.error('Error running ML analysis:', err);
      setLastSynced('Synced just now');
    } finally {
      setTimeout(() => setIsAnalyzing(false), 900);
    }
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        role,
        setRole,
        currentUser,
        setCurrentUser,
        isAuthenticated: !!token,
        token,
        login,
        quickLogin,
        logout,
        showLoginModal,
        setShowLoginModal,
        demoRoles,
        financialYear,
        setFinancialYear,
        selectedState,
        setSelectedState,
        selectedSeverity,
        setSelectedSeverity,
        activeTab,
        setActiveTab,
        lang,
        setLang,
        t,
        isAnalyzing,
        runAnalysis,
        selectedWorkId,
        setSelectedWorkId,
        selectedMPId,
        setSelectedMPId,
        lastSynced,
        openTriageAlertId,
        setOpenTriageAlertId,
        showExplainer,
        setShowExplainer
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
