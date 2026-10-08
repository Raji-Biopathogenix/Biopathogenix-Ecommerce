"""Intuit Charge verification policy; never log card data or security codes."""


class CardVerificationRejected(ValueError):
    """Verification failed and Intuit confirmed reversal; a new attempt is safe."""


class PaymentReviewRequired(Exception):
    """A captured charge needs review before the customer attempts payment again."""
    def __init__(self, transaction_id):
        self.transaction_id = transaction_id
        super().__init__('Payment verification could not be completed and reversal is unconfirmed. '
                         'Please contact billing before attempting another payment.')


def verification_error(charge, *, saved_card=False):
    """Intuit returns these independent results at the Charge's top level.

    Street and ZIP must both be Pass. Missing/unknown/unavailable AVS results
    are not proof of an address match. New cards require CVV Pass. Vaulted cards
    cannot retain CVV, so missing/NotAvailable CVV is allowed only on that path;
    an explicit Fail or unknown result is still rejected.
    """
    for field, label in (('avsStreet', 'billing street address'), ('avsZip', 'billing ZIP code')):
        value = str(charge.get(field) or '').strip().casefold()
        if value == 'fail':
            return f'The {label} did not match the card issuer\'s records. Please correct it or use another card.'
        if value != 'pass':
            return f'The card issuer could not verify your {label}. Please use another card or pay by invoice.'
    cvv = str(charge.get('cardSecurityCodeMatch') or '').strip().casefold()
    if cvv == 'fail':
        return 'The card security code did not match. Please check it or use another card.'
    if cvv != 'pass' and not (saved_card and cvv in ('', 'notavailable')):
        return 'The card issuer could not verify the security code. Please use another card or pay by invoice.'
    return None
