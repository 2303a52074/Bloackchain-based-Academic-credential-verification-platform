import React, { useState, useEffect } from 'react';
import { User, CredentialRecord, UserRole } from '../types';
import { apiClient } from '../services/api';
import { authStore } from '../services/store';
import {
  ArrowLeft,
  Building2,
  Key,
  Send,
  CheckCircle2,
  Copy,
  ExternalLink,
  Search,
  AlertCircle,
  FileBadge,
  Ban,
  Lock,
  ShieldAlert,
  QrCode,
} from 'lucide-react';
import { PortalSkeletonLoader } from './PortalSkeletonLoader';
import { CredentialQrCode } from './CredentialQrCode';

interface AdminPortalViewProps {
  onBackToHome: () => void;
  onOpenAuth: (role?: UserRole, mode?: 'login' | 'register') => void;
  onNavigateToVerify: (query?: string) => void;
  onNavigateToStudentPortal?: () => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  onBackToHome,
  onOpenAuth,
  onNavigateToVerify,
  onNavigateToStudentPortal,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(authStore.getCurrentUser());
  const [credentials, setCredentials] = useState<CredentialRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminStatus, setAdminStatus] = useState<{ adminProvisioned: boolean }>({ adminProvisioned: true });

  // Form states
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [degree, setDegree] = useState('Bachelor of Science');
  const [major, setMajor] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [honors, setHonors] = useState('');
  const [gpa, setGpa] = useState('');

  // Review & Submit modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [issuingError, setIssuingError] = useState<string | null>(null);
  const [lastIssuedCert, setLastIssuedCert] = useState<CredentialRecord | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [showQrId, setShowQrId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setIsLoading(true);
    const user = authStore.getCurrentUser();
    setCurrentUser(user);

    try {
      const statusRes = await apiClient.getAdminStatus();
      setAdminStatus({ adminProvisioned: statusRes.adminProvisioned });

      if (user && user.role === 'admin') {
        const credsRes = await apiClient.getAdminCredentials();
        setCredentials(credsRes.credentials || []);
      } else {
        setCredentials([]);
      }
    } catch {
      setCredentials([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Strict Role Guard: Redirect students immediately to their student portal
    if (currentUser && currentUser.role === 'student') {
      if (onNavigateToStudentPortal) {
        onNavigateToStudentPortal();
      } else {
        onBackToHome();
      }
      return;
    }

    fetchAdminData();
    const unsubscribe = authStore.subscribe(() => {
      const updatedUser = authStore.getCurrentUser();
      setCurrentUser(updatedUser);
      if (updatedUser && updatedUser.role === 'student') {
        if (onNavigateToStudentPortal) {
          onNavigateToStudentPortal();
        } else {
          onBackToHome();
        }
      } else {
        fetchAdminData();
      }
    });
    return unsubscribe;
  }, [currentUser]);

  const handleOpenReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentEmail.trim() || !studentId.trim() || !degree.trim() || !major.trim() || !issueDate.trim()) {
      return;
    }
    setIssuingError(null);
    setReviewModalOpen(true);
  };

  const handleConfirmIssue = async () => {
    setIsIssuing(true);
    setIssuingError(null);

    const institution = currentUser?.institution || 'Authorized University';

    try {
      const res = await apiClient.issueCredential({
        studentName,
        studentEmail,
        studentId,
        degree,
        major,
        institution,
        issueDate,
        gpa: gpa.trim() || undefined,
        honors: honors.trim() || undefined,
      });

      setLastIssuedCert(res.credential);
      setReviewModalOpen(false);

      // Reset form
      setStudentName('');
      setStudentEmail('');
      setStudentId('');
      setMajor('');
      setHonors('');
      setGpa('');

      // Refresh list
      await fetchAdminData();
    } catch (err: any) {
      setIssuingError(err.message || 'Failed to issue credential.');
    } finally {
      setIsIssuing(false);
    }
  };

  const handleRevoke = async (id: string) => {
    const confirmRevoke = window.confirm(
      `Are you sure you want to revoke credential ${id}? This action is permanent and records status as revoked.`
    );
    if (!confirmRevoke) return;

    setRevokingId(id);
    try {
      await apiClient.revokeCredential(id);
      await fetchAdminData();
    } catch (err: any) {
      alert(`Revocation failed: ${err.message}`);
    } finally {
      setRevokingId(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Filtered issued credentials
  const filteredCerts = credentials.filter(
    (c) =>
      c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.studentEmail && c.studentEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.degree.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.canonicalHash.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 1. STRICT ROLE-BASED ACCESS CONTROL: Student Redirect State
  if (currentUser && currentUser.role === 'student') {
    return (
      <div className="min-h-[70vh] py-16 px-6 max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-6 animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="inline-block px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono mb-3">
          REDIRECTING TO STUDENT PORTAL
        </div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
          Access Restricted to Registrars
        </h1>
        <p className="mt-3 text-slate-400 text-sm max-w-md leading-relaxed">
          Logged in as student <span className="text-slate-200 font-semibold">{currentUser.email}</span>.
          Student accounts are redirected to the Student Credentials Portal.
        </p>
        <div className="mt-6">
          <button
            onClick={() => onNavigateToStudentPortal ? onNavigateToStudentPortal() : onBackToHome()}
            className="px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-sm transition-all cursor-pointer"
          >
            Go to Student Portal Now
          </button>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated User on Admin Portal
  if (!currentUser) {
    return (
      <div className="min-h-[80vh] py-16 px-6 max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 mb-8 self-start transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Home</span>
        </button>

        <div className="w-16 h-16 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-6 shadow-lg shadow-cyan-950/50">
          <Building2 className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
          University Registrar Console
        </h1>

        <div className="mt-4 max-w-lg mx-auto">
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            University registrars and authorized credential officers can sign in or register an administrative account
            to issue cryptographic degree credentials, anchor proofs, and manage student awards.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onOpenAuth('admin', 'login')}
              className="px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-sm transition-all shadow-md hover:shadow-cyan-500/25 cursor-pointer"
            >
              Sign In as Administrator
            </button>
            <button
              onClick={() => onOpenAuth('admin', 'register')}
              className="px-6 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/40 text-slate-200 font-medium text-sm transition-all cursor-pointer"
            >
              Register University Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Administrator Portal
  return (
    <div className="min-h-[85vh] py-12 md:py-16 px-6 max-w-6xl mx-auto">
      {/* Return button */}
      <button
        onClick={onBackToHome}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
            <Building2 className="w-4 h-4" />
            <span>Institutional Registrar Console</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight">
            Credential Issuance & Registry
          </h1>
          <p className="mt-1 text-slate-400 text-sm max-w-xl">
            Authorized as <span className="text-slate-200 font-medium">{currentUser.name}</span> · Institution:{' '}
            <span className="text-cyan-300 font-medium">{currentUser.institution || 'University Registrar'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl self-start md:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Registrar Session Active</span>
        </div>
      </div>

      {/* Main Content: Skeleton Loader or Grid */}
      {isLoading ? (
        <div className="mt-8">
          <PortalSkeletonLoader variant="admin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* Left Column: Real Issuance Form */}
          <div className="lg:col-span-5">
            <div className="p-6 md:p-7 rounded-2xl bg-[#0b1329]/90 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <FileBadge className="w-5 h-5 text-cyan-400" />
                  <span>Issue Academic Credential</span>
                </h2>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded">
                  SHA-256 Canonical
                </span>
              </div>

              <form onSubmit={handleOpenReview} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    Student Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter recipient's full legal name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                      Student ID / Roll No. *
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

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                      Student Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="student@domain.edu"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                      Degree Awarded *
                    </label>
                    <select
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                    >
                      <option value="Bachelor of Technology">Bachelor of Technology</option>
                      <option value="Bachelor of Science">Bachelor of Science</option>
                      <option value="Master of Science">Master of Science</option>
                      <option value="Doctor of Philosophy (Ph.D.)">Doctor of Philosophy</option>
                      <option value="Bachelor of Arts">Bachelor of Arts</option>
                      <option value="Master of Business Administration">MBA</option>
                      <option value="Postgraduate Diploma">Postgraduate Diploma</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                      Department / Major *
                    </label>
                    <input
                      type="text"
                      required
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                      Conferral / Graduation Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                      Honors / Distinction (Optional)
                    </label>
                    <input
                      type="text"
                      value={honors}
                      onChange={(e) => setHonors(e.target.value)}
                      placeholder="e.g. First Class with Distinction"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-cyan-500/20"
                >
                  <Send className="w-4 h-4" />
                  <span>Review & Issue Credential</span>
                </button>
              </form>

              {/* Success Notification */}
              {lastIssuedCert && (
                <div className="mt-5 p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 animate-in fade-in">
                  <div className="flex items-start gap-2.5 text-emerald-300 text-xs mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-emerald-200">
                        Credential Successfully Recorded in Authoritative Registry
                      </p>
                      <p className="text-[11px] text-emerald-300/80">
                        Identifier: <span className="font-mono text-white">{lastIssuedCert.id}</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300 break-all mb-3">
                    <span className="text-slate-500 block">Canonical SHA-256 Digest:</span>
                    <span className="text-cyan-400">{lastIssuedCert.canonicalHash}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 mb-3">
                    Status: {lastIssuedCert.onChainAnchored ? (
                      <span className="text-emerald-400 font-mono">On-Chain Anchored (Block #{lastIssuedCert.blockNumber})</span>
                    ) : (
                      <span className="text-amber-300 font-mono">Authoritative Database Ledger (EVM On-Chain Pending)</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => onNavigateToVerify(lastIssuedCert.id)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium text-center border border-emerald-500/30 transition-colors cursor-pointer"
                    >
                      Verify Record
                    </button>
                    <button
                      onClick={() => handleCopy(lastIssuedCert.canonicalHash)}
                      className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition-colors cursor-pointer"
                    >
                      {copiedHash === lastIssuedCert.canonicalHash ? 'Copied' : 'Copy Hash'}
                    </button>
                  </div>

                  {/* Issued Credential QR Code */}
                  <div className="pt-2 border-t border-emerald-950/60">
                    <CredentialQrCode
                      credentialId={lastIssuedCert.id}
                      size={120}
                      showActions={true}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Issued Records Ledger */}
          <div className="lg:col-span-7">
            <div className="p-6 md:p-7 rounded-2xl bg-[#0b1329]/90 border border-slate-800 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">
                    Authoritative Credential Registry
                  </h2>
                  <p className="text-xs text-slate-400">
                    {credentials.length} total academic credentials anchored
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by student, ID, degree..."
                    className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 w-full sm:w-56"
                  />
                </div>
              </div>

              {filteredCerts.length === 0 ? (
                <div className="p-12 text-center rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-300 font-medium">No Credentials Issued Yet</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Fill out and submit the issuance form on the left to record your institution's first verifiable degree.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                  {filteredCerts.map((cert) => (
                    <div
                      key={cert.id}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-cyan-500/30 transition-all group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">
                              {cert.studentName}
                            </span>
                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20">
                              {cert.studentId}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">
                            {cert.degree} in {cert.major}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            ID: {cert.id} · Conferred: {cert.issueDate}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${
                              cert.status === 'valid'
                                ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
                                : 'text-rose-400 bg-rose-950/40 border-rose-500/30'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                cert.status === 'valid' ? 'bg-emerald-400' : 'bg-rose-400'
                              }`}
                            />
                            <span>{cert.status === 'valid' ? 'Active' : 'Revoked'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Hash and Actions Footer */}
                      <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span>SHA-256:</span>
                          <span className="text-slate-400">
                            {cert.canonicalHash.substring(0, 14)}...{cert.canonicalHash.substring(cert.canonicalHash.length - 8)}
                          </span>
                          <button
                            onClick={() => handleCopy(cert.canonicalHash)}
                            className="hover:text-cyan-400 text-slate-500 p-0.5 cursor-pointer"
                            title="Copy Full Hash"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowQrId(showQrId === cert.id ? null : cert.id)}
                            className="text-emerald-400 hover:text-emerald-300 font-sans text-xs flex items-center gap-1 cursor-pointer font-medium"
                            title="Show QR Code"
                          >
                            <QrCode className="w-3 h-3" />
                            <span>{showQrId === cert.id ? 'Hide QR' : 'QR'}</span>
                          </button>

                          {cert.status === 'valid' && (
                            <button
                              onClick={() => handleRevoke(cert.id)}
                              disabled={revokingId === cert.id}
                              className="text-rose-400 hover:text-rose-300 font-sans text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Revoke</span>
                            </button>
                          )}

                          <button
                            onClick={() => onNavigateToVerify(cert.id)}
                            className="text-cyan-400 hover:text-cyan-300 font-sans text-xs flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <span>Verify</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Scannable QR Code Panel for Ledger Item */}
                      {showQrId === cert.id && (
                        <div className="mt-3 pt-3 border-t border-slate-900 animate-in fade-in">
                          <CredentialQrCode
                            credentialId={cert.id}
                            size={120}
                            showActions={true}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal Prior to Issuance */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg p-6 md:p-8 rounded-2xl bg-[#0b1329] border border-cyan-500/40 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100 tracking-tight mb-2">
              Review Credential Details Prior to Anchoring
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Please inspect the recipient details. Once issued, a deterministic canonical SHA-256 digest
              will be computed and permanently anchored to the registry.
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient Name:</span>
                <span className="font-semibold text-slate-200">{studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student ID:</span>
                <span className="font-mono text-cyan-300">{studentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student Email:</span>
                <span className="font-mono text-slate-300">{studentEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Degree:</span>
                <span className="font-semibold text-slate-200">{degree}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Major / Discipline:</span>
                <span className="text-slate-300">{major}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Issuing Institution:</span>
                <span className="text-slate-300">{currentUser?.institution || 'Authorized University'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Conferral Date:</span>
                <span className="font-mono text-slate-300">{issueDate}</span>
              </div>
              {honors && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Honors:</span>
                  <span className="text-cyan-400">{honors}</span>
                </div>
              )}
            </div>

            {issuingError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {issuingError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                disabled={isIssuing}
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-850 cursor-pointer disabled:opacity-50"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmIssue}
                disabled={isIssuing}
                className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isIssuing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Signing & Anchoring...</span>
                  </>
                ) : (
                  <span>Confirm & Issue</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
