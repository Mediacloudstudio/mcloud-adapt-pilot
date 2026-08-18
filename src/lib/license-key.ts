// License key generation (PART 20 — store hashed, never reversible,
// same principle as password/token hashing elsewhere in this codebase).
// The raw key is only ever returned once, at issuance, for the customer
// to see in their portal / activation email; from then on only its hash
// lives in the database.

import { randomBytes, createHash } from "crypto";

const GROUP_COUNT = 4;
const GROUP_LENGTH = 4;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid transcription errors

export function generateLicenseKey(): { rawKey: string; displayKey: string; keyHash: string } {
  const groups: string[] = [];
  for (let g = 0; g < GROUP_COUNT; g++) {
    let group = "";
    const bytes = randomBytes(GROUP_LENGTH);
    for (let i = 0; i < GROUP_LENGTH; i++) {
      const byte = bytes[i] ?? 0;
      group += ALPHABET[byte % ALPHABET.length];
    }
    groups.push(group);
  }
  const rawKey = `MCAP-${groups.join("-")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  // Masked form shown in tables/lists — enough to recognize, not enough to reuse.
  const displayKey = `MCAP-${groups[0]}-****-${groups[3]}`;
  return { rawKey, displayKey, keyHash };
}
