import React from 'react';
import { Search, GraduationCap } from 'lucide-react';

interface FinalCTAProps {
  onVerify: () => void;
  onStudentPortal: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({
  onVerify,
  onStudentPortal,
}) => {
  return (
    <section className="relative w-full py-16 md:py-20 bg-[#070b14] border-t border-slate-800/80">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-100 tracking-tight">
          Ready to verify academic credentials?
        </h2>
        <p className="mt-3 text-sm md:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
          Verify an official diploma via public ID or access your verified credentials through the student portal.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onVerify}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Search className="w-4 h-4" />
            <span>Verify a Credential</span>
          </button>

          <button
            type="button"
            onClick={onStudentPortal}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors cursor-pointer"
          >
            <GraduationCap className="w-4 h-4 text-slate-400" />
            <span>Access Student Portal</span>
          </button>
        </div>
      </div>
    </section>
  );
};
