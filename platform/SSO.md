# One CA7 account for the tools (single sign-on)

CA7 can act as an **OpenID Connect provider**. A person makes one CA7 account (they are logged in on the website, cloud.ca7.io); the
tools that support OIDC login then let them in with that account, without a second password.

| Tool | Works with CA7 login? |
|---|---|
| ThingsBoard | Yes: Security settings > OAuth2 > generic OpenID provider |
| OpenRemote | Yes: through its Keycloak: Identity providers > OpenID Connect v1.0 |
| Dify | No. The open-source edition has no OIDC login (only the enterprise edition). Keep its own login |
| Airbyte | No. The open-source edition has no OIDC login (SSO is a paid feature) |

> This was built and tested against a simulated client (the full code flow with PKCE, wrong secret, wrong redirect, code reuse).
> It has **not** been tried against a real ThingsBoard or Keycloak, so expect to adjust field names in their screens.

## 1. Switch it on in the CA7 environment

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 | awk '{printf "%s\\n",$0}'   # the private key on one line
```

```
CA7_OIDC_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
CA7_OIDC_CLIENTS=[{"id":"thingsboard","secret":"<long random>","redirectUris":["https://tb.example.com/login/oauth2/code/"]},
                  {"id":"openremote","secret":"<long random>","redirectUris":["https://or.example.com/auth/realms/master/broker/ca7/endpoint"]}]
NEXT_PUBLIC_SERVER_URL=https://cloud.ca7.io
```

A redirect address must match one registered here (an entry that ends with `/` allows addresses that start with it).
Discovery: `https://cloud.ca7.io/api/ca/oidc/.well-known/openid-configuration`

## 2. ThingsBoard

Security > OAuth 2.0 > add provider: Generic. Client id and secret from above, Access token URI `.../api/ca/oidc/token`,
Authorization URI `.../api/ca/oidc/authorize`, JWK set URI `.../api/ca/oidc/jwks`, User info URI `.../api/ca/oidc/userinfo`,
scope `openid profile email`, client authentication `POST` or `BASIC`, user name attribute `email`. Enable "Allow user creation".

## 3. OpenRemote (Keycloak)

Keycloak admin > realm > Identity providers > OpenID Connect v1.0, alias `ca7`, import from the discovery URL above, client id and secret
from above, client authentication "Client secret sent as post" (or basic), PKCE method S256. Set "Sync mode" to import.

## What the login gives

`sub` (CA7 user id), `email`, `name`, `preferred_username`, `locale`. Accounts in the tools are created on the first login;
what a person may do in a tool is set in that tool (roles there), not by the CA7 pack.

## Security notes

Codes are valid 60 seconds, work once, and are bound to the client, the redirect address and the PKCE challenge.
The "once" is remembered in memory, so with several server instances use sticky sessions or add a shared store.
Only a real login session (cookie) can authorise; an API key cannot. Rotate the private key by replacing it and the tools' cached keys.
