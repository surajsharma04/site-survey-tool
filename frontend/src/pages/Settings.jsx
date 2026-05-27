import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Bell, Globe, Lock, Moon, Save, Shield, Sun, User } from 'lucide-react';
import { updateSessionProfile } from '../auth';

const roleOptions = ['Field Engineer', 'Network Planner', 'Operations Manager'];

const defaultSettingsFor = (user = {}) => ({
  name: user.name || user.email?.split('@')[0] || 'Demo Engineer',
  role: user.role || 'Field Engineer',
  notifications: true,
  mfa: true,
  theme: 'Light',
  timezone: 'Asia/Calcutta',
});

const Settings = () => {
  const containerRef = useRef(null);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('siteSurveySettings');
    const savedUser = localStorage.getItem('siteSurveyUser');
    const user = savedUser ? JSON.parse(savedUser) : {};
    const defaults = defaultSettingsFor(user);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaults,
        ...parsed,
        name: parsed.name && parsed.name !== 'John Doe' ? parsed.name : defaults.name,
        role: parsed.role || defaults.role,
      };
    }
    return defaults;
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    gsap.fromTo(containerRef.current.children, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' });
  }, []);

  const updateSetting = (key, value) => {
    setSettings((current) => {
      const next = { ...current, [key]: value };
      localStorage.setItem('siteSurveySettings', JSON.stringify(next));

      if (key === 'name' || key === 'role') {
        updateSessionProfile({ name: next.name, role: next.role });
      }

      if (key === 'name' || key === 'role' || key === 'theme') {
        window.dispatchEvent(new Event('site-survey-settings-updated'));
      }

      return next;
    });
    setStatus('Saved automatically');
  };

  const saveSettings = () => {
    localStorage.setItem('siteSurveySettings', JSON.stringify(settings));
    updateSessionProfile({ name: settings.name, role: settings.role });
    window.dispatchEvent(new Event('site-survey-settings-updated'));
    setStatus('Settings saved');
  };

  const setTheme = (theme) => {
    updateSetting('theme', theme);
    setStatus(`${theme} mode applied`);
  };

  return (
    <div className="page-shell page-settings mx-auto max-w-5xl">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-600">Controls</p>
          <h1 className="text-3xl font-bold text-slate-950">Settings</h1>
          <p className="mt-1 text-slate-500">Keep the app matched to the way your team surveys sites.</p>
        </div>
        <button onClick={saveSettings} className="primary-action">
          <Save size={18} /> Save Changes
        </button>
      </div>

      <div ref={containerRef} className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="metric-card p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><User size={24} /></div>
          <h3 className="mb-4 text-lg font-bold text-slate-900">Profile</h3>
          <input value={settings.name} onChange={(e) => updateSetting('name', e.target.value)} className="mb-3 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm" />
          <select value={settings.role} onChange={(e) => updateSetting('role', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm">
            {roleOptions.map((role) => <option key={role}>{role}</option>)}
          </select>
        </div>

        <div className="metric-card p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Bell size={24} /></div>
          <h3 className="mb-4 text-lg font-bold text-slate-900">Notifications</h3>
          <label className="flex cursor-pointer items-center justify-between rounded-xl bg-white/70 px-4 py-3">
            <span className="text-sm font-medium text-slate-700">Survey reminders and export alerts</span>
            <input type="checkbox" checked={settings.notifications} onChange={(e) => updateSetting('notifications', e.target.checked)} className="h-5 w-5 accent-primary-600" />
          </label>
        </div>

        <div className="metric-card p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Lock size={24} /></div>
          <h3 className="mb-4 text-lg font-bold text-slate-900">Security</h3>
          <label className="flex cursor-pointer items-center justify-between rounded-xl bg-white/70 px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-700"><Shield size={16} /> Require MFA for exports</span>
            <input type="checkbox" checked={settings.mfa} onChange={(e) => updateSetting('mfa', e.target.checked)} className="h-5 w-5 accent-primary-600" />
          </label>
        </div>

        <div className="metric-card p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Globe size={24} /></div>
          <h3 className="mb-4 text-lg font-bold text-slate-900">Preferences</h3>
          <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            {[
              ['Light', <Sun size={16} />],
              ['Dark', <Moon size={16} />],
            ].map(([label, icon]) => (
              <button key={label} onClick={() => setTheme(label)} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${settings.theme === label ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>
                {icon} {label}
              </button>
            ))}
          </div>
          <select value={settings.timezone} onChange={(e) => updateSetting('timezone', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm">
            <option>Asia/Calcutta</option>
            <option>America/New_York</option>
            <option>Europe/London</option>
          </select>
        </div>
      </div>
      {status && <p className="mt-4 text-sm font-semibold text-emerald-700">{status}</p>}
    </div>
  );
};

export default Settings;
