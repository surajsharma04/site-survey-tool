import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { Activity, ArrowUpRight, Building, CheckCircle2, Map, Plus, TrendingUp, Wifi, Zap } from 'lucide-react';
import { getWorkspaceSnapshot } from '../workspaceSnapshot';

const Dashboard = () => {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const workspace = useMemo(() => getWorkspaceSnapshot(), []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.dashboard-hero',
        { opacity: 0, y: 36, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' }
      );

      gsap.fromTo(
        '.stat-card',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out', delay: 0.18 }
      );

      gsap.utils.toArray('.dashboard-reveal').forEach((element) => {
        gsap.fromTo(
          element,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 82%',
            },
          }
        );
      });

      gsap.utils.toArray('.count-up').forEach((element) => {
        const target = Number(element.dataset.target || 0);
        const state = { value: 0 };

        gsap.to(state, {
          value: target,
          duration: 1.05,
          ease: 'power3.out',
          delay: 0.22,
          onUpdate: () => {
            element.textContent = String(Math.round(state.value)).padStart(Number(element.dataset.pad || 0), '0');
          },
        });
      });

      gsap.to('.dashboard-hero', {
        yPercent: -6,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const stats = [
    {
      title: 'Open Sites',
      value: String(workspace.openSites),
      target: workspace.openSites,
      icon: <Building size={24} className="text-teal-600" />,
      trend: workspace.openSites ? `${workspace.totals.buildings} building${workspace.totals.buildings === 1 ? '' : 's'} tracked` : 'Create your first property',
      path: '/properties',
    },
    {
      title: 'Plans Staged',
      value: workspace.hasFloorPlan ? '1' : '0',
      target: workspace.hasFloorPlan ? 1 : 0,
      icon: <Map size={24} className="text-blue-600" />,
      trend: workspace.hasFloorPlan ? 'Ready for mapping' : 'Upload a floor plan',
      path: '/floor-plans',
    },
    {
      title: 'Surveys Closed',
      value: workspace.hasSurvey ? '1' : '0',
      target: workspace.hasSurvey ? 1 : 0,
      icon: <CheckCircle2 size={24} className="text-emerald-600" />,
      trend: workspace.hasSurvey ? 'Checklist completed' : 'Checklist still open',
      path: '/survey',
    },
    {
      title: 'RF Pins Logged',
      value: String(workspace.pinCount),
      target: workspace.pinCount,
      icon: <TrendingUp size={24} className="text-amber-600" />,
      trend: workspace.pinCount ? 'Spatial board active' : 'No pins dropped yet',
      path: '/mapping',
    },
  ];
  const activity = workspace.activity;
  const flowSeries = [
    workspace.openSites > 0 ? 42 : 12,
    workspace.hasFloorPlan ? 58 : 18,
    workspace.pinCount > 0 ? 66 : 22,
    workspace.hasSurvey ? 84 : 28,
  ];
  const readinessBars = [
    Math.max(12, workspace.openSites * 18),
    workspace.hasFloorPlan ? 72 : 20,
    Math.min(92, Math.max(16, workspace.pinCount * 9)),
    workspace.hasSurvey ? 86 : 24,
  ];

  return (
    <div ref={containerRef} className="page-shell page-dashboard mx-auto max-w-7xl">
      <div className="dashboard-hero mb-6 grid gap-6 rounded-[28px] p-6 lg:grid-cols-[1.45fr_.95fr] lg:p-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200/80">Network readiness</p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight text-white lg:text-5xl">
            A field workspace that keeps surveys, floor plans, and RF evidence moving.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Built for fast decision-making: less hunting through screens, more confidence in what the crew needs to do next.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => navigate('/survey')} className="primary-action">
              <Plus size={18} /> Start Survey
            </button>
            <button onClick={() => navigate('/floor-plans')} className="secondary-action secondary-action-dark">
              <Map size={18} /> Review Plans
            </button>
          </div>
        </div>

        <div className="dashboard-signal-panel rounded-[24px] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-200">Workspace readiness</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-white">{workspace.readinessPercent}% prepared</h2>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 text-cyan-200">
              <Wifi size={22} />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              ['Sites live', String(workspace.openSites)],
              ['Plans staged', workspace.hasFloorPlan ? '01' : '00'],
              ['Pins mapped', String(workspace.pinCount).padStart(2, '0')],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-semibold text-white">{value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 h-24 rounded-[20px] border border-white/10 bg-white/5 p-4">
            <div className="flex h-full items-end gap-2">
              {readinessBars.map((value, index) => (
                <div key={value} className="flex-1 rounded-full bg-cyan-300/20">
                  <div
                    className="w-full rounded-full bg-gradient-to-t from-cyan-300 via-sky-300 to-white"
                    style={{ height: `${value}%` }}
                  />
                  <span className="sr-only">Day {index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <button key={stat.title} onClick={() => navigate(stat.path)} className="stat-card metric-card p-5 text-left">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-2 text-sm font-medium text-slate-500">{stat.title}</p>
                <h3 className="count-up text-3xl font-semibold text-slate-900" data-target={stat.target}>{stat.value}</h3>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">{stat.icon}</div>
            </div>
            <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
              <div className="flex items-center">
              <TrendingUp size={14} className="mr-1 text-emerald-500" />
              <span>{stat.trend}</span>
              </div>
              <ArrowUpRight size={16} className="text-slate-400" />
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="dashboard-reveal stat-card metric-card min-h-[340px] p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-display text-xl font-semibold text-slate-900">Workspace progress</h3>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">{workspace.propertyName}</span>
          </div>
          <div className="grid h-[240px] grid-cols-4 items-end gap-3 rounded-[24px] border border-slate-100 bg-white/70 p-5">
            {flowSeries.map((value, index) => (
              <div key={index} className="flex h-full flex-col justify-end gap-2">
                <div className="rounded-t-2xl bg-gradient-to-t from-teal-700 via-cyan-500 to-sky-300 shadow-sm" style={{ height: `${value}%` }} />
                <span className="text-center text-xs font-semibold text-slate-400">{['Sites', 'Plans', 'Pins', 'Survey'][index]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-reveal stat-card metric-card min-h-[340px] p-6">
          <h3 className="mb-4 font-display text-xl font-semibold text-slate-900">Recent activity</h3>
          <div className="space-y-6">
            {activity.map((item, i) => (
              <div key={item.title} className="flex gap-4">
                <div className="mt-1 rounded-2xl bg-slate-950 p-2 text-white">
                  {i % 2 === 0 ? <Activity size={15} /> : <Zap size={15} />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.detail}</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">{item.stamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
