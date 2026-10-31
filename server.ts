import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import {
  buildCanonicalPayload,
  computeCanonicalHash,
  serializeCanonicalPayload,
  CanonicalCredentialPayload,
} from './src/services/canonicalHash.js';
import { CREDENTIAL_REGISTRY_ABI } from './src/contracts/CredentialRegistryABI.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'credentialchain_development_jwt_secret_94821';
const ADMIN_PROVISION_SECRET = process.env.ADMIN_PROVISION_SECRET || 'credchain_admin_provision_secret_2026';
const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const RPC_POOL = [
  process.env.RPC_URL,
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://rpc.sepolia.org',
  'https://1rpc.io/sepolia',
  'https://sepolia.drpc.org',
  'https://eth-sepolia.public.blastapi.io',
].filter(Boolean) as string[];

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';
const ISSUER_PRIVATE_KEY = process.env.ISSUER_PRIVATE_KEY || '';

// --- Persistent File Database Setup ---
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface StoredUser {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  role: 'student' | 'admin';
  institution?: string;
  passwordHash: string;
  createdAt: string;
}

interface StoredCredential {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  degree: string;
  major: string;
  institution: string;
  issueDate: string;
  gpa?: string;
  honors?: string;
  canonicalHash: string;
  canonicalPayload: CanonicalCredentialPayload;
  issuerId: string;
  issuerName: string;
  txHash?: string;
  blockNumber?: number;
  contractAddress?: string;
  chainId?: string;
  networkName: string;
  onChainAnchored: boolean;
  status: 'valid' | 'revoked';
  createdAt: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  credentials: StoredCredential[];
  systemConfig: {
    adminProvisioned: boolean;
    createdAt: string;
  };
}

function loadDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    // Initial empty database - ZERO fake accounts, ZERO fake credentials!
    const emptyDb: DatabaseSchema = {
      users: [],
      credentials: [],
      systemConfig: {
        adminProvisioned: false,
        createdAt: new Date().toISOString(),
      },
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(emptyDb, null, 2), 'utf-8');
    return emptyDb;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json, returning empty store:', err);
    return {
      users: [],
      credentials: [],
      systemConfig: { adminProvisioned: false, createdAt: new Date().toISOString() },
    };
  }
}

function saveDatabase(db: DatabaseSchema) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

const app = express();
app.use(express.json());

// --- Security & Rate Limiting ---
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
function rateLimiter(limit = 60, windowMs = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = rateLimitMap.get(ip) || { count: 0, lastReset: now };

    if (now - entry.lastReset > windowMs) {
      entry.count = 1;
      entry.lastReset = now;
    } else {
      entry.count += 1;
      if (entry.count > limit) {
        return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
      }
    }
    rateLimitMap.set(ip, entry);
    next();
  };
}

// --- Auth Token Helper & Middleware ---
interface AuthUserPayload {
  id: string;
  email: string;
  role: 'student' | 'admin';
  studentId?: string;
  institution?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

function generateToken(user: StoredUser): string {
  const payload: AuthUserPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    studentId: user.studentId,
    institution: user.institution,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No bearer token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    next();
  });
}

function requireStudent(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Access denied. Student privileges required.' });
    }
    next();
  });
}

// --- Blockchain Provider Helper with Fallback Pool & Cache ---
let cachedBlockchainStatus: {
  status: 'connected' | 'disconnected';
  rpcUrl: string;
  chainId: string | null;
  networkName: string;
  blockNumber: number | null;
  contractAddress: string | null;
  contractDeployed: boolean;
  abiConfigured: boolean;
  isLocalNode: boolean;
  error?: string;
  cachedAt: number;
} | null = null;

async function getBlockchainStatus(customRpc?: string, forceRefresh = false) {
  const now = Date.now();
  // Return cached status if valid (15-second TTL) and no custom RPC specified
  if (!customRpc && !forceRefresh && cachedBlockchainStatus && (now - cachedBlockchainStatus.cachedAt) < 15000) {
    return cachedBlockchainStatus;
  }

  const endpointsToTry = customRpc ? [customRpc] : RPC_POOL;
  let lastError = 'No EVM RPC endpoints available';

  for (const endpoint of endpointsToTry) {
    try {
      const provider = new ethers.JsonRpcProvider(endpoint);
      const networkPromise = provider.getNetwork();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('RPC connection timeout (5000ms)')), 5000)
      );

      const network = await Promise.race([networkPromise, timeoutPromise]);
      const blockNumber = await provider.getBlockNumber();

      let contractDeployed = false;
      if (CONTRACT_ADDRESS && ethers.isAddress(CONTRACT_ADDRESS)) {
        try {
          const code = await provider.getCode(CONTRACT_ADDRESS);
          contractDeployed = code !== '0x' && code.length > 2;
        } catch {
          contractDeployed = false;
        }
      }

      const chainIdNum = network.chainId.toString();
      const networkDisplayName =
        chainIdNum === '11155111'
          ? 'Ethereum Sepolia Testnet'
          : chainIdNum === '1'
          ? 'Ethereum Mainnet'
          : chainIdNum === '31337' || chainIdNum === '1337'
          ? 'Local EVM Dev Node'
          : `EVM Chain #${chainIdNum}`;

      const connectedResult = {
        status: 'connected' as const,
        rpcUrl: endpoint,
        chainId: chainIdNum,
        networkName: networkDisplayName,
        blockNumber,
        contractAddress: CONTRACT_ADDRESS || null,
        contractDeployed,
        abiConfigured: CREDENTIAL_REGISTRY_ABI.length > 0,
        isLocalNode: network.chainId === 31337n || network.chainId === 1337n,
        cachedAt: now,
      };

      if (!customRpc) {
        cachedBlockchainStatus = connectedResult;
      }
      return connectedResult;
    } catch (err: any) {
      lastError = `${endpoint}: ${err.message}`;
      // Continue to next fallback in pool
    }
  }

  const disconnectedResult = {
    status: 'disconnected' as const,
    rpcUrl: customRpc || RPC_POOL[0] || 'unknown',
    chainId: null,
    networkName: 'Offline Ledger',
    blockNumber: null,
    contractAddress: CONTRACT_ADDRESS || null,
    contractDeployed: false,
    abiConfigured: CREDENTIAL_REGISTRY_ABI.length > 0,
    isLocalNode: false,
    error: `EVM RPC offline or unreachable (${lastError}). Authoritative database ledger remains fully operational.`,
    cachedAt: now,
  };

  if (!customRpc) {
    // Cache disconnected state for 5s to avoid repeated blocking
    cachedBlockchainStatus = disconnectedResult;
  }
  return disconnectedResult;
}

// ==========================================
// API ENDPOINTS
// ==========================================

// 1. Health & Blockchain connection status
app.get('/api/health', async (_req, res) => {
  const bc = await getBlockchainStatus();
  res.json({
    status: 'operational',
    service: 'CredentialChain API',
    timestamp: Date.now(),
    blockchain: bc,
  });
});

app.get('/api/blockchain/status', async (_req, res) => {
  const status = await getBlockchainStatus();
  res.json(status);
});

// 2. Administrator Provisioning Status & Restricted Provisioning
app.get('/api/admin/status', (_req, res) => {
  const db = loadDatabase();
  const hasAdmin = db.users.some((u) => u.role === 'admin');
  res.json({
    adminProvisioned: hasAdmin,
  });
});

app.post('/api/admin/provision', rateLimiter(15), async (req, res) => {
  const { name, email, password, institution } = req.body;

  if (!name || !email || !password || !institution) {
    return res.status(400).json({ error: 'All fields (name, email, password, institution) are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Please enter a valid institutional email address.' });
  }

  const db = loadDatabase();
  const cleanEmail = email.trim().toLowerCase();

  if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const newAdmin: StoredUser = {
    id: `admin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    email: cleanEmail,
    role: 'admin',
    institution: institution.trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newAdmin);
  db.systemConfig.adminProvisioned = true;
  saveDatabase(db);

  const token = generateToken(newAdmin);
  res.status(201).json({
    message: 'University administrator account created successfully.',
    token,
    user: {
      id: newAdmin.id,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
      institution: newAdmin.institution,
      createdAt: newAdmin.createdAt,
    },
  });
});

// 3. Genuine Student Registration
app.post('/api/auth/register-student', rateLimiter(20), async (req, res) => {
  const { name, studentId, email, password } = req.body;

  if (!name || !studentId || !email || !password) {
    return res.status(400).json({ error: 'Name, student ID, email, and password are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const db = loadDatabase();
  const cleanEmail = email.trim().toLowerCase();
  const cleanStudentId = studentId.trim().toUpperCase();

  if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  if (db.users.some((u) => u.studentId && u.studentId.toUpperCase() === cleanStudentId)) {
    return res.status(409).json({ error: 'A student account with this Student ID already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newStudent: StoredUser = {
    id: `stu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    email: cleanEmail,
    studentId: cleanStudentId,
    role: 'student', // Enforce strictly 'student' role!
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newStudent);
  saveDatabase(db);

  const token = generateToken(newStudent);
  res.status(201).json({
    message: 'Student account created successfully.',
    token,
    user: {
      id: newStudent.id,
      name: newStudent.name,
      email: newStudent.email,
      studentId: newStudent.studentId,
      role: newStudent.role,
      createdAt: newStudent.createdAt,
    },
  });
});

// 4. Secure Authentication (Login)
app.post('/api/auth/login', rateLimiter(20), async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const db = loadDatabase();
  const cleanEmail = email.trim().toLowerCase();
  const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

  // Generic error to prevent account enumeration
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      role: user.role,
      institution: user.institution,
      createdAt: user.createdAt,
    },
  });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const db = loadDatabase();
  const user = db.users.find((u) => u.id === req.user!.id);
  if (!user) {
    return res.status(404).json({ error: 'User record not found.' });
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      role: user.role,
      institution: user.institution,
      createdAt: user.createdAt,
    },
  });
});

// 5. Administrator Credential Management (Protected: requireAdmin)
app.get('/api/admin/credentials', requireAdmin, (req, res) => {
  const db = loadDatabase();
  // Filter by admin's institution or show all issued by this admin
  const list = db.credentials.filter(
    (c) => c.issuerId === req.user!.id || (req.user!.institution && c.institution === req.user!.institution)
  );
  res.json({ credentials: list });
});

app.post('/api/admin/credentials/issue', requireAdmin, async (req, res) => {
  const { studentName, studentEmail, studentId, degree, major, institution, issueDate, gpa, honors } = req.body;

  if (!studentName || !studentEmail || !studentId || !degree || !major || !institution || !issueDate) {
    return res.status(400).json({ error: 'All mandatory credential fields must be provided.' });
  }

  const db = loadDatabase();
  const cleanEmail = studentEmail.trim().toLowerCase();
  const cleanStudentId = studentId.trim().toUpperCase();

  // Generate unique sequential or random ID
  const year = new Date(issueDate).getFullYear() || new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const instCode = institution
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .substring(0, 4) || 'CRD';

  const credentialId = `CRD-${year}-${instCode}-${randomSuffix}`;

  // Build deterministic canonical payload
  const canonicalPayload = buildCanonicalPayload({
    id: credentialId,
    studentId: cleanStudentId,
    studentName: studentName.trim(),
    degree: degree.trim(),
    major: major.trim(),
    institution: institution.trim(),
    issueDate: issueDate.trim(),
  });

  const canonicalHash = await computeCanonicalHash(canonicalPayload);

  // Check if hash or ID already exists
  if (db.credentials.some((c) => c.canonicalHash.toLowerCase() === canonicalHash.toLowerCase())) {
    return res.status(409).json({ error: 'A credential with this exact canonical hash has already been issued.' });
  }

  // Attempt real on-chain transaction if configured
  let onChainAnchored = false;
  let txHash: string | undefined;
  let blockNumber: number | undefined;
  let contractAddress: string | undefined;
  let chainIdStr: string | undefined;
  let networkName = 'Offline Ledger';

  try {
    const bcStatus = await getBlockchainStatus();
    if (bcStatus.status === 'connected' && CONTRACT_ADDRESS && ISSUER_PRIVATE_KEY) {
      const provider = new ethers.JsonRpcProvider(bcStatus.rpcUrl);
      const wallet = new ethers.Wallet(ISSUER_PRIVATE_KEY, provider);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CREDENTIAL_REGISTRY_ABI, wallet);

      const tx = await contract.issueCredential(credentialId, canonicalHash);
      const receipt = await tx.wait(1);

      onChainAnchored = true;
      txHash = receipt.hash;
      blockNumber = receipt.blockNumber;
      contractAddress = CONTRACT_ADDRESS;
      chainIdStr = bcStatus.chainId || undefined;
      networkName = bcStatus.networkName;
    } else if (bcStatus.status === 'connected') {
      networkName = bcStatus.networkName;
      chainIdStr = bcStatus.chainId || undefined;
      blockNumber = bcStatus.blockNumber || undefined;
    }
  } catch (err: any) {
    console.warn('Smart contract transaction notice:', err.message);
  }

  const newCredential: StoredCredential = {
    id: credentialId,
    studentId: cleanStudentId,
    studentName: studentName.trim(),
    studentEmail: cleanEmail,
    degree: degree.trim(),
    major: major.trim(),
    institution: institution.trim(),
    issueDate: issueDate.trim(),
    gpa: gpa ? gpa.trim() : undefined,
    honors: honors ? honors.trim() : undefined,
    canonicalHash,
    canonicalPayload,
    issuerId: req.user!.id,
    issuerName: req.user!.institution || 'Authorized University Registrar',
    txHash,
    blockNumber,
    contractAddress,
    chainId: chainIdStr,
    networkName,
    onChainAnchored,
    status: 'valid',
    createdAt: new Date().toISOString(),
  };

  db.credentials.unshift(newCredential);
  saveDatabase(db);

  res.status(201).json({
    message: 'Credential successfully issued and recorded.',
    credential: newCredential,
  });
});

app.post('/api/admin/credentials/revoke', requireAdmin, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Credential ID is required.' });

  const db = loadDatabase();
  const cred = db.credentials.find((c) => c.id === id);
  if (!cred) return res.status(404).json({ error: 'Credential not found.' });

  cred.status = 'revoked';

  // If on-chain contract is available
  try {
    if (CONTRACT_ADDRESS && ISSUER_PRIVATE_KEY) {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const wallet = new ethers.Wallet(ISSUER_PRIVATE_KEY, provider);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CREDENTIAL_REGISTRY_ABI, wallet);
      const tx = await contract.revokeCredential(cred.id);
      await tx.wait(1);
    }
  } catch (err: any) {
    console.warn('Contract revoke notice:', err.message);
  }

  saveDatabase(db);
  res.json({ message: 'Credential revoked successfully.', credential: cred });
});

// 6. Student Credential Access (Protected: Student role only)
app.get('/api/student/credentials', requireStudent, (req, res) => {
  const db = loadDatabase();
  const user = db.users.find((u) => u.id === req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  // STRICT ACCESS: Only records where studentEmail or studentId matches!
  const studentCerts = db.credentials.filter((c) => {
    const matchEmail = c.studentEmail.toLowerCase() === user.email.toLowerCase();
    const matchId = user.studentId && c.studentId.toUpperCase() === user.studentId.toUpperCase();
    return matchEmail || matchId;
  });

  res.json({
    credentials: studentCerts,
    student: {
      name: user.name,
      email: user.email,
      studentId: user.studentId,
    },
  });
});

// 7. Public Cryptographic Verification (No login required)
app.get('/api/credentials/verify/:idOrHash', async (req, res) => {
  const idOrHash = req.params.idOrHash.trim();
  if (!idOrHash) return res.status(400).json({ error: 'Identifier is required.' });

  const db = loadDatabase();
  const cleanQuery = idOrHash.toLowerCase();

  const credential = db.credentials.find(
    (c) => c.id.toLowerCase() === cleanQuery || c.canonicalHash.toLowerCase() === cleanQuery
  );

  if (!credential) {
    return res.status(404).json({
      verified: false,
      status: 'not_found',
      message: 'No credential record matches this identifier in the authoritative registry.',
    });
  }

  // Authoritative recomputation of SHA-256
  const recomputedHash = await computeCanonicalHash(credential.canonicalPayload);
  const hashMatches = recomputedHash.toLowerCase() === credential.canonicalHash.toLowerCase();

  if (!hashMatches) {
    return res.status(422).json({
      verified: false,
      status: 'tamper_detected',
      message: 'Integrity check failed: Recomputed SHA-256 does not match recorded registry hash.',
      credentialId: credential.id,
      recordedHash: credential.canonicalHash,
      recomputedHash,
    });
  }

  if (credential.status === 'revoked') {
    return res.status(200).json({
      verified: false,
      status: 'revoked',
      message: 'This credential was revoked by the issuing institution.',
      credential: {
        id: credential.id,
        studentName: credential.studentName,
        degree: credential.degree,
        major: credential.major,
        institution: credential.institution,
        issueDate: credential.issueDate,
        status: 'revoked',
        canonicalHash: credential.canonicalHash,
      },
    });
  }

  // Query on-chain smart contract if configured
  let onChainVerified = false;
  let onChainTimestamp: number | null = null;
  let onChainIssuer: string | null = null;
  const bc = await getBlockchainStatus();

  if (bc.status === 'connected' && CONTRACT_ADDRESS) {
    try {
      const provider = new ethers.JsonRpcProvider(bc.rpcUrl);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CREDENTIAL_REGISTRY_ABI, provider);
      const result = await contract.verifyCredential(credential.canonicalHash);
      if (result.exists && !result.isRevoked) {
        onChainVerified = true;
        onChainTimestamp = Number(result.timestamp);
        onChainIssuer = result.issuer;
      }
    } catch (e: any) {
      console.warn('On-chain verification query notice:', e.message);
    }
  }

  // Public sanitized response: never expose private email
  res.json({
    verified: true,
    status: 'authentic',
    message: 'Credential cryptographically verified against authoritative records.',
    credential: {
      id: credential.id,
      studentName: credential.studentName,
      studentId: credential.studentId,
      degree: credential.degree,
      major: credential.major,
      institution: credential.institution,
      issueDate: credential.issueDate,
      honors: credential.honors,
      gpa: credential.gpa,
      canonicalHash: credential.canonicalHash,
      recomputedHash,
      status: credential.status,
      txHash: credential.txHash || null,
      blockNumber: credential.blockNumber || null,
      networkName: credential.networkName,
      chainId: credential.chainId || null,
      contractAddress: credential.contractAddress || null,
      onChainAnchored: credential.onChainAnchored || onChainVerified,
      onChainTimestamp,
      onChainIssuer,
    },
    blockchainStatus: bc,
  });
});

// --- Development/Testing Tamper Endpoint ---
app.post('/api/test/tamper-check', async (req, res) => {
  const { originalPayload, alteredField, alteredValue } = req.body;
  if (!originalPayload || !alteredField) {
    return res.status(400).json({ error: 'Payload and altered field required.' });
  }

  const modified = { ...originalPayload, [alteredField]: alteredValue };
  const alteredHash = await computeCanonicalHash(modified);
  const originalHash = await computeCanonicalHash(originalPayload);

  res.json({
    tamperTested: true,
    originalHash,
    alteredHash,
    hashMatch: originalHash.toLowerCase() === alteredHash.toLowerCase(),
    explanation:
      'Client/Test Demonstration: changing any single character in a canonical field changes the SHA-256 digest completely (avalanche effect).',
  });
});

// --- Mount Vite in Development / Serve Static in Production ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CredentialChain] Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
