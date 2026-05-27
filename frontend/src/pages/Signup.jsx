import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import gsap from 'gsap';
import { Mail, Lock, User, ArrowRight, ClipboardCheck, Network, ShieldCheck, Layers3, Sparkles } from 'lucide-react';
import { createPasswordRecord, createSession, getRegisteredUsers, saveRegisteredUsers } from '../auth';
import { authApi } from '../api';
import { useInteractiveEffects } from '../hooks/useInteractiveEffects';

const roles = [
  {
    label: 'Field Engineer',
    desc: 'Primary user: walk sites, check rooms, capture RF, power, access, and install notes.',
    icon: ClipboardCheck,
  },
  {
    label: 'Network Planner',
    desc: 'Review survey data, plan AP placement, cable routes, antennas, and coverage.',
    icon: Network,
  },
  {
    label: 'Operations Manager',
    desc: 'Track readiness, review handoffs, and coordinate site progress across crews.',
    icon: ShieldCheck,
  },
];

const Signup = () => {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const formRef = useRef(null);
  const bgRef = useRef(null);
  const [selectedRole, setSelectedRole] = useState(roles[0].label);
  const [message, setMessage] = useState('');

  useInteractiveEffects(rootRef);
  
  useEffect(() => {
    // Background floating animation
    gsap.to('.shape', {
      y: 'random(-50, 50)',
      x: 'random(-50, 50)',
      rotation: 'random(-45, 45)',
      duration: 'random(5, 10)',
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      stagger: 0.2
    });

    // Card entrance animation
    gsap.fromTo(formRef.current, 
      { opacity: 0, y: 50, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.5)' }
    );
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    const name = e.currentTarget.fullName.value.trim();
    const email = e.currentTarget.email.value.trim();
    const password = e.currentTarget.password.value;
    try {
      await authApi.register({ fullName: name, email, password, role: selectedRole });
      const authenticatedUser = await authApi.login(email, password);
      createSession(authenticatedUser);
      localStorage.setItem('siteSurveySettings', JSON.stringify({
        name,
        role: selectedRole,
        notifications: true,
        mfa: true,
        theme: 'Dark',
        timezone: 'Asia/Calcutta',
      }));
      navigate('/dashboard');
      return;
    } catch {
      // Fall back to local demo registration if the API is unavailable.
    }

    const users = getRegisteredUsers();

    const existingUser = users.find((user) => user.email.toLowerCase() === email.toLowerCase());

    if (existingUser && !existingUser.passwordMigrationRequired) {
      setMessage('An account already exists for this email. Please sign in instead.');
      return;
    }

    const passwordRecord = await createPasswordRecord(password);
    const newUser = { name, email, ...passwordRecord, role: selectedRole, createdAt: new Date().toISOString() };
    saveRegisteredUsers([
      ...users.filter((user) => user.email.toLowerCase() !== email.toLowerCase()),
      newUser,
    ]);
    createSession(newUser);
    localStorage.setItem('siteSurveySettings', JSON.stringify({
      name,
      role: selectedRole,
      notifications: true,
      mfa: true,
      theme: 'Dark',
      timezone: 'Asia/Calcutta',
    }));
    navigate('/dashboard');
  };

  return (
    <div ref={rootRef} className="auth-screen auth-screen-signup min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-6 lg:px-6">
      <div ref={bgRef} className="auth-kinetic absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="shape auth-plane auth-plane-one" />
        <div className="shape auth-plane auth-plane-two" />
        <div className="shape auth-plane auth-plane-three" />
      </div>

      <div ref={formRef} className="auth-shell auth-card z-10 grid w-full max-w-7xl overflow-hidden rounded-[2rem] border border-white/15 text-white shadow-2xl lg:grid-cols-[1.08fr_.92fr]">
        <section className="auth-showcase auth-showcase-signup relative hidden min-h-[760px] overflow-hidden p-10 lg:block">
          <div className="brand-mark mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 shadow-lg">
            <span className="text-3xl font-black">N</span>
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.32em] text-cyan-200">NetGrid Survey</p>
          <h1 className="mt-5 max-w-xl font-display text-6xl font-semibold leading-[1.02] tracking-tight">Give every site visit a cleaner operating system.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Create a role-aware workspace for survey intake, RF capture, and handoff reviews without turning the product into a long-scrolling dashboard maze.
          </p>

          <div className="mt-8 grid max-w-lg gap-3">
            {[
              ['Field-first', 'Designed around what crews need to see now, not everything at once.', ClipboardCheck],
              ['Shared context', 'Planners and managers inherit the same site truth instantly.', Layers3],
              ['Sharper finish', 'More premium visual polish with smoother motion and stronger hierarchy.', Sparkles],
            ].map(([title, text, Icon]) => (
              <div key={title} className="auth-chip flex items-start gap-4 rounded-[22px] p-4">
                <div className="rounded-2xl bg-white/10 p-3 text-cyan-100">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="auth-form-panel p-6 sm:p-8 lg:p-10">
          <div className="mb-8 text-center lg:text-left">
            <div className="brand-mark mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 shadow-lg lg:hidden">
              <span className="text-3xl font-black">N</span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200/80">Create account</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white">Join the survey workspace</h2>
            <p className="mt-2 font-medium text-slate-300">Pick the role that matches how you work with the crew.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User size={18} className="text-slate-400 group-focus-within:text-primary-400 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    name="fullName"
                    className="auth-input block w-full pl-11 pr-4 py-3.5"
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-slate-400 group-focus-within:text-primary-400 transition-colors" />
                  </div>
                  <input 
                    type="email" 
                    name="email"
                    className="auth-input block w-full pl-11 pr-4 py-3.5"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400 group-focus-within:text-primary-400 transition-colors" />
                </div>
                <input 
                  type="password" 
                  name="password"
                  className="auth-input block w-full pl-11 pr-4 py-3.5"
                  placeholder="********"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Choose your role</label>
              <div className="grid gap-3 md:grid-cols-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const active = selectedRole === role.label;
                  return (
                    <button
                      key={role.label}
                      type="button"
                      onClick={() => setSelectedRole(role.label)}
                      className={`role-card min-h-36 rounded-2xl border p-4 text-left transition-all ${active ? 'is-active' : ''}`}
                    >
                      <Icon size={22} className={active ? 'text-emerald-200' : 'text-slate-300'} />
                      <p className="mt-3 text-sm font-bold text-white">{role.label}</p>
                      <p className="mt-2 text-xs leading-5 text-slate-300">{role.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {message && <p className="rounded-2xl border border-rose-300/30 bg-rose-500/15 px-4 py-3 text-sm font-semibold text-rose-100">{message}</p>}

            <button 
              type="submit"
              className="auth-submit w-full flex items-center justify-center gap-2 py-4 px-4 mt-8 border border-transparent rounded-xl text-sm font-black text-white transition-all transform hover:-translate-y-1"
            >
              Sign Up <ArrowRight size={18} />
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-emerald-100 underline decoration-emerald-300/50 underline-offset-4 hover:text-white transition-colors">
              Sign In
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Signup;
