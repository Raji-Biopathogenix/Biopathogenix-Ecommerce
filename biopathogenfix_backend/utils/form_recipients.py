"""Website inquiries are separate from order mail and standalone landing leads."""
ORDER_INBOX = "order@biopathogenix.com"
FORM_RECIPIENTS = ["support@biopathogenix.com"]
LANDING_PAGE_RECIPIENTS = [ORDER_INBOX, *FORM_RECIPIENTS]
FORM_BCC = ["rajeswari.gopu@biopathogenix.com"]


def website_recipients(raw, fallback="support@biopathogenix.com"):
    values = raw.split(",") if isinstance(raw, str) else list(raw or [])
    recipients = []
    for value in values:
        address = str(value).strip()
        if address and address.lower() != ORDER_INBOX and address.lower() not in {item.lower() for item in recipients}:
            recipients.append(address)
    return recipients or [fallback]


def form_bcc(recipients, extra=()):
    values = extra.split(",") if isinstance(extra, str) else list(extra or [])
    seen = {address.lower() for address in recipients}
    result = []
    for address in [*FORM_BCC, *values]:
        address = str(address).strip()
        if address and address.lower() != ORDER_INBOX and address.lower() not in seen:
            result.append(address)
            seen.add(address.lower())
    return result
