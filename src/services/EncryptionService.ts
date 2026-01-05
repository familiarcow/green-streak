import logger from '../utils/logger';

// Simple XOR-based encryption with base64 encoding
// Note: This is not cryptographically secure, but provides basic obfuscation
// For a production app, you'd want to use a proper encryption library

const ENCRYPTION_KEY = 'GreenStreak2024!'; // Hardcoded deterministic key

class EncryptionService {
  private static xorEncrypt(data: string, key: string): string {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  }

  private static xorDecrypt(data: string, key: string): string {
    // XOR is symmetric, so encrypt and decrypt are the same operation
    return this.xorEncrypt(data, key);
  }

  static encrypt(plaintext: string): string {
    try {
      logger.debug('DATA', 'Encrypting data', { length: plaintext.length });
      
      // First XOR encrypt
      const encrypted = this.xorEncrypt(plaintext, ENCRYPTION_KEY);
      
      // Then base64 encode for safe transport
      const base64 = btoa(encrypted);
      
      logger.info('DATA', 'Data encrypted successfully');
      return base64;
    } catch (error) {
      logger.error('DATA', 'Encryption failed', { error });
      throw new Error('Failed to encrypt data');
    }
  }

  static decrypt(ciphertext: string): string {
    try {
      logger.debug('DATA', 'Decrypting data', { length: ciphertext.length });
      
      // First base64 decode
      const encrypted = atob(ciphertext);
      
      // Then XOR decrypt
      const decrypted = this.xorDecrypt(encrypted, ENCRYPTION_KEY);
      
      logger.info('DATA', 'Data decrypted successfully');
      return decrypted;
    } catch (error) {
      logger.error('DATA', 'Decryption failed', { error });
      throw new Error('Failed to decrypt data');
    }
  }

  static validateEncryptedData(ciphertext: string): boolean {
    try {
      const decrypted = this.decrypt(ciphertext);
      const parsed = JSON.parse(decrypted);
      
      // Basic validation - check if it has the expected structure
      return (
        parsed && 
        typeof parsed === 'object' &&
        parsed.version &&
        parsed.exportDate &&
        parsed.data &&
        Array.isArray(parsed.data.tasks) &&
        Array.isArray(parsed.data.logs)
      );
    } catch {
      return false;
    }
  }
}

export default EncryptionService;