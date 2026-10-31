import { User, CredentialRecord, VerificationResult, BlockchainStatus } from '../types';

const TOKEN_KEY = 'credentialchain_auth_token_v2';

async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const apiClient = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string | null) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  request: apiRequest,


  // --- Auth & Admin Setup ---
  async getAdminStatus(): Promise<{ adminProvisioned: boolean; totalUsers: number; totalCredentials: number }> {
    return this.request('/api/admin/status');
  },

  async provisionAdmin(params: {
    name: string;
    email: string;
    password: string;
    institution: string;
  }): Promise<{ user: User; token: string }> {
    const res = await this.request<{ user: User; token: string }>('/api/admin/provision', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    this.setToken(res.token);
    return res;
  },

  async registerStudent(params: {
    name: string;
    studentId: string;
    email: string;
    password: string;
  }): Promise<{ user: User; token: string }> {
    const res = await this.request<{ user: User; token: string }>('/api/auth/register-student', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    this.setToken(res.token);
    return res;
  },

  async login(params: { email: string; password: string }): Promise<{ user: User; token: string }> {
    const res = await this.request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    this.setToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    return this.request('/api/auth/me');
  },

  logout() {
    this.setToken(null);
  },

  // --- Blockchain Status ---
  async getBlockchainStatus(): Promise<BlockchainStatus> {
    return this.request('/api/blockchain/status');
  },

  // --- Student Credential APIs ---
  async getStudentCredentials(): Promise<{
    credentials: CredentialRecord[];
    student: { name: string; email: string; studentId: string };
  }> {
    return this.request('/api/student/credentials');
  },

  // --- Admin Credential APIs ---
  async getAdminCredentials(): Promise<{ credentials: CredentialRecord[] }> {
    return this.request('/api/admin/credentials');
  },

  async issueCredential(data: {
    studentName: string;
    studentEmail: string;
    studentId: string;
    degree: string;
    major: string;
    institution: string;
    issueDate: string;
    gpa?: string;
    honors?: string;
  }): Promise<{ message: string; credential: CredentialRecord }> {
    return this.request('/api/admin/credentials/issue', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async revokeCredential(id: string): Promise<{ message: string; credential: CredentialRecord }> {
    return this.request('/api/admin/credentials/revoke', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  },

  // --- Public Verification ---
  async verifyCredential(idOrHash: string): Promise<VerificationResult> {
    const clean = encodeURIComponent(idOrHash.trim());
    const response = await fetch(`/api/credentials/verify/${clean}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json().catch(() => ({}));

    if (response.status === 404) {
      return {
        verified: false,
        status: 'not_found',
        message: data.message || 'No matching record exists in the authoritative registry.',
      };
    }

    if (response.status === 422) {
      return {
        verified: false,
        status: 'tamper_detected',
        message: data.message || 'The credential hash does not match the authoritative record.',
        credential: data.credentialId ? ({ id: data.credentialId } as any) : undefined,
        recordedHash: data.recordedHash,
        recomputedHash: data.recomputedHash,
      };
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || `Verification request failed (${response.status})`);
    }

    return data as VerificationResult;
  },

  // --- Test Tamper Endpoint ---
  async testTamper(
    originalPayload: any,
    alteredField: string,
    alteredValue: string
  ): Promise<{
    tamperTested: boolean;
    originalHash: string;
    alteredHash: string;
    hashMatch: boolean;
    explanation: string;
  }> {
    return this.request('/api/test/tamper-check', {
      method: 'POST',
      body: JSON.stringify({ originalPayload, alteredField, alteredValue }),
    });
  },
};
