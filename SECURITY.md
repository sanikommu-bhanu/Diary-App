# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.1.x   | ✅         |
| < 1.1   | ❌         |

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, email **security@fairydiary.app** with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Any suggested fixes (optional)

You can expect an acknowledgement within 48 hours and a resolution timeline within 7 days for critical issues.

## Security Architecture

- **Local-first**: All diary data is stored exclusively on the user's device. No data is sent to any server.
- **PIN security**: PBKDF2-HMAC-SHA256 with 100,000 iterations and a random 16-byte salt per user.
- **Session management**: 30-minute idle timeout + 8-hour absolute ceiling.
- **AI features**: Text is sent to OpenRouter only when the user explicitly uses AI features. No entry data is stored by Anthropic servers.
- **Transport**: HTTPS enforced via HSTS with 2-year max-age + preload.
- **Headers**: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.

## Known Limitations

- Rate limiting is instance-local (in-memory). For multi-instance deployments, integrate Upstash Redis.
- There is no server-side authentication. All security is device-local.
