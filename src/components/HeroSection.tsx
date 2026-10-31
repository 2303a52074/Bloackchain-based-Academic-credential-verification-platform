import React, { useEffect, useState } from 'react';
import { Hero3DCanvas } from './Hero3DCanvas';
import { apiClient } from '../services/api';
import { BlockchainStatus } from '../types';
import { Search, GraduationCap, ShieldCheck, Box, Lock } from 'lucide-react';

interface HeroSectionProps {
  onExploreVerification?: () => void;
  onGetStarted?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreVerification,
  onGetStarted,
}) => {
  const [hasMounted, setHasMounted] = useState(false);
  const [bcStatus, setBcStatus] = useState<BlockchainStatus | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setHasMounted(true);
    }, 50);

    // Fetch real backend blockchain status
    apiClient
      .getBlockchainStatus()
      .then((status) => setBcStatus(status))
      .catch(() => setBcStatus(null));

    return () => clearTimeout(timeout);
  }, []);

  return (
    <section className="relative w-full overflow-hidden pt-6 sm:pt-8 md:pt-10 pb-12 sm:pb-16 md:pb-20">
      {/* Background ambient radial glow matching reference */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[550px] bg-cyan-600/10 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-indigo-600/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column: Left-aligned Hero Content */}
          <div className="lg:col-span-6 z-20 relative flex flex-col items-start pt-2">
            
            {/* Top Pill Badges Row: Reference Tag + Real EVM Status */}
            <div
              className={`flex flex-wrap items-center gap-2.5 mb-5 transition-all duration-700 ease-out ${
                hasMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              {/* Reference tag: SECURE · TRANSPARENT · TRUSTED */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-mono tracking-wider text-slate-300">
                <span>SECURE</span>
                <span className="text-cyan-400">•</span>
                <span>TRANSPARENT</span>
                <span className="text-cyan-400">•</span>
                <span>TRUSTED</span>
              </div>

              {/* Real Blockchain Live Indicator */}
              {bcStatus?.status === 'connected' && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[11px] font-mono text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{bcStatus.networkName || 'Sepolia'} Active</span>
                </div>
              )}
            </div>

            {/* Headline matching reference */}
            <h1
              style={{ transitionDelay: '100ms' }}
              className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-100 leading-[1.14] transition-all duration-700 ease-out ${
                hasMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              Academic credentials.{' '}
              <br className="hidden sm:inline" />
              Verified with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-300">
                confidence.
              </span>
            </h1>

            {/* Supporting Text */}
            <p
              style={{ transitionDelay: '200ms' }}
              className={`mt-4 sm:mt-5 text-base sm:text-lg text-slate-400 font-normal leading-relaxed max-w-xl transition-all duration-700 ease-out ${
                hasMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              Issue, share, and independently verify academic credentials with
              cryptographic integrity.
            </p>

            {/* Working Buttons matching reference */}
            <div
              style={{ transitionDelay: '300ms' }}
              className={`mt-7 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto transition-all duration-700 ease-out ${
                hasMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              <button
                type="button"
                onClick={onExploreVerification}
                className="flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-400 rounded-xl transition-all cursor-pointer shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
              >
                <Search className="w-4 h-4 text-slate-950" strokeWidth={2.2} />
                <span>Verify a Credential</span>
              </button>

              <button
                type="button"
                onClick={onGetStarted}
                className="flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium text-slate-200 hover:text-cyan-300 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <GraduationCap className="w-4 h-4 text-cyan-400" />
                <span>Access Student Portal</span>
              </button>
            </div>

            {/* Three Concise Benefits Row matching reference image */}
            <div
              style={{ transitionDelay: '400ms' }}
              className={`mt-10 sm:mt-12 pt-8 border-t border-slate-800/80 w-full grid grid-cols-1 sm:grid-cols-3 gap-5 transition-all duration-700 ease-out ${
                hasMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              {/* 1. Tamper-Proof */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Tamper-Proof</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Cryptographic Security</p>
                </div>
              </div>

              {/* 2. Blockchain Ready */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Blockchain Ready</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Immutable Records</p>
                </div>
              </div>

              {/* 3. Student Privacy */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Student Privacy</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Your Data, Your Control</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Custom 3D Isometric Blockchain Visualization */}
          <div
            style={{ transitionDelay: '200ms' }}
            className={`lg:col-span-6 relative flex items-center justify-center transition-all duration-1000 ease-out ${
              hasMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <Hero3DCanvas />
          </div>

        </div>
      </div>
    </section>
  );
};
