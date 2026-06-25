
# ═══════════════════════════════════════════════════════════════════════════════
# HOW TO SET UP QB TOKENS INITIALLY (one-time setup)
# ═══════════════════════════════════════════════════════════════════════════════
"""
STEP 1: Create your app at https://developer.intuit.com
        - Select "QuickBooks Online and Payments"
        - Copy Client ID and Client Secret → add to .env

STEP 2: Get initial tokens from the Playground:
        - Go to https://developer.intuit.com/app/developer/playground
        - Select your app (Production version)
        - Tick: com.intuit.quickbooks.payment
        - Click "Get authorization code" → Connect → Get tokens
        - Copy Access Token, Refresh Token, and Realm ID

STEP 3: Add tokens to your DB via Django Admin:
        - Go to /admin/payments/qbconfig/ ("Django Admin panel")
        - Click "Add QB Config"
        - Paste Access Token, Refresh Token, Realm ID
        - Set environment to "production"
        - Save

STEP 4: That's it! get_valid_qb_token() handles everything after this.
        - Access token auto-refreshes every 60 minutes
        - Refresh token rotates automatically and saves back to DB
        - If refresh token expires (100 days) → admin adds new tokens in /admin/

IMPORTANT: Never store raw card numbers anywhere.
           tokenize_card() sends card to QB Tokens API → returns safe token.
           Token is used immediately and discarded.
"""









Frontend POST /api/payments/checkout/
        ↓
CheckoutView
        ↓
validate_checkout_payload()       ← Layer 1: request validation
        ↓
duplicate check (idempotency_key) ← Layer 2: prevent double charge
        ↓
    card? ──────────────────────────────────────────────────
        ↓                                                   ↓
get_valid_qb_token()              invoice? → _create_order(status="pending")
  ↓ auto-refreshes from QBConfig
charge_card() → QB Payments API
  ↓ CAPTURED
_create_order(status="paid")
        ↓
Response { order_number, transaction_id, total }




<!-- More Test Cards -->
Card Number - Brand - Result
4111 1111 1111 1111 - Visa - Success
5500 0000 0000 0004 - Mastercard - Success
3714 496353 98431 - Amex - Success (CVV: 1234)

<!-- Decline Test Cards -->
Card Number - Result
4000 0000 0000 0002 - Declined
4000 0000 0000 9995 - Insufficient funds
4000 0000 0000 0069 - Expired card




Card Payment:
  QB Customer   → found or auto-created by email 
  QB Invoice    → created with all line items 
  QB Payment    → recorded → Invoice marked PAID 

Invoice Payment:
  QB Customer   → found or auto-created by email 
  QB Invoice    → created + emailed to customer 
  QB Payment    → NOT recorded (customer pays later)


