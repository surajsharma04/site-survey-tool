import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import FloorPlans from './pages/FloorPlans';
import CanvasMap from './pages/CanvasMap';
import Checklist from './pages/Checklist';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import MainLayout from './layouts/MainLayout';
import { canAccessPath, getDefaultPathForRole, getSession, removeReadablePasswords } from './auth';

removeReadablePasswords();

const Unauthorized = () => {
  const session = getSession();
  return (
    <div className="page-shell page-reports mx-auto flex min-h-130 max-w-4xl flex-col items-center justify-center text-center">
      <p className="text-sm font-black uppercase tracking-[0.24em] text-rose-500">Access restricted</p>
      <h1 className="mt-3 text-4xl font-black text-slate-950">This role cannot open that workspace.</h1>
      <p className="mt-3 max-w-xl text-slate-500">
        {session?.role || 'Your role'} does not have permission for this section. Use the sidebar to open the tools available to you.
      </p>
      <a href={getDefaultPathForRole(session?.role)} className="primary-action mt-8">Go to my dashboard</a>
    </div>
  );
};

const ProtectedLayout = () => {
  return getSession()?.token ? <MainLayout /> : <Navigate to="/login" replace />;
};

const RoleRoute = ({ path, children }) => {
  const session = getSession();
  if (!session?.token) return <Navigate to="/login" replace />;
  return canAccessPath(session.role, path) ? children : <Unauthorized />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<ProtectedLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<RoleRoute path="/dashboard"><Dashboard /></RoleRoute>} />
          <Route path="properties" element={<RoleRoute path="/properties"><Properties /></RoleRoute>} />
          <Route path="floor-plans" element={<RoleRoute path="/floor-plans"><FloorPlans /></RoleRoute>} />
          <Route path="mapping" element={<RoleRoute path="/mapping"><CanvasMap /></RoleRoute>} />
          <Route path="survey" element={<RoleRoute path="/survey"><Checklist /></RoleRoute>} />
          <Route path="reports" element={<RoleRoute path="/reports"><Reports /></RoleRoute>} />
          <Route path="settings" element={<RoleRoute path="/settings"><Settings /></RoleRoute>} />
          <Route path="profile" element={<RoleRoute path="/profile"><Profile /></RoleRoute>} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
