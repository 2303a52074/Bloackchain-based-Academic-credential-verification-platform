import React from 'react';
import { FilePlus2, Box, Share2, ShieldCheck, ArrowRight } from 'lucide-react';

interface ProcessStep {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: ProcessStep[] = [
  {
    number: '1',
    title: 'Issue Credential',
    description: 'Authorized institutions create and sign credentials.',
    icon: <FilePlus2 className="w-6 h-6 text-cyan-400" strokeWidth={1.75} />,
  },
  {
    number: '2',
    title: 'Secure & Store',
    description: 'Credential data is hashed and recorded securely.',
    icon: <Box className="w-6 h-6 text-cyan-400" strokeWidth={1.75} />,
  },
  {
    number: '3',
    title: 'Share with Ease',
    description: 'Students receive a unique verification link or QR code.',
    icon: <Share2 className="w-6 h-6 text-cyan-400" strokeWidth={1.75} />,
  },
  {
    number: '4',
    title: 'Verify Instantly',
    description: 'Anyone can verify the credential independently.',
    icon: <ShieldCheck className="w-6 h-6 text-cyan-400" strokeWidth={1.75} />,
  },
];

export const ProcessSection: React.FC = () => {
  return (
    <section id="process" className="relative w-full py-20 md:py-24 bg-[#050b14] border-t border-slate-800/60 overflow-hidden">
      {/* Background soft ambient gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-cyan-600/5 blur-[160px] pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-2">
              THE PROCESS
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight">
              How <span className="text-cyan-400">CredentialChain</span> Works
            </h2>
          </div>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed md:text-right">
            From issuance to verification, every credential is secured using
            cryptographic hashing and blockchain technology.
          </p>
        </div>

        {/* 4 Steps Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {STEPS.map((step, idx) => (
            <div key={step.number} className="relative flex flex-col items-start group">
              {/* Card Container */}
              <div className="w-full p-6 rounded-2xl bg-gradient-to-b from-[#0a1426]/90 to-[#070e1b]/95 border border-slate-800/90 group-hover:border-cyan-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between min-h-[220px]">
                
                {/* Top Row: Icon Container and Optional Arrow for Desktop */}
                <div className="flex items-center justify-between w-full mb-6">
                  <div className="w-13 h-13 rounded-xl bg-slate-900/90 border border-slate-750 flex items-center justify-center group-hover:border-cyan-400/50 group-hover:bg-cyan-950/30 group-hover:shadow-lg group-hover:shadow-cyan-500/15 transition-all">
                    {step.icon}
                  </div>

                  {idx < STEPS.length - 1 && (
                    <div className="hidden lg:flex items-center text-slate-700 group-hover:text-cyan-400/80 transition-colors">
                      <div className="w-8 h-px bg-slate-800 group-hover:bg-cyan-500/30 transition-colors" />
                      <ArrowRight className="w-4 h-4 -ml-1 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold flex items-center justify-center shrink-0">
                      {step.number}
                    </span>
                    <h3 className="text-base font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
