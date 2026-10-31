import React, { useState, useEffect } from 'react';
import { User, CredentialRecord, UserRole } from '../types';
import { apiClient } from '../services/api';
import { authStore } from '../services/store';
import {
  ArrowLeft,
  Award,
  Download,
  Share2,
  Check,
  QrCode,
  ExternalLink,
  Printer,
  X,
  FileText,
  UserCheck,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import { PortalSkeletonLoader } from './PortalSkeletonLoader';
import { CredentialQrCode } from './CredentialQrCode';

interface StudentPortalViewProps {
  onBackToHome: () => void;
  onOpenAuth: (role?: UserRole, mode?: 'login' | 'register') => void;
  onNavigateToVerify: (query?: string) => void;
  onNavigateToAdminPortal?: () => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  onBackToHome,
  onOpenAuth,
  onNavigateToVerify,
  onNavigateToAdminPortal,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(authStore.getCurrentUser());
  const [credentials, setCredentials] = useState<CredentialRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedDiploma, setSelectedDiploma] = useState<CredentialRecord | null>(null);
  const [showQrForCert, setShowQrForCert] = useState<string | null>(null);

  const fetchCredentials = async () => {
    setIsLoading(true);
    setError(null);
    const user = authStore.getCurrentUser();
    setCurrentUser(user);

    if (user && user.role === 'admin') {
      setIsLoading(false);
      if (onNavigateToAdminPortal) {
        onNavigateToAdminPortal();
      }
      return;
    }

    if (!user || user.role !== 'student') {
      setIsLoading(false);
      setCredentials([]);
      return;
    }

    try {
      const res = await apiClient.getStudentCredentials();
      setCredentials(res.credentials || []);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve credentials from server.');
      setCredentials([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      onNavigateToAdminPortal?.();
      return;
    }
    fetchCredentials();
    const unsubscribe = authStore.subscribe(() => {
      const u = authStore.getCurrentUser();
      setCurrentUser(u);
      if (u && u.role === 'admin') {
        onNavigateToAdminPortal?.();
      } else {
        fetchCredentials();
      }
    });
    return unsubscribe;
  }, [currentUser]);

  const handleCopyLink = (cert: CredentialRecord) => {
    const url = `${window.location.origin}/#verify?id=${encodeURIComponent(cert.id)}`;
    navigator.clipboard.writeText(url);
    setCopiedId(cert.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadProof = (cert: CredentialRecord) => {
    const proofData = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://credentialchain.ledger/contexts/v1',
      ],
      id: cert.id,
      type: ['VerifiableCredential', 'AcademicDegreeCredential'],
      issuer: {
        name: cert.institution,
      },
      issuanceDate: cert.issueDate,
      credentialSubject: {
        studentId: cert.studentId,
        studentName: cert.studentName,
        degree: cert.degree,
        major: cert.major,
        honors: cert.honors || undefined,
        gpa: cert.gpa || undefined,
      },
      proof: {
        type: 'SHA256CanonicalAnchor',
        created: cert.createdAt || new Date().toISOString(),
        canonicalHash: cert.canonicalHash,
        blockNumber: cert.blockNumber || null,
        txHash: cert.txHash || null,
        networkName: cert.networkName || 'Database Ledger',
      },
    };

    const blob = new Blob([JSON.stringify(proofData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cert.id}-verifiable-proof.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // If unauthenticated or wrong role
  if (!currentUser || currentUser.role !== 'student') {
    return (
      <div className="min-h-[80vh] py-16 px-6 max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 mb-8 self-start transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Home</span>
        </button>

        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 mb-6">
          <GraduationCap className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
          Student Portal Authentication Required
        </h1>
        <p className="mt-3 text-slate-400 text-sm max-w-md leading-relaxed">
          Sign in using your registered student account to access your authoritative academic credentials,
          verifiable proofs, and exportable diplomas.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => onOpenAuth('student', 'login')}
            className="px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-sm transition-all shadow-md cursor-pointer"
          >
            Sign In to Student Account
          </button>
          <button
            onClick={() => onOpenAuth('student', 'register')}
            className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium transition-all cursor-pointer"
          >
            Register as New Student
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] py-12 md:py-16 px-6 max-w-5xl mx-auto">
      {/* Return button */}
      <button
        onClick={onBackToHome}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </button>

      {/* Header Profile Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 mb-1">
            <Award className="w-4 h-4" />
            <span>Student Verifiable Credential Locker</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight">
            {currentUser.name}'s Academic Records
          </h1>
          <p className="mt-1 text-slate-400 text-sm">
            Student ID: <span className="font-mono text-slate-200">{currentUser.studentId}</span> · Account: <span className="text-slate-300">{currentUser.email}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl self-start md:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Authenticated Student Session</span>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="mt-6 p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Credentials Container */}
      <div className="mt-8 space-y-6">
        {isLoading ? (
          <PortalSkeletonLoader variant="cards" count={2} />
        ) : credentials.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#0b1329]/60 border border-slate-800">
            <Award className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-200">No Credentials Issued Yet</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
              No academic records have been issued to Student ID <span className="text-slate-200 font-mono">{currentUser.studentId}</span>.
              Once your university administrator issues and anchors your degree, it will appear here in real time.
            </p>
          </div>
        ) : (
          credentials.map((cert) => (
            <div
              key={cert.id}
              className="p-6 md:p-8 rounded-2xl bg-[#0b1329]/90 border border-slate-800/90 shadow-xl relative overflow-hidden transition-all hover:border-cyan-500/30 group"
            >
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider block">
                      {cert.institution}
                    </span>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-100 mt-0.5 tracking-tight">
                      {cert.degree}
                    </h2>
                    <p className="text-sm text-slate-300 mt-0.5 font-medium">
                      Major in {cert.major}
                      {cert.honors && <span className="text-cyan-300"> · {cert.honors}</span>}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Conferred: {cert.issueDate}
                      {cert.issuerName && ` · Issuer: ${cert.issuerName}`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-1.5 self-start sm:self-auto">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg ${
                      cert.status === 'valid'
                        ? 'text-emerald-400 bg-emerald-950/50 border border-emerald-500/30'
                        : 'text-rose-400 bg-rose-950/50 border border-rose-500/30'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        cert.status === 'valid' ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />
                    <span>{cert.status === 'valid' ? 'Authoritative Record' : 'Revoked'}</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    ID: {cert.id}
                  </span>
                </div>
              </div>

              {/* SHA-256 Hash Display */}
              <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs font-mono bg-slate-950/70 p-3 rounded-xl border border-slate-900 my-4">
                <div className="flex items-center gap-2 text-slate-400 overflow-hidden text-ellipsis">
                  <span className="text-slate-500 shrink-0">Canonical SHA-256:</span>
                  <span className="text-cyan-400 font-mono text-[11px] break-all">
                    {cert.canonicalHash}
                  </span>
                </div>
                <span className="text-slate-500 shrink-0 text-[10px]">
                  {cert.blockNumber ? `Block #${cert.blockNumber.toLocaleString()}` : cert.networkName || 'Database Ledger'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setSelectedDiploma(cert)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>View Diploma</span>
                  </button>

                  <button
                    onClick={() =>
                      setShowQrForCert(showQrForCert === cert.id ? null : cert.id)
                    }
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{showQrForCert === cert.id ? 'Hide QR' : 'Show QR Proof'}</span>
                  </button>

                  <button
                    onClick={() => handleDownloadProof(cert)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download JSON Proof</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyLink(cert)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/40 text-cyan-300 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {copiedId === cert.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedId === cert.id ? 'Link Copied' : 'Share Link'}</span>
                  </button>

                  <button
                    onClick={() => onNavigateToVerify(cert.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                  >
                    <span>Verify Record</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Real Scannable QR Code Reveal Panel */}
              {showQrForCert === cert.id && (
                <div className="mt-5 animate-in fade-in">
                  <CredentialQrCode
                    credentialId={cert.id}
                    size={140}
                    showActions={true}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Full Diploma Modal */}
      {selectedDiploma && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-3xl p-8 md:p-12 rounded-2xl bg-[#091122] border-2 border-cyan-500/40 shadow-2xl overflow-hidden">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                Authoritative Academic Diploma
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setSelectedDiploma(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Diploma Canvas */}
            <div className="p-8 md:p-10 rounded-xl bg-[#070d1a] border border-cyan-500/30 text-center relative">
              <div className="w-16 h-16 rounded-full border-2 border-cyan-400/80 mx-auto flex items-center justify-center mb-4 text-cyan-400">
                <Award className="w-8 h-8" />
              </div>

              <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-100 tracking-wide uppercase">
                {selectedDiploma.institution}
              </h2>
              <p className="text-xs font-mono text-cyan-400 tracking-widest uppercase mt-1">
                Office of Academic Records
              </p>

              <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto my-6" />

              <p className="text-xs text-slate-400 uppercase tracking-wider">
                This document certifies that
              </p>

              <h3 className="text-2xl md:text-3xl font-bold text-white my-3 tracking-tight">
                {selectedDiploma.studentName}
              </h3>

              <p className="text-xs text-slate-400 uppercase tracking-wider">
                has successfully completed all requirements for
              </p>

              <h4 className="text-xl md:text-2xl font-bold text-cyan-300 mt-2">
                {selectedDiploma.degree}
              </h4>
              <p className="text-sm text-slate-300 font-medium mt-1">
                in {selectedDiploma.major}
                {selectedDiploma.honors && <span> ({selectedDiploma.honors})</span>}
              </p>

              <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
                <div className="text-left font-mono text-[11px]">
                  <p>Conferral Date: {selectedDiploma.issueDate}</p>
                  <p>Record ID: {selectedDiploma.id}</p>
                </div>

                <div className="shrink-0">
                  <CredentialQrCode
                    credentialId={selectedDiploma.id}
                    compact={true}
                    size={76}
                  />
                </div>

                <div className="text-right font-mono text-[10px]">
                  <p className="text-emerald-400 font-semibold">
                    {selectedDiploma.blockNumber ? `Block #${selectedDiploma.blockNumber.toLocaleString()}` : 'Database Ledger Proof'}
                  </p>
                  <p className="text-slate-500 max-w-[240px] truncate">{selectedDiploma.canonicalHash}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
