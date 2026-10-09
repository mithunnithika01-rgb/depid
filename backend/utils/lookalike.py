"""
Look-alike Name Detection Utilities
Detects homoglyphs, typosquatting, added words, and spacing tricks.
"""

import unicodedata
import re


# Common homoglyph mappings (Latin → similar-looking characters)
HOMOGLYPHS = {
    'a': ['а', 'ɑ', 'α'],  # Cyrillic a, Latin alpha, Greek alpha
    'e': ['е', 'ε', '3'],   # Cyrillic e, Greek epsilon, number 3
    'o': ['о', 'ο', '0'],   # Cyrillic o, Greek omicron, number 0
    'i': ['і', 'ι', '1', 'l', '|'],  # Cyrillic i, Greek iota, number 1
    'c': ['с', 'ϲ'],        # Cyrillic s, Greek lunate sigma
    'p': ['р', 'ρ'],        # Cyrillic r, Greek rho
    's': ['ѕ', 'ꜱ'],       # Cyrillic s
    'x': ['х', 'χ'],        # Cyrillic kh, Greek chi
    'y': ['у', 'γ'],        # Cyrillic u, Greek gamma
    'n': ['ո', 'η'],        # Armenian, Greek eta
    't': ['τ'],              # Greek tau
    'l': ['1', 'I', '|'],   # Number 1, capital I, pipe
}

# Common "added word" patterns used by scammers
SUSPICIOUS_WORDS = [
    'official', 'support', 'help', 'helpdesk', 'free', 'giveaway',
    'win', 'prize', 'crypto', 'nft', 'airdrop', 'discount', 'sale',
    'customer', 'service', 'team', 'real', 'original', 'legit',
    'verified', 'login', 'signin', 'account', 'secure',
]


def detect_lookalike(official_name: str, suspect_name: str) -> dict:
    """
    Compare official and suspect names for look-alike tricks.
    Returns detection results with trick types found.
    """
    official = official_name.lower().strip()
    suspect = suspect_name.lower().strip()

    tricks = []
    similarity = calculate_similarity(official, suspect)

    # 1. Check for homoglyphs
    if has_homoglyphs(suspect):
        tricks.append({
            "type": "homoglyph",
            "detail": "Contains characters from other alphabets that look like Latin letters",
        })

    # 2. Check for added words
    added = find_added_words(official, suspect)
    if added:
        tricks.append({
            "type": "added_words",
            "detail": f"Suspicious words added: {', '.join(added)}",
        })

    # 3. Check for spacing changes
    if has_spacing_tricks(official, suspect):
        tricks.append({
            "type": "spacing",
            "detail": "Uses dots, dashes, or spaces between characters",
        })

    # 4. Check for character swaps (typosquatting)
    if 0.6 < similarity < 1.0 and not tricks:
        tricks.append({
            "type": "typosquatting",
            "detail": f"Name is {round(similarity * 100)}% similar — possible typosquatting",
        })

    is_lookalike = len(tricks) > 0 or (0.7 < similarity < 1.0)

    return {
        "is_lookalike": is_lookalike,
        "similarity_score": round(similarity * 100),
        "tricks_detected": tricks,
    }


def has_homoglyphs(text: str) -> bool:
    """Check if text contains non-Latin characters that look like Latin."""
    for char in text:
        if char.isalpha():
            # Check if character is NOT basic Latin
            try:
                name = unicodedata.name(char, '')
                if 'CYRILLIC' in name or 'GREEK' in name or 'ARMENIAN' in name:
                    return True
            except ValueError:
                pass
    return False


def find_added_words(official: str, suspect: str) -> list:
    """Find suspicious words added to the brand name."""
    # Remove the official name from the suspect
    remaining = suspect.replace(official, '').strip()
    remaining = re.sub(r'[_\-.\s]+', ' ', remaining).strip()

    if not remaining:
        return []

    words = remaining.lower().split()
    suspicious = [w for w in words if w in SUSPICIOUS_WORDS]
    return suspicious


def has_spacing_tricks(official: str, suspect: str) -> bool:
    """Check if suspect uses spacing tricks (dots, dashes, spaces between chars)."""
    # Remove all separators and compare
    clean_suspect = re.sub(r'[\s._\-]+', '', suspect)
    clean_official = re.sub(r'[\s._\-]+', '', official)

    if clean_suspect == clean_official and suspect != official:
        return True

    # Check for patterns like "N.I.K.E" or "N I K E"
    spaced_pattern = re.sub(r'(.)', r'\1[\\s._\\-]*', official[:-1]) + official[-1]
    if re.match(spaced_pattern, suspect, re.IGNORECASE) and suspect != official:
        return True

    return False


def calculate_similarity(a: str, b: str) -> float:
    """Calculate Levenshtein-based similarity ratio between two strings."""
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0

    # Simple Levenshtein distance
    len_a, len_b = len(a), len(b)
    matrix = [[0] * (len_b + 1) for _ in range(len_a + 1)]

    for i in range(len_a + 1):
        matrix[i][0] = i
    for j in range(len_b + 1):
        matrix[0][j] = j

    for i in range(1, len_a + 1):
        for j in range(1, len_b + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            matrix[i][j] = min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost,
            )

    distance = matrix[len_a][len_b]
    max_len = max(len_a, len_b)
    return 1.0 - (distance / max_len)
