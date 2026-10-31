import React from 'react';
import { ActiveView } from '../types';
import { Shield } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: ActiveView) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-[#05080f] border-t border-slate-900 py-12 text-sm text-slate-400">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-8 border-b border-slate-900/80">
          {/* Logo & One-line Description */}
          <div className="flex flex-col gap-2 max-w-md">
            <div className="flex items-center gap-2 text-slate-100 font-semibold tracking-tight">
              <div className="w-6 h-6 rounded-md bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span>CredentialChain</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tamper-evident academic credential verification and registry for modern institutions.
            </p>
          </div>

          {/* Links: Verify Credential, Student Portal, Admin Portal */}
          <nav className="flex flex-wrap items-center gap-6 text-xs font-medium">
            <button
              onClick={() => {
                onNavigate('verify');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Verify Credential
            </button>
            <button
              onClick={() => {
                onNavigate('student');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Student Portal
            </button>
            <button
              onClick={() => {
                onNavigate('admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Admin Portal
            </button>
          </nav>
        </div>

        {/* Compact Copyright Line */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 font-mono">
          <p>© {new Date().getFullYear()} CredentialChain. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span>Cryptographic Integrity</span>
            <span aria-hidden="true">·</span>
            <span>W3C Verifiable Credentials</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
