import React, { useState } from 'react';
import {
  Cookie,
  Shield,
  User,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const LoginPage: React.FC = () => {
  const { login, switchRole } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const rolePresets: Array<{
    role: UserRole;
    name: string;
    designation: string;
    username: string;
    pass: string;
    color: string;
    accessDesc: string;
  }> = [
    {
      role: 'admin',
      name: 'Rajesh Kumar',
      designation: 'Managing Director (Admin)',
      username: 'admin',
      pass: 'admin123',
      color: 'border-purple-200 bg-purple-50/60 hover:bg-purple-50 text-purple-900',
      accessDesc: 'Full Access to all 9 system pages & factory audits',
    },
    {
      role: 'salesman',
      name: 'Senthil Nathan',
      designation: 'Senior Sales Executive',
      username: 'salesman',
      pass: 'sales123',
      color: 'border-blue-200 bg-blue-50/60 hover:bg-blue-50 text-blue-900',
      accessDesc: 'Dashboard, Products catalog, Customers directory, Order booking',
    },
    {
      role: 'production_supervisor',
      name: 'Muthuraman',
      designation: 'Plant Production Supervisor',
      username: 'supervisor',
      pass: 'prod123',
      color: 'border-amber-200 bg-amber-50/60 hover:bg-amber-50 text-amber-900',
      accessDesc: 'Dashboard, Products catalog, Inventory stock, Batch production & wastage',
    },
    {
      role: 'accountant',
      name: 'Lakshmi Narayanan',
      designation: 'Chief Accountant',
      username: 'accountant',
      pass: 'acc123',
      color: 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 text-emerald-900',
      accessDesc: 'Dashboard, Customers ledger, 5% GST Invoices, Payments, Reports',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Left Side: Brand & Factory Info */}
        <div className="lg:col-span-5 bg-gradient-to-b from-blue-700 via-blue-800 to-indigo-900 text-white p-8 flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white mb-6 shadow-lg">
              <Cookie className="w-8 h-8 text-blue-200" />
            </div>

            <span className="text-[11px] font-bold tracking-widest uppercase text-blue-300">
              South Indian Snacks Manufacturing
            </span>
            <h1 className="text-2xl font-extrabold mt-1 tracking-tight text-white leading-tight">
              Order-to-Audit System
            </h1>
            <p className="text-xs text-blue-200/90 mt-2 leading-relaxed">
              Enterprise management software for traditional snack makers. Tracks batches of <b>Murukku, Mixture, Banana Chips and Sweets</b> with raw material reconciliation and 5% GST tax audit compliance.
            </p>

            <div className="mt-6 space-y-2.5">
              <div className="flex items-center gap-2 text-xs text-blue-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Handcrafted Murukku & Mixture Batch Logging</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Automated Yield & Wastage Loss % Calculation</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>5% GST Billing (TN CGST/SGST vs Interstate IGST)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Audit Excel & PDF Reports with 1-Click Export</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 text-[11px] text-blue-300 flex items-center justify-between">
            <span>Production Plant: Chennai, Tamil Nadu</span>
            <span>Version 1.0</span>
          </div>
        </div>

        {/* Right Side: Role Selector & Login Form */}
        <div className="lg:col-span-7 p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Sign in to your account</h2>
                <p className="text-xs text-slate-500">
                  Select a predefined role or enter your credentials
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Role-Based Access
              </span>
            </div>

            {/* Quick 1-Click Role Login Buttons */}
            <div className="mb-5 space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Quick 1-Click Demo Login:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {rolePresets.map((preset) => (
                  <button
                    key={preset.role}
                    type="button"
                    onClick={() => {
                      setUsername(preset.username);
                      setPassword(preset.pass);
                      switchRole(preset.role);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all hover:scale-[1.01] ${preset.color}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{preset.name}</span>
                      <span className="text-[10px] font-mono uppercase opacity-75">
                        {preset.role.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-90 truncate mt-0.5">{preset.designation}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-1 font-sans">
                      {preset.accessDesc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="bg-white px-2 text-slate-400 font-semibold uppercase">Or Sign In Manually</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            {/* Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enter Application</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 text-center text-[11px] text-slate-400">
            Protected & Audited System • Developed for South Indian Snacks Mfg
          </div>
        </div>
      </div>
    </div>
  );
};
