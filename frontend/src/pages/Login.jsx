import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import gsap from 'gsap';
import { Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles, Wifi } from 'lucide-react';
import { createSession, getRegisteredUsers, needsPasswordReset, upgradeLegacyPassword, verifyPassword } from '../auth';
import { authApi } from '../api';
import { useInteractiveEffects } from '../hooks/useInteractiveEffects';

const Login = () => {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const formRef = useRef(null);
  const bgRef = useRef(null);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useInteractiveEffects(rootRef);
  
  useEffect(() => {
    // Background floating animation
    gsap.to('.shape', {
      y: 'random(-50, 50)',
      x: 'random(-50, 50)',
      rotation: 'random(-45, 45)',
      duration: 'random(3, 5)',
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      stagger: 0.2
    });

    // Form entrance animation
    gsap.fromTo(formRef.current, 
      { opacity: 0, y: 50, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.5)' }
    );
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.currentTarget.email.value;
    const password = e.currentTarget.password.value;
    try {
      const authenticatedUser = await authApi.login(email, password);
      createSession(authenticatedUser);
      localStorage.setItem('siteSurveySettings', JSON.stringify({
        name: authenticatedUser.name,
        role: authenticatedUser.role,
        notifications: true,
        mfa: true,
        theme: 'Dark',
        timezone: 'Asia/Calcutta',
      }));
      navigate('/dashboard');
      return;
    } catch {
      // Keep the local demo account flow available when the API is not running.
    }

    const registeredUser = getRegisteredUsers().find((user) => user.email.toLowerCase() === email.toLowerCase());

    if (!registeredUser) {
      setMessage('No account exists for this email. Please sign up first.');
      return;
    }

    if (needsPasswordReset(registeredUser)) {
      setMessage('For safety, this old local demo account needs to be recreated. Use Sign Up with the same email to replace it without storing a readable password.');
      return;
    }

    const passwordMatches = await verifyPassword(registeredUser, password);

    if (!passwordMatches) {
      setMessage('Invalid password. Please check your credentials.');
      return;
    }

    if (registeredUser.password) {
      await upgradeLegacyPassword(registeredUser.email, password);
    }

    const existingSettings = JSON.parse(localStorage.getItem('siteSurveySettings') || '{}');
    createSession(registeredUser);
    localStorage.setItem('siteSurveySettings', JSON.stringify({
      ...existingSettings,
      name: registeredUser.name,
      role: registeredUser.role,
      notifications: existingSettings.notifications ?? true,
      mfa: existingSettings.mfa ?? true,
      theme: existingSettings.theme || 'Dark',
      timezone: existingSettings.timezone || 'Asia/Calcutta',
    }));
    navigate('/dashboard');
  };

  return (
    <div ref={rootRef} className="auth-screen auth-screen-login min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-6 lg:px-6">
      <div ref={bgRef} className="auth-kinetic absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="shape auth-plane auth-plane-one" />
        <div className="shape auth-plane auth-plane-two" />
        <div className="shape auth-plane auth-plane-three" />
      </div>

      <div ref={formRef} className="auth-shell auth-card z-10 grid w-full max-w-7xl overflow-hidden rounded-[2rem] border border-white/15 text-white shadow-2xl lg:grid-cols-[1.08fr_.92fr]">
        <section className="auth-showcase auth-showcase-login relative hidden min-h-[700px] overflow-hidden p-10 lg:block">
          <div className="brand-mark mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 shadow-lg">
            <span className="text-3xl font-black">N</span>
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.32em] text-cyan-200">NetGrid Survey</p>
          <h1 className="mt-5 max-w-xl font-display text-6xl font-semibold leading-[1.02] tracking-tight">Review the site. Trust the handoff.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Sign in to keep plans, RF notes, room readiness, and install blockers visible without burying the team in extra clicks.
          </p>

          <div className="mt-8 grid max-w-lg gap-3">
            {[
              ['Ops clarity', 'A compact command view for engineers, planners, and managers.', ShieldCheck],
              ['Fast signal reads', 'Track readiness, imports, and drafts from one focused workspace.', Wifi],
              ['Polished flow', 'Sharper hierarchy, smoother motion, and less unnecessary scrolling.', Sparkles],
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
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200/80">Welcome back</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white">Open the survey workspace</h2>
            <p className="mt-2 font-medium text-slate-300">Use your account or the local demo sign-in flow if the API is offline.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-100 mb-2">Email Address</label>
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

            <div>
              <label className="block text-sm font-bold text-slate-100 mb-2">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400 group-focus-within:text-primary-400 transition-colors" />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="auth-input block w-full pl-11 pr-12 py-3.5"
                  placeholder="********"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-300 transition-colors hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center">
                <input type="checkbox" className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-white/10 rounded bg-dark-800" />
                <label className="ml-2 block text-sm font-medium text-slate-100">Remember me</label>
              </div>
              <button type="button" onClick={() => setMessage('Password reset link prepared for this demo workspace.')} className="text-sm font-bold text-emerald-200 hover:text-white transition-colors">Forgot password?</button>
            </div>

            {message && <p className="rounded-xl bg-white/10 px-4 py-3 text-sm text-emerald-200">{message}</p>}

            <button
              type="submit"
              className="auth-submit w-full flex items-center justify-center gap-2 py-4 px-4 mt-8 border border-transparent rounded-xl text-sm font-black text-white transition-all transform hover:-translate-y-1"
            >
              Sign In <ArrowRight size={18} />
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-slate-200">
            Don't have an account?{' '}
            <Link to="/signup" className="font-black text-emerald-200 underline decoration-emerald-300/70 underline-offset-4 hover:text-white transition-colors">
              Sign Up
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Login;
