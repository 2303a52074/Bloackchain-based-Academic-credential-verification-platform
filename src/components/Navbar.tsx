import React, { useState, useEffect } from 'react';
import { ActiveView, User } from '../types';
import { authStore } from '../services/store';
import { Shield, ShieldCheck, Menu, X, ArrowRight, LogOut } from 'lucide-react';

interface NavbarProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onOpenAuth: (role?: 'student' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onNavigate,
  onOpenAuth,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(authStore.getCurrentUser());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = authStore.subscribe(() => {
      setCurrentUser(authStore.getCurrentUser());
    });
    return unsubscribe;
  }, []);

  const handleLinkClick = (view: ActiveView) => {
    if (view === 'admin' && currentUser && currentUser.role === 'student') {
      onNavigate('student');
    } else if (view === 'student' && currentUser && currentUser.role === 'admin') {
      onNavigate('admin');
    } else {
      onNavigate(view);
    }
    setMobileMenuOpen(false);
    if (view === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSignOut = () => {
    authStore.signOut();
    onNavigate('home');
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#070b14]/85 border-b border-slate-800/80 transition-colors">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo matching reference */}
        <button
          onClick={() => handleLinkClick('home')}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus-visible:outline-none"
        >
          <div className="w-8 h-8 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-base font-semibold text-slate-100 tracking-tight leading-none group-hover:text-cyan-300 transition-colors">
            Credential<span className="text-cyan-400">Chain</span>
          </span>
        </button>

        {/* Desktop Navigation Links matching reference */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            onClick={() => handleLinkClick('home')}
            className={`relative py-1 transition-colors cursor-pointer ${
              activeView === 'home'
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Home
            {activeView === 'home' && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => handleLinkClick('verify')}
            className={`relative py-1 transition-colors cursor-pointer ${
              activeView === 'verify'
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Verify Credential
            {activeView === 'verify' && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>

          {/* Show Student Portal only to students or unauthenticated visitors */}
          {(!currentUser || currentUser.role === 'student') && (
            <button
              onClick={() => handleLinkClick('student')}
              className={`relative py-1 transition-colors cursor-pointer ${
                activeView === 'student'
                  ? 'text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Student Portal
              {activeView === 'student' && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
              )}
            </button>
          )}

          {/* Show Admin Portal only to administrators or unauthenticated visitors */}
          {(!currentUser || currentUser.role === 'admin') && (
            <button
              onClick={() => handleLinkClick('admin')}
              className={`relative py-1 transition-colors cursor-pointer ${
                activeView === 'admin'
                  ? 'text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin Portal
              {activeView === 'admin' && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
              )}
            </button>
          )}

          {/* About link scrolling to the process section */}
          <button
            onClick={() => {
              if (activeView !== 'home') {
                onNavigate('home');
              }
              setTimeout(() => {
                const el = document.getElementById('process');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 80);
            }}
            className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer py-1"
          >
            About
          </button>
        </nav>

        {/* Right Action: User Session or Sign In */}
        <div className="hidden md:flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <button
                onClick={() => handleLinkClick(currentUser.role === 'admin' ? 'admin' : 'student')}
                className="flex items-center gap-2 text-left group cursor-pointer"
                title={`Go to ${currentUser.role === 'admin' ? 'Admin Portal' : 'Student Portal'}`}
              >
                <div className="w-8 h-8 rounded-full bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-xs font-semibold">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 transition-colors">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400/90 capitalize">
                    {currentUser.role === 'admin' ? currentUser.institution || 'Registrar' : 'Student'}
                  </span>
                </div>
              </button>

              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onOpenAuth('admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-cyan-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-750 hover:border-cyan-500/40 rounded-xl transition-colors cursor-pointer"
                title="University Administrator Sign In"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Admin Sign In</span>
              </button>
              <button
                onClick={() => onOpenAuth('student')}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-400 rounded-xl transition-colors cursor-pointer shadow-sm hover:shadow-cyan-500/20"
              >
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-400 hover:text-slate-200 focus-visible:outline-none cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-6 py-4 bg-[#070b14] border-b border-slate-800 space-y-3">
          <button
            onClick={() => handleLinkClick('home')}
            className={`block w-full text-left py-2 text-sm ${
              activeView === 'home' ? 'text-cyan-400 font-medium' : 'text-slate-300'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleLinkClick('verify')}
            className={`block w-full text-left py-2 text-sm ${
              activeView === 'verify' ? 'text-cyan-400 font-medium' : 'text-slate-300'
            }`}
          >
            Verify Credential
          </button>

          {(!currentUser || currentUser.role === 'student') && (
            <button
              onClick={() => handleLinkClick('student')}
              className={`block w-full text-left py-2 text-sm ${
                activeView === 'student' ? 'text-cyan-400 font-medium' : 'text-slate-300'
              }`}
            >
              Student Portal
            </button>
          )}

          {(!currentUser || currentUser.role === 'admin') && (
            <button
              onClick={() => handleLinkClick('admin')}
              className={`block w-full text-left py-2 text-sm ${
                activeView === 'admin' ? 'text-cyan-400 font-medium' : 'text-slate-300'
              }`}
            >
              Admin Portal
            </button>
          )}

          <div className="pt-2 border-t border-slate-800">
            {currentUser ? (
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-slate-200">{currentUser.name}</p>
                  <p className="text-xs text-cyan-400 font-mono capitalize">
                    {currentUser.role === 'admin' ? currentUser.institution || 'Admin' : 'Student'}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 text-xs text-rose-400 border border-rose-500/30 rounded-lg hover:bg-rose-950/30"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('admin');
                  }}
                  className="w-full py-2 px-4 text-center text-xs font-medium text-slate-300 bg-slate-900 border border-slate-750 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Admin Sign In</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('student');
                  }}
                  className="w-full py-2.5 px-4 text-center text-sm font-medium text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer"
                >
                  Sign In / Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
