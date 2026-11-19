import { isCloud } from "@/utils/environment/env";
import {
  decryptWithKey,
  encryptWithKey,
  loadHexKeyFromEnv,
} from "@/utils/crypto/aes-gcm";

export type TokenCipher = {
  encrypt: (plain: string) => string;
  decrypt: (payload: string) => string;
};

// Cloud keeps fail-fast validation; self-hosted integrations load their key on use.
export function createTokenCipher(envVarName: string): TokenCipher {
  let key: Buffer | undefined;
  const getKey = () => (key ??= loadHexKeyFromEnv(envVarName));
  if (isCloud()) getKey();

  return {
    encrypt: (plain) => encryptWithKey(plain, getKey()),
    decrypt: (payload) => decryptWithKey(payload, getKey()),
  };
}
