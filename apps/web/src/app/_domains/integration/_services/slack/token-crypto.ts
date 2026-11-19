import { createTokenCipher } from "@/utils/crypto/token-cipher";

const cipher = createTokenCipher("SLACK_TOKEN_ENCRYPTION_KEY");

export function encryptSlackToken(plain: string): string {
  return cipher.encrypt(plain);
}

export function decryptSlackToken(payload: string): string {
  return cipher.decrypt(payload);
}
