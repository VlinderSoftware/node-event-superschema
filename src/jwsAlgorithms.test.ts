import { describe, test, expect } from 'vitest';
import { ALLOWED_JWS_ALGORITHMS, assertAllowedJwsAlgorithm } from './jwsAlgorithms';

describe('assertAllowedJwsAlgorithm', () => {
  test.each(['HS256', 'HS384', 'HS512', 'PS256', 'PS384', 'PS512', 'ES256', 'ES384', 'ES512'])(
    'accepts %s',
    (alg) => {
      expect(() => assertAllowedJwsAlgorithm(alg)).not.toThrow();
    }
  );

  // RSASSA-PKCS1-v1_5 verification falls back to node-forge, which is
  // vulnerable to signature forgery (CVE-2026-85393, no patched release).
  test.each(['RS256', 'RS384', 'RS512'])('rejects %s (RSASSA-PKCS1-v1_5)', (alg) => {
    expect(() => assertAllowedJwsAlgorithm(alg)).toThrow(/not allowed/);
    expect(() => assertAllowedJwsAlgorithm(alg)).toThrow(/CVE-2026-85393/);
  });

  test.each(['none', '', 'hs256', 'EdDSA', 'HS256 '])('rejects %j', (alg) => {
    expect(() => assertAllowedJwsAlgorithm(alg)).toThrow(/not allowed/);
  });

  test('does not list any RSASSA-PKCS1-v1_5 algorithm as allowed', () => {
    expect(ALLOWED_JWS_ALGORITHMS.filter((alg) => alg.startsWith('RS'))).toEqual([]);
  });
});
