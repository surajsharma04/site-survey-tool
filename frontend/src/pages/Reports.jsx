import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { AlertCircle, Download, FileText, Send } from 'lucide-react';
import { getWorkspaceSnapshot } from '../workspaceSnapshot';

const Reports = () => {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [exportStatus, setExportStatus] = useState('');
  const workspace = useMemo(() => getWorkspaceSnapshot(), []);
  const completedSurvey = useMemo(() => {
    const saved = localStorage.getItem('completedSurvey');
    return saved ? JSON.parse(saved) : null;
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });

      gsap.utils.toArray('.report-reveal').forEach((element, index) => {
        gsap.fromTo(
          element,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.78,
            ease: 'power3.out',
            delay: index * 0.04,
            scrollTrigger: {
              trigger: element,
              start: 'top 84%',
            },
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const downloadReport = () => {
    const payload = completedSurvey || {
      status: 'Draft',
      recommendation: 'Complete survey checklist before final construction handoff.',
    };
    const content = [
      'ISP SITE SURVEY READINESS REPORT',
      `Property: ${workspace.propertyName}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      `Power available: ${payload.powerAvailable ? 'Yes' : 'No / needs install'}`,
      `Cooling status: ${payload.coolingStatus || 'Not captured'}`,
      `RF signal: ${payload.signalStrength || 'Not captured'} dBm`,
      `Accessibility: ${payload.accessStatus || 'Not captured'}`,
      `Notes: ${payload.notes || 'No field notes captured'}`,
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'site-survey-readiness-report.txt';
    link.click();
    URL.revokeObjectURL(url);
    setExportStatus('Report exported successfully');
  };

  return (
    <div ref={containerRef} className="page-shell page-reports mx-auto max-w-6xl">
      <div className="report-reveal mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-700">Handoff output</p>
          <h1 className="text-3xl font-bold text-slate-950">Site Reports</h1>
          <p className="mt-1 text-slate-500">Turn the survey engineer&apos;s field notes into a concise install handoff.</p>
        </div>
        <button onClick={downloadReport} className="primary-action">
          <Download size={20} />
          Export All
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="report-reveal metric-card p-6 lg:col-span-2">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <FileText size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{completedSurvey ? 'Readiness note ready' : 'Draft note preview'}</h2>
              <p className="text-slate-500">Property, RF, power, HVAC, accessibility, and field notes summarized.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 font-mono text-sm text-slate-100 shadow-inner">
            <p>{workspace.propertyName.toUpperCase()}</p>
            <p className="mt-3 text-emerald-300">Power: {completedSurvey?.powerAvailable ? 'available' : 'needs electrical install'}</p>
            <p>Cooling: {completedSurvey?.coolingStatus || 'pending capture'}</p>
            <p>RF signal: {completedSurvey?.signalStrength || '--'} dBm</p>
            <p>Access: {completedSurvey?.accessStatus || 'pending capture'}</p>
            <p className="mt-3 text-slate-400">{completedSurvey?.notes || 'No field notes yet.'}</p>
          </div>
          {exportStatus && <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700"><Send size={16} /> {exportStatus}</p>}
        </div>

        <div className="report-reveal metric-card p-6">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Report Quality</h3>
          {[
            ['Floor plan', localStorage.getItem('siteSurveyFloorPlan') ? 'Attached' : 'Missing'],
            ['Survey checklist', completedSurvey ? 'Complete' : 'Draft'],
            ['Map pins', `${JSON.parse(localStorage.getItem('siteSurveyMarkers') || '[]').length} captured`],
          ].map(([label, value]) => (
            <div key={label} className="mb-3 flex items-center justify-between rounded-xl bg-white/70 px-4 py-3">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="font-bold text-slate-900">{value}</span>
            </div>
          ))}
          <button onClick={() => navigate('/survey')} className="mt-4 w-full secondary-action">
            <AlertCircle size={18} /> Continue Survey
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
