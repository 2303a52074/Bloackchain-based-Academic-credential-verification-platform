import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const emptyDb = {
  users: [],
  credentials: [],
  systemConfig: {
    adminProvisioned: false,
    createdAt: new Date().toISOString(),
  },
};

fs.writeFileSync(DB_FILE, JSON.stringify(emptyDb, null, 2), 'utf-8');
console.log('[CredentialChain] Database initialized to pristine empty state. Zero demo accounts, zero fake credentials.');
