/**
 * Cryptographic Utility for Secure Password Hashing using SHA-256 Web Crypto API
 */

export async function hashPassword(password: string): Promise<string> {
  if (!password) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function verifyPassword(inputPassword: string, storedPassword: string): Promise<boolean> {
  if (!inputPassword || !storedPassword) return false;
  
  // Direct check for legacy plain text passwords (backward compatibility)
  if (inputPassword === storedPassword) return true;
  
  // Hash the input password and compare with stored SHA-256 hash
  const inputHash = await hashPassword(inputPassword);
  return inputHash.toLowerCase() === storedPassword.toLowerCase();
}
