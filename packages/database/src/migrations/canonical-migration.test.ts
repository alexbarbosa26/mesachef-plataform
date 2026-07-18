import { describe, expect, it } from 'vitest';

import { canonicalizeMigrationV1 } from './canonical-migration.js';

const encoder = new TextEncoder();

describe('migration canonicalization v1', () => {
  it('removes an UTF-8 BOM and normalizes CRLF and CR to LF', () => {
    const withBomAndMixedLineEndings = Uint8Array.from([
      0xef,
      0xbb,
      0xbf,
      ...encoder.encode('line 1\r\nline 2\r'),
    ]);
    const canonical = canonicalizeMigrationV1(withBomAndMixedLineEndings);

    expect(canonical.text).toBe('line 1\nline 2\n');
    expect(canonical.version).toBe('v1');
    expect(canonical.checksumSha256).toBe(
      '9060554863a62b9db5f726216876654e561896071d2e6480f2048b70e0fdadb9',
    );
  });

  it('preserves every byte represented by the remaining UTF-8 content', () => {
    const first = canonicalizeMigrationV1(
      encoder.encode('export const value = "á";\n'),
    );
    const changedWhitespace = canonicalizeMigrationV1(
      encoder.encode('export const value =  "á";\n'),
    );
    const changedFinalNewline = canonicalizeMigrationV1(
      encoder.encode('export const value = "á";'),
    );

    expect(first.checksumSha256).not.toBe(changedWhitespace.checksumSha256);
    expect(first.checksumSha256).not.toBe(changedFinalNewline.checksumSha256);
  });

  it('rejects malformed UTF-8 without replacing invalid bytes', () => {
    expect(() => canonicalizeMigrationV1(Uint8Array.from([0xc3, 0x28])))
      .toThrowError(
        expect.objectContaining({ code: 'MIGRATION_SOURCE_INVALID' }),
      );
  });
});
