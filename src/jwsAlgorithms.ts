/**
 * JWS algorithms accepted for signing and verifying events.
 *
 * RSASSA-PKCS1-v1_5 (RS256/RS384/RS512) is deliberately excluded: node-jose
 * verifies it through node-forge whenever Node's crypto reports an
 * unsupported algorithm, and node-forge's PKCS#1 v1.5 verification allows
 * signature forgery (CVE-2026-85393, no patched release). The algorithms
 * below never reach that code path.
 */
export const ALLOWED_JWS_ALGORITHMS: readonly string[] = Object.freeze([
  'HS256', 'HS384', 'HS512',
  'PS256', 'PS384', 'PS512',
  'ES256', 'ES384', 'ES512'
]);

/**
 * Throw unless `algorithm` is one of the allowed JWS algorithms.
 *
 * @param algorithm - JWS `alg` value
 */
export function assertAllowedJwsAlgorithm(algorithm: string): void {
  if (!ALLOWED_JWS_ALGORITHMS.includes(algorithm)) {
    throw new Error(
      `JWS algorithm ${JSON.stringify(algorithm)} is not allowed; use one of ${ALLOWED_JWS_ALGORITHMS.join(', ')}` +
      ' (RSASSA-PKCS1-v1_5 is rejected because of CVE-2026-85393)'
    );
  }
}
