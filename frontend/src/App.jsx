import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import UserManagement from "../pages/UserManagement";
import { API_URL } from "../config/api";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { Toaster } from "react-hot-toast";

function AppContent() {
  const [healthStatus, setHealthStatus] = useState({ core: 'loading', db: 'loading' });
  const { user, refreshSession, loading, setLoading } = useAuth();
  async function withRetry(fn, attempts = 5, delayMs = 1000) {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === attempts - 1) throw error;
        await new Promise(res => setTimeout(res, delayMs));
      }
    }
  }
  useEffect(() => {
    async function initialize() {
      try {
        // 1. Health Checks
        const [core, db] = await withRetry(() =>
          Promise.all([
            fetch(`${API_URL}/health`).then(r => r.json()),
            fetch(`${API_URL}/health/db`).then(r => r.json()),
          ])
        );

        setHealthStatus({ core: core.status, db: db.status });

        const healthOk =
          core.status === 'ok' &&
          (db.status === 'healthy' || db.status === 'ok');

        // 2. Silent Refresh (only if health is ok)
        if (healthOk) {
          try {
            await refreshSession();
          } catch (e) {
            console.log("No active session");
          }
        }
      } catch (error) {
        console.error("Initialization failed:", error);
        setHealthStatus({ core: 'error', db: 'error' });
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  if (healthStatus.core === 'loading' || loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading System...</p>
      </div>
    );
  }

  if (healthStatus.core !== 'ok' || (healthStatus.db !== 'healthy' && healthStatus.db !== 'ok')) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-200">
        <div className="text-center p-8 glass-card border-red-500/20">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Service Unavailable</h1>
          <p className="text-slate-400">Connection to backend or database lost. Please retry later.</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
      <Route path="/admin/users" element={user?.role === 'admin' ? <UserManagement /> : <Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster 
          position="bottom-right" 
          toastOptions={{ 
            duration: 3000,
            style: {
              background: '#0f172a',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '12px 20px',
              fontSize: '14px',
              backdropFilter: 'blur(8px)',
            },
            success: {
              iconTheme: {
                primary: '#3b82f6',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }} 
        />
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;