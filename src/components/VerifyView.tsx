import React, { useState, useEffect } from 'react';
import { VerificationResult, CredentialRecord } from '../types';
import { apiClient } from '../services/api';
import { CredentialQrCode } from './CredentialQrCode';
import {
  ShieldCheck,
  Search,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Calendar,
  AlertTriangle,
  Ban,
  Wifi,
  WifiOff,
  Database,
  GraduationCap,
} from 'lucide-react';

interface VerifyViewProps {
  initialQuery?: string;
  onBackToHome: () => void;
}

export const VerifyView: React.FC<VerifyViewProps> = ({
  initialQuery = '',
  onBackToHome,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeVerification = async (targetQuery: string) => {
    const q = targetQuery.trim();
    if (!q) {
      setResult(null);
      setError(null);
      return;
    }

    setIsVerifying(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiClient.verifyCredential(q);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Verification query returned no matching authoritative record.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Sync when initialQuery changes (e.g. from URL deep link or QR scan)
  useEffect(() => {
    setQuery(initialQuery);
    if (initialQuery) {
      executeVerification(initialQuery);
    } else {
      setResult(null);
      setError(null);
    }
  }, [initialQuery]);

  // Honest status evaluation
  const isBlockchainConnected = result?.blockchainStatus?.status === 'connected';
  const hasOnChainProof = !!(result?.credential?.onChainAnchored && isBlockchainConnected);

  return (
    <div className="min-h-[85vh] py-12 md:py-16 px-6 max-w-4xl mx-auto">
      {/* Back button */}
      <button
        type="button"
        onClick={onBackToHome}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </button>

      {/* Header */}
      <div className="mb-8 text-left">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Academic Credential Verification</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight">
          Verify an Academic Credential
        </h1>
        <p className="mt-2 text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl">
          Enter a Credential ID or canonical hash, or scan the credential's QR code to verify authenticity against the official registry.
        </p>
      </div>

      {/* Search Input Box (Starts empty) */}
      <div className="p-2 rounded-2xl bg-[#0b1329]/90 border border-slate-800 shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <Search className="w-5 h-5 text-slate-500 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executeVerification(query)}
              placeholder="Enter Credential ID or SHA-256 Hash..."
              className="w-full pl-12 pr-4 py-3.5 bg-transparent text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none font-mono"
            />
          </div>
          <button
            type="button"
            onClick={() => executeVerification(query)}
            disabled={isVerifying || !query.trim()}
            className="px-6 py-3.5 bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-400 text-slate-950 font-semibold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Checking Registry...</span>
              </>
            ) : (
              <span>Verify Credential</span>
            )}
          </button>
        </div>
      </div>

      {/* Empty Initial State: Clean, helpful guidance */}
      {!result && !error && !isVerifying && (
        <div className="p-10 rounded-2xl bg-[#0b1329]/40 border border-slate-800/80 text-center">
          <Search className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">Ready for Verification</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Enter a Credential ID above or scan the credential's QR code. Authoritative verification results will be displayed upon submission.
          </p>
        </div>
      )}

      {/* Generic Network / API Error */}
      {error && (
        <div className="p-8 rounded-2xl border border-rose-500/30 bg-rose-950/20 text-center animate-in fade-in">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">Verification Query Failed</h3>
          <p className="text-xs text-rose-300/80 mt-1 max-w-md mx-auto leading-relaxed">{error}</p>
        </div>
      )}

      {/* State 1: Credential Not Found */}
      {result && result.status === 'not_found' && (
        <div className="rounded-2xl border border-slate-800 bg-[#0b1329] p-8 text-center animate-in fade-in">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-4">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Credential Not Found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            No matching record exists.
          </p>
          <p className="text-xs text-slate-500 mt-3 max-w-lg mx-auto leading-relaxed">
            The identifier you entered could not be found in the authoritative university registry. Please ensure the Credential ID or hash was copied correctly.
          </p>
        </div>
      )}

      {/* State 2: Verification Failed (Hash Mismatch / Tampering) */}
      {result && result.status === 'tamper_detected' && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-950/20 p-8 text-center animate-in fade-in">
          <div className="w-12 h-12 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-rose-200">Verification Failed</h3>
          <p className="text-sm text-rose-300/90 mt-1 max-w-md mx-auto">
            The credential hash does not match the authoritative record.
          </p>
          <p className="text-xs text-slate-400 mt-3 max-w-lg mx-auto leading-relaxed">
            The cryptographic checksum recomputed from the credential data does not match the authoritative registry record. This credential may have been altered or corrupted.
          </p>
          {result.recordedHash && result.recomputedHash && (
            <div className="mt-6 p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-left font-mono text-xs space-y-2 max-w-xl mx-auto">
              <div>
                <span className="text-slate-500 block">Recorded Registry Hash:</span>
                <span className="text-cyan-400 break-all text-[11px]">{result.recordedHash}</span>
              </div>
              <div className="pt-2 border-t border-slate-900">
                <span className="text-slate-500 block">Recomputed Hash:</span>
                <span className="text-rose-400 break-all text-[11px]">{result.recomputedHash}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* State 3: Credential Revoked */}
      {result && result.status === 'revoked' && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-950/20 p-6 md:p-8 shadow-2xl animate-in fade-in space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <Ban className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-rose-200">Credential Revoked</h3>
              <p className="text-xs text-rose-300/90">The credential has been revoked.</p>
            </div>
          </div>

          {result.credential && (
            <div className="p-5 rounded-xl bg-slate-950/90 border border-slate-800 text-sm space-y-2 text-slate-300">
              <div className="flex flex-wrap justify-between gap-1 pb-2 border-b border-slate-900">
                <span className="text-xs text-slate-500 uppercase">Credential ID</span>
                <span className="font-mono text-slate-200">{result.credential.id}</span>
              </div>
              <div className="flex flex-wrap justify-between gap-1">
                <span className="text-xs text-slate-500">Recipient Name</span>
                <span className="font-semibold text-slate-100">{result.credential.studentName}</span>
              </div>
              <div className="flex flex-wrap justify-between gap-1">
                <span className="text-xs text-slate-500">Degree & Discipline</span>
                <span className="text-slate-200">{result.credential.degree} in {result.credential.major}</span>
              </div>
              <div className="flex flex-wrap justify-between gap-1">
                <span className="text-xs text-slate-500">Issuing Institution</span>
                <span className="text-slate-200">{result.credential.institution}</span>
              </div>
              <div className="pt-2 border-t border-slate-900 text-xs font-mono text-rose-400">
                Notice: This academic credential was revoked by the issuing institution and is no longer recognized as valid.
              </div>
            </div>
          )}
        </div>
      )}

      {/* State 4 & 5: Verified (Genuine Blockchain Verified OR Database Match — Blockchain Unavailable) */}
      {result && result.credential && result.verified && result.status === 'authentic' && (
        <div className="rounded-2xl border border-slate-800 bg-[#081524] p-6 md:p-8 shadow-2xl animate-in fade-in space-y-8">
          
          {/* 1. Clear Verification Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  hasOnChainProof || isBlockchainConnected
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-400'
                    : 'bg-amber-950/60 border border-amber-500/40 text-amber-400'
                }`}
              >
                {hasOnChainProof || isBlockchainConnected ? (
                  <CheckCircle2 className="w-7 h-7" />
                ) : (
                  <Database className="w-6 h-6 text-amber-400" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">
                  {hasOnChainProof || isBlockchainConnected
                    ? 'Credential Verified'
                    : 'Database Match — Blockchain Unavailable'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {hasOnChainProof || isBlockchainConnected
                    ? 'The credential matches the verified record.'
                    : 'The database record matches, but blockchain verification could not be completed.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-mono text-cyan-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                ID: {result.credential.id}
              </span>
              {hasOnChainProof ? (
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Blockchain Proof Confirmed</span>
                </span>
              ) : isBlockchainConnected ? (
                <span className="text-xs font-mono text-cyan-300 bg-cyan-950/40 px-2.5 py-1.5 rounded-lg border border-cyan-500/30 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                  <span>EVM RPC Connected · {result.blockchainStatus?.networkName || 'Sepolia'}</span>
                </span>
              ) : (
                <span className="text-xs font-mono text-amber-300 bg-amber-950/40 px-2.5 py-1.5 rounded-lg border border-amber-500/30 flex items-center gap-1.5">
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>EVM RPC Disconnected</span>
                </span>
              )}
            </div>
          </div>

          {/* 2. Credential Holder and Academic Details */}
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400 mb-4">
              <GraduationCap className="w-4 h-4 text-cyan-400" />
              <span>Academic Details</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl bg-slate-950/60 border border-slate-800/80 text-sm">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">
                  Recipient Name
                </span>
                <p className="text-lg font-semibold text-slate-100">{result.credential.studentName}</p>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  Student ID: {result.credential.studentId}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">
                  Degree & Major
                </span>
                <p className="text-lg font-semibold text-cyan-300">{result.credential.degree}</p>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Major in {result.credential.major}
                  {result.credential.honors && (
                    <span className="text-cyan-400"> · {result.credential.honors}</span>
                  )}
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider block">
                    Issuing Academic Institution
                  </span>
                  <p className="text-slate-200 font-medium">{result.credential.institution}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider block">
                    Conferral / Graduation Date
                  </span>
                  <p className="text-slate-200 font-medium">{result.credential.issueDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Compact QR Code Sharing Section */}
          <div>
            <CredentialQrCode
              credentialId={result.credential.id}
              size={140}
              showActions={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};
