import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ClipboardCheck, MapPin, RadioTower, Settings, ShieldCheck, UserRound, Wifi } from 'lucide-react';
import { getWorkspaceSnapshot } from '../workspaceSnapshot';

const Profile = () => {
  const navigate = useNavigate();

  const data = useMemo(() => {
    const user = JSON.parse(localStorage.getItem('siteSurveyUser') || '{}');
    const settings = JSON.parse(localStorage.getItem('siteSurveySettings') || '{}');
    const workspace = getWorkspaceSnapshot();
    const name = settings.name && settings.name !== 'John Doe' ? settings.name : user.name || user.email?.split('@')[0] || 'Demo Engineer';
    const role = settings.role || user.role || 'Field Engineer';
    return { user, settings, ...workspace, survey: workspace.completedSurvey, name, role };
  }, []);

  const stats = [
    { label: 'My Buildings', value: data.totals.buildings, icon: Building2, tone: 'from-fuchsia-500 to-rose-500' },
    { label: 'My Spaces', value: data.totals.spaces, icon: MapPin, tone: 'from-cyan-400 to-blue-500' },
    { label: 'RF Pins', value: data.pinCount, icon: RadioTower, tone: 'from-emerald-400 to-teal-500' },
    { label: 'Surveys', value: data.survey ? 1 : 0, icon: ClipboardCheck, tone: 'from-amber-300 to-orange-500' },
  ];

  return (
    <div className="page-shell page-profile mx-auto max-w-7xl profile-compact">
      <div className="profile-hero mb-5 overflow-hidden rounded-2xl p-5 text-white shadow-2xl lg:p-6">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="profile-icon flex h-16 w-16 items-center justify-center rounded-2xl shadow-2xl">
              <UserRound size={36} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">Profile</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">{data.name}</h1>
              <p className="mt-1 text-slate-200">{data.role} / {data.user.email || 'No email stored'}</p>
            </div>
          </div>
          <button onClick={() => navigate('/settings')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 font-bold text-white backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/15">
            <Settings size={18} /> Edit Profile
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <button key={stat.label} onClick={() => navigate(stat.label.includes('Building') || stat.label.includes('Spaces') ? '/properties' : stat.label.includes('RF') ? '/mapping' : '/survey')} className="profile-stat metric-card p-4 text-left">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.tone} text-white shadow-lg`}>
                <Icon size={22} />
              </div>
              <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
              <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{stat.value}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="metric-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">Assigned Sites</h2>
              <p className="text-sm text-slate-500">Top active properties attached to this login.</p>
            </div>
            <Building2 className="text-rose-500" />
          </div>
          <div className="space-y-3">
            {data.properties.length === 0 && (
              <div className="property-strip rounded-xl border border-white/70 bg-white/70 p-4 text-sm text-slate-500 shadow-sm">
                No sites are assigned yet. Add a property to populate this view.
              </div>
            )}
            {data.properties.slice(0, 3).map((property) => (
              <button key={property.id} onClick={() => navigate('/properties')} className="property-strip flex w-full flex-col gap-3 rounded-xl border border-white/70 bg-white/70 p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-black text-slate-950">{property.name}</p>
                  <p className="text-sm text-slate-500">{property.type} / {property.status}</p>
                </div>
                <div className="flex gap-3 text-sm font-bold">
                  <span className="rounded-lg bg-fuchsia-50 px-3 py-2 text-fuchsia-700">{property.buildings} buildings</span>
                  <span className="rounded-lg bg-cyan-50 px-3 py-2 text-cyan-700">{property.spaces} spaces</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="metric-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">Survey Status</h2>
              <p className="text-sm text-slate-500">Latest floor plan, RF, and checklist status.</p>
            </div>
            <Wifi className="text-emerald-500" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="profile-info-row">
              <span>Current floor plan</span>
              <strong>{data.floorPlan?.name || 'No plan uploaded'}</strong>
            </div>
            <div className="profile-info-row">
              <span>Power status</span>
              <strong>{data.survey ? (data.survey.powerAvailable ? 'Available' : 'Needs install') : 'Not submitted'}</strong>
            </div>
            <div className="profile-info-row">
              <span>Cooling</span>
              <strong>{data.survey?.coolingStatus || 'Pending'}</strong>
            </div>
            <div className="profile-info-row">
              <span>Signal strength</span>
              <strong>{data.survey?.signalStrength ? `${data.survey.signalStrength} dBm` : 'Pending'}</strong>
            </div>
            <div className="rounded-xl bg-slate-950 p-4 text-white shadow-inner md:col-span-2">
              <div className="mb-3 flex items-center gap-2 text-emerald-300">
                <ShieldCheck size={18} />
                <span className="text-sm font-black uppercase tracking-[0.18em]">User Notes</span>
              </div>
              <p className="text-sm leading-6 text-slate-300">{data.survey?.notes || 'No submitted notes yet. Complete a survey to fill this area.'}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;
