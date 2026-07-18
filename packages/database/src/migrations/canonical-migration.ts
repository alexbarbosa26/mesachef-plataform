import { createHash } from 'node:crypto';

import { CANONICALIZATION_VERSION } from './constants.js';
import { MigrationError } from './migration-errors.js';

const UTF8_BOM = Uint8Array.from([0xef, 0xbb, 0xbf]);

export type CanonicalMigration = Readonly<{
  bytes: Uint8Array;
  checksumSha256: string;
  text: string;
  version: typeof CANONICALIZATION_VERSION;
}>;

function startsWithUtf8Bom(source: Uint8Array): boolean {
  return UTF8_BOM.every((byte, index) => source[index] === byte);
}

export function canonicalizeMigrationV1(
  source: Uint8Array,
): CanonicalMigration {
  const sourceWithoutBom = startsWithUtf8Bom(source)
    ? source.subarray(UTF8_BOM.length)
    : source;
  let decodedSource: string;

  try {
    decodedSource = new TextDecoder('utf-8', {
      fatal: true,
      ignoreBOM: true,
    }).decode(sourceWithoutBom);
  } catch (error: unknown) {
    throw new MigrationError(
      'MIGRATION_SOURCE_INVALID',
      'Migration source must be valid UTF-8.',
      error,
    );
  }

  const canonicalText = decodedSource.replace(/\r\n?|\n/gu, (lineEnding) =>
    lineEnding === '\n' ? lineEnding : '\n',
  );
  const canonicalBytes = new TextEncoder().encode(canonicalText);
  const checksumSha256 = createHash('sha256')
    .update(canonicalBytes)
    .digest('hex');

  return Object.freeze({
    bytes: canonicalBytes,
    checksumSha256,
    text: canonicalText,
    version: CANONICALIZATION_VERSION,
  });
}
