import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ReportsExportView: React.FC = () => {
  const { selectedState, financialYear } = useApp();
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);
  const [kpis, setKpis] = useState<any>(null);

  useEffect(() => {
    api.getKPIs(selectedState, financialYear).then(setKpis).catch(console.error);
  }, [selectedState, financialYear]);

  const generateCAGAuditPDF = async () => {
    setGeneratingPdf(true);
    try {
      const [alerts, works] = await Promise.all([
        api.getAlerts('All', 'All', selectedState),
        api.getWorks({ state: selectedState })
      ]);

      const doc = new jsPDF();

      // Title Header
      doc.setFillColor(15, 23, 42); // Navy
      doc.rect(0, 0, 210, 32, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('GOVERNMENT OF INDIA • eSAKSHI PORTAL', 14, 12);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('COMPTROLLER AND AUDITOR GENERAL (CAG) STATUTORY VIGILANCE REPORT', 14, 19);
      doc.text(`Financial Year: ${financialYear} | State Scope: ${selectedState} | Date: ${new Date().toLocaleDateString()}`, 14, 26);

      // Summary KPIs Box
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Scheme Financial & Operational Overview', 14, 40);

      const kpiData = [
        ['Total Sanctioned Amount', `INR ${kpis?.total_sanctioned_cr || 0} Crore`],
        ['Total Utilized Amount', `INR ${kpis?.total_utilized_cr || 0} Crore (${kpis?.utilization_rate_pct || 0}%)`],
        ['Total Audited Works', `${works.length} durable assets`],
        ['Active Anomaly Alerts', `${alerts.length} total (${alerts.filter(a => a.severity === 'Critical').length} Critical)`],
        ['Overdue Utilization Certificates', `${kpis?.uc_overdue_count || 0} pending certifications`]
      ];

      autoTable(doc, {
        startY: 44,
        head: [['Metric Parameter', 'Statutory Audit Figure']],
        body: kpiData,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59] },
        styles: { fontSize: 8 }
      });

      // Alerts Audit Table
      const finalY = (doc as any).lastAutoTable.finalY || 100;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Anomaly & Rule-Violation Audit Findings (Explainable AI Engine)', 14, finalY + 12);

      const alertRows = alerts.slice(0, 20).map(a => [
        a.alert_id,
        a.entity_id,
        a.alert_type,
        a.severity,
        `${a.risk_score}/100`,
        a.status,
        a.description.slice(0, 75) + '...'
      ]);

      autoTable(doc, {
        startY: finalY + 16,
        head: [['Alert ID', 'Entity ID', 'Anomaly Type', 'Severity', 'Risk Score', 'Status', 'Statutory Clause Explanation']],
        body: alertRows,
        theme: 'grid',
        headStyles: { fillColor: [234, 88, 12] }, // Saffron
        styles: { fontSize: 7 }
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Confidential - For Official CAG & MoSPI Scheme Monitoring Use Only', 14, 285);

      doc.save(`CAG_MPLADS_Vigilance_Audit_Report_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF audit report.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const exportAllWorksCSV = async () => {
    const works = await api.getWorks({ state: selectedState });
    const rows = [
      ["Work ID", "MP ID", "MP Name", "State", "District", "Category", "Sanction Order", "Sanctioned Amount", "Estimated Cost", "Actual Cost", "Status", "Risk Score", "Risk Band", "Description"],
      ...works.map(w => [
        w.work_id,
        w.mp_id,
        `"${w.mp_name || ''}"`,
        w.state,
        w.district,
        `"${w.category}"`,
        `"${w.sanction_order_no || ''}"`,
        w.sanctioned_amount,
        w.estimated_cost,
        w.actual_cost,
        w.status,
        w.risk_score,
        w.risk_band,
        `"${w.description.replace(/"/g, '""')}"`
      ])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `MPLADS_Full_Works_Register_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gov-card border border-gov-border rounded-xl p-6 shadow-gov">
        <div className="flex items-center space-x-2">
          <FileSpreadsheet className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          <h2 className="text-base font-bold text-gov-primary">
            Official Audit Reports & Statutory Data Exports
          </h2>
        </div>
        <p className="text-xs text-gov-muted mt-1 font-medium">
          Generate printable formal Comptroller and Auditor General (CAG) audit packages or download machine-readable CSV registries for parliamentary reporting.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Card */}
        <div className="bg-gov-card border border-gov-border hover:border-slate-400 dark:hover:border-slate-500 rounded-xl p-6 space-y-4 shadow-gov flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-500/40">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gov-primary">
              Official CAG Statutory Vigilance PDF Report
            </h3>
            <p className="text-xs text-gov-muted leading-relaxed font-medium">
              Complete printable executive audit brief containing financial utilization statistics, 80% UC milestone compliance, rule violation breakdowns, and prioritized high-risk works.
            </p>
          </div>

          <button
            onClick={generateCAGAuditPDF}
            disabled={generatingPdf}
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{generatingPdf ? 'Compiling Official PDF...' : 'Download Official CAG Audit PDF'}</span>
          </button>
        </div>

        {/* CSV Card */}
        <div className="bg-gov-card border border-gov-border hover:border-slate-400 dark:hover:border-slate-500 rounded-xl p-6 space-y-4 shadow-gov flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gov-primary">
              Complete MPLADS Works & Financial Register (CSV)
            </h3>
            <p className="text-xs text-gov-muted leading-relaxed font-medium">
              Machine-readable export of all 360+ sanctioned durable assets, including GPS coordinates, actual vs estimated expenditures, implementing agency mapping, and ML risk scores.
            </p>
          </div>

          <button
            onClick={exportAllWorksCSV}
            className="w-full py-2.5 bg-gov-card hover:bg-gov-card-muted text-gov-primary text-xs font-bold rounded-lg border border-gov-border shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export Works Register (.CSV)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
