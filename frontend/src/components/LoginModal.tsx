import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  FileCheck,
  MapPin,
  Sparkles
} from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { showLoginModal, setShowLoginModal, login, quickLogin, demoRoles, currentUser } = useApp();
  const [tab, setTab] = useState<'quick' | 'credentials'>('quick');
  const [username, setUsername] = useState<string>('ministry');
  const [password, setPassword] = useState<string>('admin123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [captchaCode, setCaptchaCode] = useState<string>('');
  const [userCaptcha, setUserCaptcha] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loadingUser, setLoadingUser] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Generate random 5-char captcha
  const refreshCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 5; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(res);
    setUserCaptcha('');
  };

  useEffect(() => {
    if (showLoginModal) {
      refreshCaptcha();
      setErrorMsg('');
      setLoadingUser(null);
    }
  }, [showLoginModal]);

  if (!showLoginModal) return null;

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (userCaptcha.toUpperCase() !== captchaCode) {
      setErrorMsg('Invalid Security CAPTCHA code. Please enter the characters shown.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      refreshCaptcha();
      return;
    }

    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid username or password credentials.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      refreshCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (uname: string) => {
    setLoadingUser(uname);
    setErrorMsg('');
    try {
      await quickLogin(uname);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate quick login role.');
    } finally {
      setLoadingUser(null);
    }
  };

  const roleMeta: Record<string, { icon: any; color: string; desc: string }> = {
    ministry: {
      icon: Building2,
      color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40",
      desc: "Full National Oversight, All-India Leaderboard & Scheme Fund Flow"
    },
    auditor: {
      icon: FileCheck,
      color: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/40",
      desc: "Statutory Anomaly Triage, Audit Trail & Official CAG PDF Exports"
    },
    state_nodal: {
      icon: MapPin,
      color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40",
      desc: "State Nodal Cell Oversight, Agency Scrutiny & District Progress"
    },
    district_authority: {
      icon: MapPin,
      color: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/40",
      desc: "District Magistrate Work Sanctions, Physical Verification & Estimates"
    },
    mp: {
      icon: User,
      color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40",
      desc: "Constituency Recommendations & Pre-Sanction Compliance Simulator"
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div 
        className={`bg-gov-card border border-gov-border rounded-2xl w-full max-w-2xl shadow-gov-modal overflow-hidden animate-scale-in ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Official Indian Tricolor Ribbon */}
        <div className="h-1.5 w-full flex">
          <div className="flex-1 bg-[#FF9933]"></div>
          <div className="flex-1 bg-[#FFFFFF] border-y border-slate-200"></div>
          <div className="flex-1 bg-[#138808]"></div>
        </div>

        {/* Modal Header */}
        <div className="p-5 bg-gov-card-muted border-b border-gov-border flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#0a2540] border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-gov-primary tracking-tight">
                  eSAKSHI National Single Sign-On (NSSO)
                </h2>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  Jan Parichay Gateway
                </span>
              </div>
              <p className="text-xs text-gov-muted font-medium mt-0.5">
                Government of India • Ministry of Statistics & Programme Implementation (MoSPI)
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowLoginModal(false)}
            className="p-1.5 rounded-full text-gov-muted hover:text-gov-primary bg-gov-card hover:bg-gov-card-muted border border-gov-border transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-6 pt-4 border-b border-gov-border flex space-x-4 text-xs font-bold">
          <button
            onClick={() => setTab('quick')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              tab === 'quick'
                ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gov-muted hover:text-gov-primary'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Click Official Role Switcher</span>
          </button>
          <button
            onClick={() => setTab('credentials')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              tab === 'credentials'
                ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gov-muted hover:text-gov-primary'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Password & Security CAPTCHA</span>
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6">
          {tab === 'quick' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gov-muted font-semibold uppercase tracking-wider">
                  Select Official Stakeholder Account:
                </span>
                <span className="text-[11px] text-gov-muted">
                  Instant Evaluator Access
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {demoRoles.map((user) => {
                  const meta = roleMeta[user.role] || {
                    icon: User,
                    color: "bg-slate-500/15 text-slate-700 border-slate-500/40",
                    desc: "Official Stakeholder Access"
                  };
                  const Icon = meta.icon;
                  const isCurrent = currentUser.username === user.username;
                  const isLoading = loadingUser === user.username;

                  return (
                    <div
                      key={user.username}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 card-hover-lift ${
                        isCurrent
                          ? 'bg-orange-500/10 border-orange-500/50 shadow-xs'
                          : 'bg-gov-card-muted border-gov-border hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${meta.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-gov-primary truncate">
                              {user.full_name}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded-full font-bold uppercase shrink-0">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 truncate">
                            {user.role_title}
                          </div>
                          <div className="text-[10px] text-gov-muted truncate font-medium">
                            {meta.desc}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleQuickLogin(user.username)}
                        disabled={isLoading || submitting}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                          isCurrent
                            ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                            : 'bg-gov-card hover:bg-orange-600 hover:text-white hover:border-orange-600 text-gov-primary border-gov-border'
                        }`}
                      >
                        {isLoading ? (
                          <>
                            <RotateCw className="w-3 h-3 animate-spin" />
                            <span>Authenticating...</span>
                          </>
                        ) : isCurrent ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Logged In</span>
                          </>
                        ) : (
                          <span>Sign In</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleCredentialSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gov-primary block mb-1">
                  Official GovTech Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gov-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. ministry, auditor, sna_mh, da_nashik"
                    className="w-full bg-gov-card text-xs text-gov-primary pl-9 pr-3 py-2.5 rounded-lg border border-gov-border focus:outline-none focus:border-orange-500 font-medium shadow-xs"
                    required
                  />
                </div>
                <p className="text-[10px] text-gov-muted mt-1 font-medium">
                  Seed credentials: <code className="font-mono text-orange-600">ministry / admin123</code>, <code className="font-mono text-orange-600">auditor / audit123</code>, <code className="font-mono text-orange-600">da_nashik / dist123</code>
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-gov-primary block mb-1">
                  Security Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gov-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full bg-gov-card text-xs text-gov-primary pl-9 pr-10 py-2.5 rounded-lg border border-gov-border focus:outline-none focus:border-orange-500 font-medium shadow-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gov-muted hover:text-gov-primary cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Security CAPTCHA Challenge */}
              <div className="bg-gov-card-muted p-3.5 rounded-xl border border-gov-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gov-primary">
                    Security Verification CAPTCHA
                  </span>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="text-xs text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Refresh Code</span>
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="bg-slate-900 text-amber-400 px-4 py-2 rounded-lg font-mono font-black text-lg tracking-widest select-none border border-slate-700 shadow-inner">
                    {captchaCode}
                  </div>
                  <input
                    type="text"
                    value={userCaptcha}
                    onChange={(e) => setUserCaptcha(e.target.value)}
                    placeholder="Enter 5-character code..."
                    className="flex-1 bg-gov-card text-xs text-gov-primary px-3 py-2.5 rounded-lg border border-gov-border focus:outline-none focus:border-orange-500 font-mono uppercase tracking-wider font-bold shadow-xs"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>{submitting ? 'Verifying Credentials...' : 'Authenticate & Sign In'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Official Footer */}
        <div className="p-3.5 bg-gov-card-muted border-t border-gov-border text-center text-[11px] text-gov-muted flex items-center justify-between font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            256-Bit National Encryption
          </span>
          <span>eSAKSHI v2.4 • MoSPI / NIC</span>
        </div>
      </div>
    </div>
  );
};
