/**
 * Canonical Academic Credential Schema and SHA-256 Hashing.
 * 
 * CANONICAL HASH SPECIFICATION:
 * The canonical payload is a deterministic UTF-8 JSON object containing:
 *  - degree: string (trimmed)
 *  - id: string (trimmed uppercase identifier)
 *  - institution: string (trimmed)
 *  - issueDate: string (YYYY-MM-DD format)
 *  - major: string (trimmed)
 *  - studentId: string (trimmed uppercase)
 *  - studentName: string (trimmed)
 * 
 * Fields are serialized in strict alphabetical order with no extra whitespace.
 * The SHA-256 digest of this canonical JSON string is the immutable cryptographic anchor.
 */

export interface CanonicalCredentialPayload {
  degree: string;
  id: string;
  institution: string;
  issueDate: string;
  major: string;
  studentId: string;
  studentName: string;
}

export function buildCanonicalPayload(input: {
  id: string;
  studentId: string;
  studentName: string;
  degree: string;
  major: string;
  institution: string;
  issueDate: string;
}): CanonicalCredentialPayload {
  return {
    degree: input.degree.trim(),
    id: input.id.trim(),
    institution: input.institution.trim(),
    issueDate: input.issueDate.trim(),
    major: input.major.trim(),
    studentId: input.studentId.trim(),
    studentName: input.studentName.trim(),
  };
}

export function serializeCanonicalPayload(payload: CanonicalCredentialPayload): string {
  // Deterministic JSON with explicit sorted keys
  return JSON.stringify({
    degree: payload.degree,
    id: payload.id,
    institution: payload.institution,
    issueDate: payload.issueDate,
    major: payload.major,
    studentId: payload.studentId,
    studentName: payload.studentName,
  });
}

/**
 * Computes SHA-256 hash in browser or Node.js runtime.
 */
export async function computeCanonicalHash(
  payload: CanonicalCredentialPayload
): Promise<string> {
  const canonicalString = serializeCanonicalPayload(payload);

  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(canonicalString);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return `0x${hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')}`;
  } else {
    // Node.js runtime
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
    return `0x${hash}`;
  }
}
