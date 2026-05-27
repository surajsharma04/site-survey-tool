import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { UploadCloud, File, X, CheckCircle2, Building2, Ruler, Image as ImageIcon } from 'lucide-react';
import { getWorkspaceSnapshot } from '../workspaceSnapshot';

const FloorPlans = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(() => {
    const saved = localStorage.getItem('siteSurveyFloorPlan');
    return saved ? JSON.parse(saved) : null;
  });
  const [status, setStatus] = useState('');
  const uploadAreaRef = useRef(null);
  const workspace = getWorkspaceSnapshot();

  useEffect(() => {
    gsap.fromTo(uploadAreaRef.current,
      { scale: 0.95, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' }
    );
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      rememberFile(e.dataTransfer.files[0]);
    }
  };

  const rememberFile = (nextFile) => {
    if (!nextFile) return;
    const summary = {
      name: nextFile.name,
      size: nextFile.size,
      type: nextFile.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
    };

    const persistPlan = (plan) => {
      setFile(plan);
      try {
        localStorage.setItem('siteSurveyFloorPlan', JSON.stringify(plan));
        window.dispatchEvent(new Event('site-survey-workspace-updated'));
        setStatus(plan.dataUrl ? 'Plan preview staged for mapping' : 'Plan metadata staged. Use a smaller image/PDF for local preview.');
      } catch {
        const metadataOnly = { ...summary, dataUrl: null };
        setFile(metadataOnly);
        localStorage.setItem('siteSurveyFloorPlan', JSON.stringify(metadataOnly));
        window.dispatchEvent(new Event('site-survey-workspace-updated'));
        setStatus('Plan is too large for browser preview. Metadata was saved.');
      }
    };

    if ((nextFile.type.startsWith('image/') || nextFile.type === 'application/pdf') && nextFile.size <= 8 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => persistPlan({ ...summary, dataUrl: reader.result });
      reader.onerror = () => persistPlan(summary);
      reader.readAsDataURL(nextFile);
      return;
    }

    persistPlan(summary);
  };

  const clearFile = () => {
    setFile(null);
    setStatus('');
    localStorage.removeItem('siteSurveyFloorPlan');
    window.dispatchEvent(new Event('site-survey-workspace-updated'));
  };

  const processPlan = () => {
    localStorage.setItem('siteSurveyPlanProcessed', 'true');
    setStatus('Plan processed. Opening mapping workspace...');
    setTimeout(() => navigate('/mapping'), 450);
  };

  return (
    <div className="page-shell page-plans max-w-5xl mx-auto">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-600">Blueprint intake</p>
        <h1 className="text-3xl font-bold text-slate-950 tracking-tight">Upload Floor Plan</h1>
        <p className="text-slate-500 mt-1">Drop in a contractor PDF or marked-up image before placing survey pins.</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="metric-card flex items-center gap-4 p-4">
          <div className="rounded-xl bg-amber-50 p-3 text-amber-600"><Building2 size={22} /></div>
          <div><p className="text-sm text-slate-500">Selected site</p><p className="font-bold text-slate-900">{workspace.propertyName}</p></div>
        </div>
        <div className="metric-card flex items-center gap-4 p-4">
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600"><Ruler size={22} /></div>
          <div><p className="text-sm text-slate-500">Calibration</p><p className="font-bold text-slate-900">Use one known wall or corridor length</p></div>
        </div>
      </div>

      <div
        ref={uploadAreaRef}
        className={`floor-upload-zone relative border-2 border-dashed rounded-3xl p-8 text-center transition-all lg:p-12 ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-slate-300 bg-white/85 hover:border-primary-400'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {!file ? (
          <>
            <div className="w-20 h-20 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <UploadCloud size={40} className="text-primary-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Drag the plan here</h3>
            <p className="text-slate-500 mb-6">Supports PDF, PNG, JPG up to 50MB</p>
            <label className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-6 py-3 rounded-xl font-medium shadow-sm cursor-pointer transition-colors">
              Browse Files
              <input type="file" className="hidden" onChange={(e) => rememberFile(e.target.files[0])} accept=".pdf,.png,.jpg,.jpeg" />
            </label>
          </>
        ) : (
          <div className="grid gap-5 rounded-2xl border border-primary-200 bg-primary-50 p-4 text-left lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl text-primary-500 shadow-sm">
                {file.dataUrl && file.type?.startsWith('image/') ? <ImageIcon size={24} /> : <File size={24} />}
              </div>
              <div>
                <p className="font-bold text-slate-900">{file.name}</p>
                <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <p className="mt-1 text-xs font-semibold text-teal-700">{file.dataUrl ? 'Preview will appear on the mapping board' : 'Preview unavailable for this local file size/type'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="floor-plan-preview rounded-xl border border-white/80 bg-white/80">
                {file.dataUrl && file.type?.startsWith('image/') ? (
                  <img src={file.dataUrl} alt={file.name} className="h-44 w-full rounded-xl object-contain" />
                ) : file.dataUrl && file.type === 'application/pdf' ? (
                  <iframe src={file.dataUrl} title={file.name} className="h-44 w-full rounded-xl" />
                ) : (
                  <div className="flex h-44 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-500">
                    Preview not available
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={clearFile} className="p-2 text-slate-400 hover:bg-white rounded-lg transition-colors" aria-label="Remove selected file">
                  <X size={20} />
                </button>
                <button onClick={processPlan} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-primary-700 shadow-md">
                  <CheckCircle2 size={18} /> Process Plan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {status && <p className="mt-4 text-sm font-semibold text-emerald-700">{status}</p>}
    </div>
  );
};

export default FloorPlans;
