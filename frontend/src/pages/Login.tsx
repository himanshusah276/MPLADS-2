import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ShieldAlert, ArrowRight, UserCheck, Lock, Mail, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('analyst@mospi.gov.in');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const { login, switchPersona, demoUsers, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid government credentials. Please check your user ID or select a demo role below.');
    }
  };

  const handleQuickPersona = async (role: Role, userEmail: string) => {
    await switchPersona(role, userEmail);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded bg-[#1B4F8C] flex items-center justify-center text-white shadow-md">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-[#1A1D22] tracking-tight">
          MPLADS Sentinel
        </h2>
        <p className="mt-1 text-xs text-[#5B6270] uppercase font-semibold tracking-wider">
          Ministry of Statistics & Programme Implementation (MoSPI) · DIID
        </p>
        <p className="text-xs text-[#8A92A0] mt-0.5">
          AI-Powered Anomaly, Fraud & Inefficiency Detection Platform (SIH 2026 #26102)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-[#E3E6EA] rounded-md">
          <form className="space-y-4" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 rounded bg-[#FCE8E6] border border-[#F5C2BE] text-xs text-[#B3261E] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#1A1D22] mb-1">
                Official Email / Gov ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8A92A0] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="analyst@mospi.gov.in"
                  className="w-full bg-[#F7F8FA] border border-[#E3E6EA] rounded pl-9 pr-3 py-2 text-xs text-[#1A1D22] focus:outline-none focus:border-[#1B4F8C] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1D22] mb-1">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8A92A0] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#F7F8FA] border border-[#E3E6EA] rounded pl-9 pr-3 py-2 text-xs text-[#1A1D22] focus:outline-none focus:border-[#1B4F8C] focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-[#1B4F8C] hover:bg-[#143D6D] text-white py-2 px-4 rounded text-xs font-semibold shadow-sm transition-colors"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign in to Oversight Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Launchpad for Judges */}
          <div className="mt-8 pt-6 border-t border-[#E3E6EA]">
            <div className="text-xs font-bold text-[#1A1D22] uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>SIH 2026 Demo Launchpad (1-Click Persona Access)</span>
              <span className="text-[10px] text-[#1B4F8C] bg-[#E8F0FA] px-2 py-0.5 rounded font-mono">6 Personas</span>
            </div>
            <p className="text-[11px] text-[#5B6270] mb-3 leading-relaxed">
              Experience the platform through distinct administrative hierarchy scopes:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {demoUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleQuickPersona(u.role, u.email)}
                  className="text-left p-2.5 rounded border border-[#E3E6EA] hover:border-[#1B4F8C] hover:bg-[#F0F2F5] transition-all flex items-start gap-2 group"
                >
                  <UserCheck className="w-4 h-4 text-[#1B4F8C] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0">
                    <div className="font-semibold text-[#1A1D22] truncate text-xs">{u.name}</div>
                    <div className="text-[10px] text-[#5B6270] truncate">{u.scope_description || u.role}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-[#8A92A0]">
          Strictly for authorized government auditors & MoSPI administrative officials. Immutable audit trails active.
        </div>
      </div>
    </div>
  );
};

export default Login;
