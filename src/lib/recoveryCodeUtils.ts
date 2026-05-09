/**
 * Utility functions for generating and managing recovery codes
 */

// Generate a single recovery code (8 chars: uppercase + numbers) using a CSPRNG
export function generateRecoveryCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded I, O, 0, 1 for clarity
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars[arr[i] % chars.length];
  }
  return code;
}

// Generate multiple recovery codes
export function generateRecoveryCodes(count: number = 8): string[] {
  const codes: string[] = [];
  const usedCodes = new Set<string>();
  
  while (codes.length < count) {
    const code = generateRecoveryCode();
    if (!usedCodes.has(code)) {
      usedCodes.add(code);
      codes.push(code);
    }
  }
  
  return codes;
}

// Simple hash function for recovery codes (using Web Crypto API)
export async function hashRecoveryCode(code: string): Promise<string> {
  const normalizedCode = code.replace(/-/g, '').toUpperCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedCode);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify a recovery code against its hash
export async function verifyRecoveryCode(code: string, hash: string): Promise<boolean> {
  const codeHash = await hashRecoveryCode(code);
  return codeHash === hash;
}
