import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { DigiGovDashboardView } from './components/DigiGovDashboardView';
import { WorksView } from './components/WorksView';
import { AlertsTriageView } from './components/AlertsTriageView';
import { AgenciesView } from './components/AgenciesView';
import { MPDossierView } from './components/MPDossierView';
import { PreCheckSimulatorModal } from './components/PreCheckSimulatorModal';
import { ReportsExportView } from './components/ReportsExportView';
import { WorkDetailModal } from './components/WorkDetailModal';
import { AlertTriageModal } from './components/AlertTriageModal';
import { RiskExplainerModal } from './components/RiskExplainerModal';
import { LoginModal } from './components/LoginModal';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-65px)] bg-gov-app transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-6 pb-8 tab-fade-enter" key={activeTab}>
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'digigov' && <DigiGovDashboardView />}
        {activeTab === 'works' && <WorksView />}
        {activeTab === 'alerts' && <AlertsTriageView />}
        {activeTab === 'agencies' && <AgenciesView />}
        {activeTab === 'mps' && <MPDossierView />}
        {activeTab === 'simulator' && <PreCheckSimulatorModal />}
        {activeTab === 'reports' && <ReportsExportView />}
      </div>

      {/* Official MoSPI / NIC System Footer */}
      <footer className="max-w-7xl mx-auto pt-6 pb-2 border-t border-gov-border text-center text-xs text-gov-muted space-y-1">
        <p className="font-semibold text-gov-secondary">
          National Informatics Centre (NIC) • Ministry of Statistics and Programme Implementation (MoSPI) • Government of India
        </p>
        <p className="text-[11px]">
          eSAKSHI MPLADS Anomaly & Fraud Detection Engine v2.4 | All Data Strictly Verified under Statutory Guidelines 2023 | High Security Tier
        </p>
      </footer>

      {/* Global Dossier, Triage & Authentication Modals */}
      <WorkDetailModal />
      <AlertTriageModal />
      <RiskExplainerModal />
      <LoginModal />
    </main>
  );
};

export function App() {
  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col bg-gov-app text-gov-primary font-sans selection:bg-orange-500 selection:text-white">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <MainContent />
        </div>
      </div>
    </AppProvider>
  );
}

export default App;
