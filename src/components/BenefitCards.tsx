import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, CheckCircle2, Share2 } from 'lucide-react';

interface BenefitItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const BENEFITS: BenefitItem[] = [
  {
    icon: <ShieldCheck className="w-6 h-6 text-cyan-400" strokeWidth={1.75} />,
    title: 'Tamper-Evident Credentials',
    description:
      'Cryptographically sealed records cannot be altered, forged, or backdated once anchored.',
  },
  {
    icon: <CheckCircle2 className="w-6 h-6 text-cyan-400" strokeWidth={1.75} />,
    title: 'Independent Verification',
    description:
      'Validate authentic credentials directly against the ledger without requiring third-party subscriptions.',
  },
  {
    icon: <Share2 className="w-6 h-6 text-cyan-400" strokeWidth={1.75} />,
    title: 'Secure Credential Sharing',
    description:
      'Students retain cryptographically owned proofs and share them instantly with global institutions.',
  },
];

export const BenefitCards: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="benefits"
      className="relative w-full py-24 md:py-32 bg-[#070b14] border-t border-slate-800/60"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Subtle section header */}
        <div
          className={`text-center max-w-xl mx-auto mb-16 transition-all duration-700 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <p className="text-xs uppercase tracking-widest text-cyan-400 font-mono mb-2">
            Built for Trust
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-100 tracking-tight">
            Cryptographic Integrity
          </h2>
        </div>

        {/* 3 Benefit Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {BENEFITS.map((benefit, index) => {
            return (
              <div
                key={benefit.title}
                style={{
                  transitionDelay: `${150 * (index + 1)}ms`,
                }}
                className={`relative p-8 rounded-2xl bg-gradient-to-b from-[#0e172f]/80 to-[#070d1d]/90 border border-slate-800/80 hover:border-cyan-400/50 transition-all duration-500 ease-out group hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/10 overflow-hidden ${
                  isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8 pointer-events-none'
                }`}
              >
                {/* 3D Top Corner Shimmer Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/15 transition-all duration-500 pointer-events-none" />

                {/* Icon Container with glowing 3D box shadow */}
                <div className="w-14 h-14 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center mb-6 group-hover:border-cyan-400/60 group-hover:bg-cyan-950/40 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-cyan-500/20 transition-all duration-300">
                  {benefit.icon}
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-slate-100 group-hover:text-cyan-300 tracking-tight mb-2.5 transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed font-normal">
                  {benefit.description}
                </p>

                {/* Bottom subtle accent line */}
                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center gap-2 text-[11px] font-mono text-cyan-400/70 group-hover:text-cyan-300 transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>Cryptographic Proof Guarantee</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
