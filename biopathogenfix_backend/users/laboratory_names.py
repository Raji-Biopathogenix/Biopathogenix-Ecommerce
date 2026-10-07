import hashlib
import unicodedata


def laboratory_name_key(name):
    normalized = "".join(unicodedata.normalize("NFKC", name).casefold().split())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()
