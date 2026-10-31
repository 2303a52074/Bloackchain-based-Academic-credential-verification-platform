import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, Copy, Check, ExternalLink, Printer } from 'lucide-react';

interface CredentialQrCodeProps {
  credentialId: string;
  customUrl?: string;
  size?: number;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

export function getVerificationUrl(credentialId: string): string {
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : '';
  return `${origin}/#verify?id=${encodeURIComponent(credentialId.trim())}`;
}

export const CredentialQrCode: React.FC<CredentialQrCodeProps> = ({
  credentialId,
  customUrl,
  size = 160,
  showActions = true,
  compact = false,
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetUrl = customUrl || getVerificationUrl(credentialId);

  useEffect(() => {
    let isMounted = true;

    async function generate() {
      try {
        setError(null);
        // Generate high-resolution PNG data URL with proper margin
        const url = await QRCode.toDataURL(targetUrl, {
          width: Math.max(size * 2, 280),
          margin: 2,
          color: {
            dark: '#020617', // Deep slate for high contrast scannability
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });
        if (isMounted) {
          setDataUrl(url);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Failed to generate credential QR code:', err);
          setError('Failed to render QR code');
        }
      }
    }

    if (credentialId) {
      generate();
    }

    return () => {
      isMounted = false;
    };
  }, [credentialId, targetUrl, size]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const handleDownloadQr = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `credential-${credentialId.toLowerCase()}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (compact) {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <div className="p-2 bg-white rounded-xl shadow-md border border-slate-200">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`Scan to verify credential ${credentialId}`}
              width={size}
              height={size}
              className="rounded"
            />
          ) : (
            <div
              style={{ width: size, height: size }}
              className="flex items-center justify-center bg-slate-100 text-slate-400"
            >
              <QrCode className="w-8 h-8 animate-pulse" />
            </div>
          )}
        </div>
        <p className="text-[11px] font-medium text-slate-400 text-center">
          Scan to verify this credential
        </p>
      </div>
    );
  }

  return (
    <div
      className={`p-5 rounded-xl bg-slate-950/80 border border-slate-800/80 ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Scannable High-Contrast QR Code Card */}
        <div className="p-3 bg-white rounded-xl shadow-lg border border-slate-200 shrink-0">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`Scan to verify credential ${credentialId}`}
              width={size}
              height={size}
              className="rounded block"
            />
          ) : (
            <div
              style={{ width: size, height: size }}
              className="flex flex-col items-center justify-center bg-slate-100 text-slate-500 rounded p-2 text-center"
            >
              <QrCode className="w-8 h-8 animate-pulse mb-1 text-slate-700" />
              <span className="text-[10px] font-mono text-slate-600">Generating QR...</span>
            </div>
          )}
        </div>

        {/* Details & Actions */}
        <div className="flex-1 text-center sm:text-left min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-slate-200 mb-1">
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>Digital Credential Verification QR Code</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Scan to verify this credential. Instant direct lookup opens the public verification page and checks the authoritative registry.
          </p>

          {/* Target URL */}
          <div className="mb-4 p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 break-all select-all">
            {targetUrl}
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-cyan-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                title="Copy public verification link to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Link Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Verification Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadQr}
                disabled={!dataUrl}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-cyan-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                title="Download QR code image for resume or print"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download QR Code</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-cyan-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                title="Print credential view"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Credential</span>
              </button>
            </div>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-rose-400 mt-2 text-center sm:text-left">{error}</p>}
    </div>
  );
};
