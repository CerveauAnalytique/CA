import { issuer, enabled } from '@/lib/oidc'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!enabled()) return Response.json({ error: 'OIDC is not configured.' }, { status: 404 })
  const i = issuer()
  return Response.json({
    issuer: i,
    authorization_endpoint: `${i}/authorize`,
    token_endpoint: `${i}/token`,
    userinfo_endpoint: `${i}/userinfo`,
    jwks_uri: `${i}/jwks`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    scopes_supported: ['openid', 'profile', 'email'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
    code_challenge_methods_supported: ['S256'],
    claims_supported: ['sub', 'email', 'email_verified', 'name', 'preferred_username', 'locale'],
  })
}
