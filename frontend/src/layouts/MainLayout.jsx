import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { LayoutDashboard, Map, FileText, Settings, LogOut, Building2, ClipboardCheck, RadioTower, UserRound } from 'lucide-react';
import { canAccessPath, clearSession } from '../auth';
import { useInteractiveEffects } from '../hooks/useInteractiveEffects';
import { getWorkspaceSnapshot } from '../workspaceSnapshot';

const MainLayout = () => {
  const rootRef = useRef(null);
  const sidebarRef = useRef(null);
  const contentRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [workspace, setWorkspace] = useState(() => getWorkspaceSnapshot());
  const [profile, setProfile] = useState(() => {
    const savedSettings = localStorage.getItem('siteSurveySettings');
    const savedUser = localStorage.getItem('siteSurveyUser');
    const settings = savedSettings ? JSON.parse(savedSettings) : {};
    const user = savedUser ? JSON.parse(savedUser) : {};
    const displayName = settings.name && settings.name !== 'John Doe' ? settings.name : user.name || user.email?.split('@')[0] || 'Demo Engineer';
    return {
      name: displayName,
      role: settings.role || user.role || 'Field Engineer',
      theme: settings.theme || 'Light',
    };
  });

  useInteractiveEffects(rootRef);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.fromTo(sidebarRef.current, { x: -250, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' })
        .fromTo(contentRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4');

      gsap.fromTo(
        '.shell-nav-link',
        { opacity: 0, x: -14 },
        { opacity: 1, x: 0, duration: 0.42, stagger: 0.045, ease: 'power2.out', delay: 0.18 }
      );

      gsap.to('.ambient-panel', {
        yPercent: -10,
        ease: 'none',
        stagger: 0.08,
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.1,
        },
      });
    });

    return () => ctx.revert();
  }, [location.pathname]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.app-header',
        { y: -10, opacity: 0.72 },
        { y: 0, opacity: 1, duration: 0.36, ease: 'power2.out' }
      );

      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 16, filter: 'blur(8px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.46, ease: 'power3.out' }
      );

      requestAnimationFrame(() => {
        gsap.core.globals().ScrollTrigger?.refresh();
      });
    });

    return () => ctx.revert();
  }, [location.pathname]);

  useEffect(() => {
    const syncProfile = () => {
      const savedSettings = localStorage.getItem('siteSurveySettings');
      const savedUser = localStorage.getItem('siteSurveyUser');
      const settings = savedSettings ? JSON.parse(savedSettings) : {};
      const user = savedUser ? JSON.parse(savedUser) : {};
      const displayName = settings.name && settings.name !== 'John Doe' ? settings.name : user.name || user.email?.split('@')[0] || 'Demo Engineer';
      setProfile({
        name: displayName,
        role: settings.role || user.role || 'Field Engineer',
        theme: settings.theme || 'Light',
      });
      setWorkspace(getWorkspaceSnapshot());
    };

    window.addEventListener('site-survey-settings-updated', syncProfile);
    window.addEventListener('storage', syncProfile);
    window.addEventListener('site-survey-workspace-updated', syncProfile);
    return () => {
      window.removeEventListener('site-survey-settings-updated', syncProfile);
      window.removeEventListener('storage', syncProfile);
      window.removeEventListener('site-survey-workspace-updated', syncProfile);
    };
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Building2 size={20} />, label: 'Properties', path: '/properties' },
    { icon: <Map size={20} />, label: 'Floor Plans', path: '/floor-plans' },
    { icon: <RadioTower size={20} />, label: 'Mapping', path: '/mapping' },
    { icon: <ClipboardCheck size={20} />, label: 'Survey', path: '/survey' },
    { icon: <FileText size={20} />, label: 'Reports', path: '/reports' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
  ].filter((item) => canAccessPath(profile.role, item.path));

  const pageTheme = {
    '/dashboard': 'route-dashboard',
    '/properties': 'route-properties',
    '/floor-plans': 'route-plans',
    '/mapping': 'route-map',
    '/survey': 'route-survey',
    '/reports': 'route-reports',
    '/settings': 'route-settings',
    '/profile': 'route-profile',
  }[location.pathname] || 'route-dashboard';

  return (
    <div ref={rootRef} className={`app-frame ${pageTheme} ${profile.theme === 'Dark' ? 'theme-dark' : 'theme-light'} flex min-h-screen font-sans`}>
      <div className="ambient-stage pointer-events-none fixed inset-0 overflow-hidden">
        <div className="ambient-grid" />
        <div className="ambient-panel ambient-panel-one" />
        <div className="ambient-panel ambient-panel-two" />
        <div className="ambient-panel ambient-panel-three" />
      </div>
      <aside ref={sidebarRef} className="shell-sidebar sticky top-4 z-10 m-4 hidden h-[calc(100vh-2rem)] w-[292px] flex-col overflow-hidden rounded-[24px] px-5 py-6 text-white shadow-2xl xl:flex">
        <div className="mb-8 flex items-center gap-4">
          <div className="brand-mark flex h-12 w-12 items-center justify-center rounded-2xl font-black text-white shadow-lg">N</div>
          <div>
            <span className="block font-display text-xl font-bold tracking-tight text-white">NetGrid Survey</span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/80">Site operations</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item, index) => {
            const isActive = location.pathname.includes(item.path);
            return (
              <Link
                key={index}
                to={item.path}
                className={`shell-nav-link ${isActive ? 'is-active' : ''}`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="shell-status mt-6 rounded-[24px] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">System health</p>
            <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200">{workspace.systemHealth}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-2xl font-semibold text-white">{workspace.openSites}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Open sites</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{workspace.readinessPercent}%</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Readiness</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="relative flex min-h-screen flex-1 flex-col">
        <header className="app-header sticky top-4 z-20 mx-4 mt-4 flex min-h-[76px] items-center justify-between rounded-[20px] border px-5 py-4 backdrop-blur-xl lg:px-7">
          <div className="flex items-center gap-4">
            <div className="brand-mark flex h-11 w-11 items-center justify-center rounded-2xl font-black text-white shadow-lg xl:hidden">
              N
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-slate-950">NetGrid Survey</p>
              <p className="text-xs font-medium text-slate-500">Field operations</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="profile-trigger flex items-center gap-3 rounded-2xl px-3 py-2 text-right shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="profile-icon flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg">
                <UserRound size={20} />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{profile.name}</p>
                <p className="text-xs font-medium text-slate-500">{profile.role}</p>
              </div>
            </button>
            <button onClick={handleLogout} className="signout-action flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold">
              <LogOut size={17} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        <div ref={contentRef} className="flex-1 px-4 pb-4 pt-4 lg:px-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
