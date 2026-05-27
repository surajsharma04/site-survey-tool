import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { Wifi, Plug, Thermometer, Save, Send, ShieldCheck } from 'lucide-react';

const Checklist = () => {
  const formRef = useRef(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('surveyDraft');
    return saved ? JSON.parse(saved) : {
      powerAvailable: false,
      coolingStatus: 'Adequate',
      signalStrength: -65,
      accessStatus: 'Technician accessible',
      notes: ''
    };
  });
  const [saveStatus, setSaveStatus] = useState('Draft saved just now');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    gsap.fromTo('.check-item',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
    );
  }, []);

  // Auto-save logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setSaveStatus('Auto-saving...');
      setTimeout(() => setSaveStatus('Draft saved just now'), 1000);
      localStorage.setItem('surveyDraft', JSON.stringify(formData));
    }, 2000);
    return () => clearTimeout(timer);
  }, [formData]);

  const cancelSurvey = () => {
    localStorage.removeItem('surveyDraft');
    navigate('/dashboard');
  };

  const submitSurvey = () => {
    localStorage.setItem('completedSurvey', JSON.stringify({ ...formData, completedAt: new Date().toISOString() }));
    window.dispatchEvent(new Event('site-survey-workspace-updated'));
    setSubmitted(true);
    setSaveStatus('Survey submitted');
    setTimeout(() => navigate('/reports'), 650);
  };

  return (
    <div className="page-shell page-survey max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-600">Field engineer capture</p>
          <h1 className="text-3xl font-bold text-slate-950 tracking-tight">Room Walk Checklist</h1>
          <p className="text-slate-500 mt-1">Space: Server Room A1, west riser side</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
          <Save size={16} className={saveStatus.includes('saving') ? 'animate-pulse text-amber-500' : 'text-emerald-500'} />
          {saveStatus}
        </div>
      </div>

      <div ref={formRef} className="space-y-6">
        <div className="check-item metric-card p-6 flex items-start gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Plug size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 mb-1">Power at rack location</h3>
            <p className="text-sm text-slate-500 mb-4">Confirm nearby 120V/240V service and note electrician follow-up.</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="power" className="w-4 h-4 text-primary-500 border-slate-300 focus:ring-primary-500" checked={formData.powerAvailable} onChange={() => setFormData({...formData, powerAvailable: true})} />
                <span className="text-slate-700">Available</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="power" className="w-4 h-4 text-primary-500 border-slate-300 focus:ring-primary-500" checked={!formData.powerAvailable} onChange={() => setFormData({...formData, powerAvailable: false})} />
                <span className="text-slate-700">Needs install</span>
              </label>
            </div>
          </div>
        </div>

        <div className="check-item metric-card p-6 flex items-start gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Thermometer size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 mb-1">Cooling & HVAC</h3>
            <p className="text-sm text-slate-500 mb-4">Select the cooling status for the equipment rack area.</p>
            <select 
              className="w-full max-w-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
              value={formData.coolingStatus}
              onChange={(e) => setFormData({...formData, coolingStatus: e.target.value})}
            >
              <option>Adequate</option>
              <option>Marginal - Needs Fan</option>
              <option>Poor - Too Hot</option>
            </select>
          </div>
        </div>

        <div className="check-item metric-card p-6 flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Wifi size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 mb-1">RF reading (dBm)</h3>
            <p className="text-sm text-slate-500 mb-4">Use the most stable reading from the test device.</p>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="-100" 
                max="-30" 
                value={formData.signalStrength}
                onChange={(e) => setFormData({...formData, signalStrength: e.target.value})}
                className="w-full max-w-xs h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                {formData.signalStrength} dBm
              </span>
            </div>
          </div>
        </div>

        <div className="check-item metric-card p-6 flex items-start gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <ShieldCheck size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 mb-1">Accessibility & Notes</h3>
            <p className="text-sm text-slate-500 mb-4">Capture ladder access, rack clearance, conduit constraints, and maintenance notes.</p>
            <select
              className="mb-4 w-full max-w-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
              value={formData.accessStatus}
              onChange={(e) => setFormData({...formData, accessStatus: e.target.value})}
            >
              <option>Technician accessible</option>
              <option>Needs property escort</option>
              <option>Restricted or unsafe</option>
            </select>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-700 placeholder:text-slate-400"
              placeholder="Add installation notes, cable route risks, cabinet clearance, or landlord approvals."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>
        </div>

        <div className="check-item flex justify-end gap-4 mt-8 pt-6 border-t border-slate-200">
          <button onClick={cancelSurvey} className="px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button onClick={submitSurvey} disabled={submitted} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary-500/30 transition-all transform hover:-translate-y-0.5">
            <Send size={18} /> {submitted ? 'Submitting...' : 'Submit Survey'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checklist;
