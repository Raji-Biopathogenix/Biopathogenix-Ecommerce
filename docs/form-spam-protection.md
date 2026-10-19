# Contact form spam protection

## Notification recipients

Regular website contact, sales/chat intake, validation, assay, custom target and
quality-control forms no longer send notifications to `order@biopathogenix.com`.
They use `support@biopathogenix.com`; validation chat keeps its validation inbox,
and career applications keep their careers inbox. The required notification BCC
is `rajeswari.gopu@biopathogenix.com`, including Graph and SMTP delivery. Configured
regular form recipients are filtered so an old order-inbox environment setting
cannot accidentally restore that destination.

The three standalone landing-page sources (`general-value-prop`,
`custom-assay-landing-page`, `custom-assay-development`) keep both order and support
as recipients, with the required BCC and existing Zapier BCC. Other panel-assessment
sources use support only. Customer confirmations and order transaction emails keep
their existing recipients.

The main contact page, chat intake, validation, quality control, assay inquiry,
custom targets, registration and the three standalone landing pages now use the same
backend protection. Public registration always creates an inactive account, regardless
of a submitted activation value. Order confirmation emails keep their existing behavior.

Without external keys, protection includes a hidden `website` honeypot, server-side
email/type/length checks, 10 attempts per 15-minute window per IP across forms,
5 attempts per hour per email across forms, and suppression of identical requests
for 15 minutes. Attempts include failed requests. Windows are fixed; limits can be
adjusted using `FORM_SUBMISSIONS_PER_15_MINUTES` and
`FORM_SUBMISSIONS_PER_EMAIL_PER_HOUR`. Failed validation or delivery releases the
duplicate reservation so the customer can retry within the submission limits.

## Enable the stronger bot challenge

Create a Cloudflare Turnstile **Managed** widget and allow the site's production
hostnames. Configure the Django deployment with:

```text
TURNSTILE_SITE_KEY=<public site key>
TURNSTILE_SECRET_KEY=<private secret key>
TURNSTILE_ALLOWED_HOSTNAMES=biopathogenix.com,www.biopathogenix.com
USE_REDIS_CACHE=true
REDIS_URL=<existing shared Redis URL>
```

Keep the secret in backend deployment secrets. The frontend fetches only the public
key through `/api/form-protection-config`; no frontend key or rebuild-time secret
is needed. Both keys must be configured together. Add any actual preview hostnames
explicitly when testing. Use Cloudflare's official test keys locally, never production.

The backend checks token validity, hostname and the `contact_form` action before
sending any mail. Missing/invalid tokens are rejected. Verification timeouts fail
closed with a retryable error. Each client attempt obtains a fresh token.

Deploy both the Next.js frontend and Django backend. Verify a legitimate request,
then check that a filled honeypot, repeated submission, and missing/invalid token
produce no email. The Turnstile script and its frames must be allowed by any deployed
Content Security Policy. Server verification follows
[Cloudflare's Siteverify documentation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

## Production infrastructure

Use the existing Redis cache option on every backend worker: local-memory cache
only enforces limits within one process and resets on restart. Keep Redis private
and available to the application. Avoid sharing the same cache namespace with
unrelated installations.

By default the code uses `REMOTE_ADDR` and ignores forwarding headers. If the app
sits behind a reverse proxy, set `FORM_TRUSTED_PROXY_IPS` to the actual socket IPs
of only your own proxies (for example `127.0.0.1,::1` for a local Nginx proxy).
Those proxies must append or overwrite `X-Forwarded-For` with the true connecting
address. The code walks that header from right to left and stops at the first
untrusted address, so an attacker cannot evade limits by adding a forged prefix.
Without real-IP/proxy configuration customers behind one proxy share an IP
allowance. Shared office networks may need a higher IP limit.
The landing pages now post directly to the same public backend used by the React
forms, preserving browser client IPs rather than sharing a Next.js proxy address.
Keep the website origin allowed in the backend's CORS configuration.

Monitor HTTP 400/429/503 counts for the eight endpoints and tune limits against
legitimate traffic. Avoid strict name/gibberish or email-domain bans: international
names, technical gene identifiers and legitimate customers can match these filters.
Turnstile reduces abuse but cannot guarantee zero spam. Messages sent directly to
the mailbox require the mail provider's spam/phishing filters separately.

## Missing pages and automated discovery traffic

Unsupported `/.well-known/*` requests now receive a cacheable 404 from Next.js,
without querying product categories. Category pages reject malformed slugs and
old `product-tag`/WordPress infrastructure paths before a backend fetch. Unknown
categories and out-of-range pagination return 404 without exception tracebacks;
unexpected service errors remain visible as 500s. No blanket bot ban is applied
to discovery URLs, since legitimate browsers and services can request them.

Both product pagination modes now share complete cached responses. Cache keys are
versioned to avoid old malformed loader entries and include the requested page size.
The existing 404 design is now registered as Next.js's actual not-found page.
Old shop/blog URLs with no verified replacement return 404; add redirects only when
their destination has been confirmed. These changes do not require database migrations.
