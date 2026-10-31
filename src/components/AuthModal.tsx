import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, GraduationCap, Building2, ArrowRight, KeyRound, AlertCircle } from 'lucide-react';
import { apiClient } from '../services/api';
import { authStore } from '../services/store';
import { User, UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: UserRole) => void;
  initialRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole = 'student',
}) => {
  // Modes: 'login' | 'register_student' | 'register_admin'
  const [activeTab, setActiveTab] = useState<'login' | 'register_student' | 'register_admin'>(
    initialRole === 'admin' ? 'login' : 'register_student'
  );

  // Fields
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institution, setInstitution] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (initialRole === 'admin') {
        setActiveTab('login');
      }
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === 'login') {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please enter both email and password.');
        }
        const res = await apiClient.login({ email, password });
        authStore.setCurrentUser(res.user);
        onClose();
        onSuccess(res.user.role);
      } else if (activeTab === 'register_student') {
        if (!name.trim() || !studentId.trim() || !email.trim() || !password.trim()) {
          throw new Error('All registration fields are required.');
        }
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters.');
        }
        const res = await apiClient.registerStudent({
          name,
          studentId,
          email,
          password,
        });
        authStore.setCurrentUser(res.user);
        onClose();
        onSuccess('student');
      } else if (activeTab === 'register_admin') {
        if (!name.trim() || !email.trim() || !password.trim() || !institution.trim()) {
          throw new Error('All administrator registration fields are required.');
        }
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters.');
        }
        const res = await apiClient.provisionAdmin({
          name,
          email,
          password,
          institution,
        });
        authStore.setCurrentUser(res.user);
        onClose();
        onSuccess('admin');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 md:p-8 rounded-2xl bg-[#091122] border border-cyan-500/20 shadow-2xl shadow-cyan-950/40">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Cryptographic Portal Access</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
            {activeTab === 'login'
              ? 'Account Sign In'
              : activeTab === 'register_student'
              ? 'Student Registration'
              : 'University Admin Sign Up'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {activeTab === 'login'
              ? 'Enter your registered email and password to access the platform.'
              : activeTab === 'register_student'
              ? 'Create a student account to view, share, and verify your credentials.'
              : 'Register an official university administrator account to issue and manage degrees.'}
          </p>
        </div>

        {/* Tab Controls: Sign In, Student Signup, Admin Signup */}
        <div className="grid grid-cols-3 rounded-lg bg-slate-900/90 p-1 border border-slate-800 mb-5 text-xs font-semibold gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError(null);
            }}
            className={`py-1.5 px-1 rounded-md transition-all cursor-pointer text-center ${
              activeTab === 'login'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register_student');
              setError(null);
            }}
            className={`py-1.5 px-1 rounded-md transition-all cursor-pointer text-center ${
              activeTab === 'register_student'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Student Sign Up
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register_admin');
              setError(null);
            }}
            className={`py-1.5 px-1 rounded-md transition-all cursor-pointer text-center ${
              activeTab === 'register_admin'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Admin Sign Up
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name for Registration / Provisioning */}
          {activeTab !== 'login' && (
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter official name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          )}

          {/* Student ID for Student Registration */}
          {activeTab === 'register_student' && (
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                University Student ID / Roll Number *
              </label>
              <input
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. STU-2026-0042"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm font-mono focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          )}

          {/* Institution Name for Admin Registration */}
          {activeTab === 'register_admin' && (
            <div>
              <label className="block text-[11px] font-mono text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>Issuing University / Academic Institution *</span>
              </label>
              <input
                type="text"
                required
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. Stanford University, MIT, Harvard"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.edu"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Password {activeTab !== 'login' && '(Minimum 8 characters)'} *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-cyan-500/20 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {activeTab === 'login'
                    ? 'Authenticate & Continue'
                    : activeTab === 'register_student'
                    ? 'Create Student Account'
                    : 'Create University Admin Account'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500">
            {activeTab === 'login' ? (
              <span className="flex items-center justify-center gap-3">
                <span>
                  New student?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('register_student')}
                    className="text-cyan-400 hover:underline cursor-pointer"
                  >
                    Student Signup
                  </button>
                </span>
                <span>·</span>
                <span>
                  University admin?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('register_admin')}
                    className="text-cyan-400 hover:underline cursor-pointer"
                  >
                    Admin Signup
                  </button>
                </span>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-cyan-400 hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
