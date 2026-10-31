export type ActiveView = 'home' | 'verify' | 'student' | 'admin';

export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  institution?: string; // For Admin
  studentId?: string; // For Student
  createdAt: string;
}

export interface CanonicalPayload {
  degree: string;
  id: string;
  institution: string;
  issueDate: string;
  major: string;
  studentId: string;
  studentName: string;
}

export interface CredentialRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  degree: string;
  major: string;
  institution: string;
  issueDate: string;
  gpa?: string;
  honors?: string;
  canonicalHash: string; // Real SHA-256
  canonicalPayload?: CanonicalPayload;
  issuerId?: string;
  issuerName?: string;
  blockNumber?: number | null;
  txHash?: string | null;
  contractAddress?: string | null;
  chainId?: string | null;
  networkName?: string;
  onChainAnchored?: boolean;
  status: 'valid' | 'revoked';
  createdAt?: string;
}

export interface BlockchainStatus {
  status: 'connected' | 'disconnected' | 'error';
  rpcUrl?: string;
  chainId?: string | null;
  networkName?: string;
  blockNumber?: number | null;
  contractAddress?: string | null;
  contractDeployed?: boolean;
  abiConfigured?: boolean;
  isLocalNode?: boolean;
  error?: string;
}

export interface VerificationResult {
  verified: boolean;
  status: 'authentic' | 'not_found' | 'tamper_detected' | 'revoked';
  message: string;
  credential?: CredentialRecord;
  recordedHash?: string;
  recomputedHash?: string;
  blockchainStatus?: BlockchainStatus;
}
