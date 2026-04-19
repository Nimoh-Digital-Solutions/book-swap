"""ISBN lookup service for the books app."""

import logging
import re
from typing import Any

import httpx

logger = logging.getLogger(__name__)

OPEN_LIBRARY_ISBN_URL = "https://openlibrary.org/isbn/{isbn}.json"
OPEN_LIBRARY_AUTHOR_URL = "https://openlibrary.org{key}.json"
OPEN_LIBRARY_WORKS_URL = "https://openlibrary.org{key}.json"
OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json"
GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"
ISBN_TIMEOUT = 10  # seconds

USER_AGENT = "BookSwap/1.0 (bookswap.example; contact@bookswap.example)"


class ISBNLookupError(Exception):
    """Raised when ISBN lookup fails from all sources."""


def _extract_year(date_str: str) -> int | None:
    """Extract a 4-digit year from a date string."""
    if not date_str:
        return None
    match = re.search(r"\b(\d{4})\b", date_str)
    return int(match.group(1)) if match else None


def _resolve_ol_author(key: str, client: httpx.Client) -> str:
    """Fetch an author name from Open Library by author key (e.g. /authors/OL123A)."""
    try:
        resp = client.get(
            OPEN_LIBRARY_AUTHOR_URL.format(key=key),
            timeout=5,
        )
        if resp.status_code == 200:
            data = resp.json()
            return data.get("name", data.get("personal_name", ""))
    except (httpx.HTTPError, ValueError, KeyError):
        pass
    return ""


class ISBNLookupService:
    """Look up book metadata by ISBN (Open Library → Google Books fallback)
    and search by title/author via Open Library.
    """

    @classmethod
    def _normalise_open_library(cls, data: dict, client: httpx.Client) -> dict[str, Any]:
        """Normalise an Open Library ISBN response to a BookMetadata dict."""
        title = data.get("title", "")

        authors = data.get("authors", [])
        author_names = []
        for a in authors:
            if isinstance(a, dict):
                if "name" in a:
                    author_names.append(a["name"])
                elif "key" in a:
                    name = _resolve_ol_author(a["key"], client)
                    if name:
                        author_names.append(name)
        author = ", ".join(author_names) if author_names else ""

        description = ""
        desc_raw = data.get("description")
        if isinstance(desc_raw, str):
            description = desc_raw
        elif isinstance(desc_raw, dict):
            description = desc_raw.get("value", "")

        covers = data.get("covers", [])
        cover_url = f"https://covers.openlibrary.org/b/id/{covers[0]}-L.jpg" if covers else ""

        isbn_13 = data.get("isbn_13", [])
        isbn_10 = data.get("isbn_10", [])
        isbn = (isbn_13[0] if isbn_13 else isbn_10[0]) if (isbn_13 or isbn_10) else ""

        languages = data.get("languages", [])
        language = ""
        if languages:
            first_lang = languages[0]
            if isinstance(first_lang, dict):
                lang_key = first_lang.get("key", "")
                language = lang_key.rsplit("/", 1)[-1] if "/" in lang_key else lang_key
            elif isinstance(first_lang, str):
                language = first_lang.rsplit("/", 1)[-1] if "/" in first_lang else first_lang

        # If language or description is missing, try the Works endpoint.
        works = data.get("works", [])
        if works and isinstance(works[0], dict) and (not language or not description):
            work_key = works[0].get("key", "")
            if work_key:
                language, description = cls._enrich_from_works(
                    work_key, client, language, description,
                )

        return {
            "isbn": isbn,
            "title": title,
            "author": author,
            "description": description[:2000],
            "cover_url": cover_url,
            "page_count": data.get("number_of_pages"),
            "publish_year": _extract_year(data.get("publish_date", "")),
            "language": language,
        }

    @staticmethod
    def _enrich_from_works(
        work_key: str,
        client: httpx.Client,
        current_language: str,
        current_description: str,
    ) -> tuple[str, str]:
        """Fetch extra metadata (language, description) from the Works endpoint."""
        try:
            resp = client.get(
                OPEN_LIBRARY_WORKS_URL.format(key=work_key),
                timeout=5,
            )
            if resp.status_code != 200:
                return current_language, current_description
            work_data = resp.json()
        except (httpx.HTTPError, ValueError, KeyError):
            return current_language, current_description

        language = current_language
        if not language:
            subjects = work_data.get("subject_languages", [])
            if subjects:
                language = subjects[0] if isinstance(subjects[0], str) else ""

        description = current_description
        if not description:
            desc_raw = work_data.get("description")
            if isinstance(desc_raw, str):
                description = desc_raw
            elif isinstance(desc_raw, dict):
                description = desc_raw.get("value", "")

        return language, description

    @staticmethod
    def _normalise_google_books(item: dict) -> dict[str, Any]:
        """Normalise a Google Books volume to a BookMetadata dict."""
        info = item.get("volumeInfo", {})
        identifiers = info.get("industryIdentifiers", [])
        isbn = ""
        for ident in identifiers:
            if ident.get("type") == "ISBN_13":
                isbn = ident["identifier"]
                break
            if ident.get("type") == "ISBN_10":
                isbn = ident["identifier"]

        image_links = info.get("imageLinks", {})
        cover_url = image_links.get("thumbnail", image_links.get("smallThumbnail", ""))

        return {
            "isbn": isbn,
            "title": info.get("title", ""),
            "author": ", ".join(info.get("authors", [])),
            "description": (info.get("description") or "")[:2000],
            "cover_url": cover_url,
            "page_count": info.get("pageCount"),
            "publish_year": _extract_year(info.get("publishedDate", "")),
            "language": info.get("language", ""),
        }

    @classmethod
    def lookup_isbn(cls, isbn: str) -> dict[str, Any]:
        """Look up a single ISBN. Tries Open Library first, then Google Books.

        If Open Library returns data but is missing author or language,
        Google Books is queried as a supplement.

        Returns a normalised BookMetadata dict.
        Raises ``ISBNLookupError`` if both sources fail.
        """
        ol_result = None
        gb_result = None

        with httpx.Client(headers={"User-Agent": USER_AGENT}) as client:
            try:
                resp = client.get(
                    OPEN_LIBRARY_ISBN_URL.format(isbn=isbn),
                    timeout=ISBN_TIMEOUT,
                    follow_redirects=True,
                )
                if resp.status_code == 200:
                    ol_result = cls._normalise_open_library(resp.json(), client)
            except (httpx.HTTPError, ValueError, KeyError) as exc:
                logger.info("Open Library ISBN lookup failed for %s: %s", isbn, exc)

        has_gaps = ol_result and (not ol_result.get("author") or not ol_result.get("language"))

        if not ol_result or has_gaps:
            try:
                resp = httpx.get(
                    GOOGLE_BOOKS_URL,
                    params={"q": f"isbn:{isbn}", "maxResults": "1"},
                    headers={"User-Agent": USER_AGENT},
                    timeout=ISBN_TIMEOUT,
                )
                resp.raise_for_status()
                data = resp.json()
                items = data.get("items", [])
                if items:
                    gb_result = cls._normalise_google_books(items[0])
            except (httpx.HTTPError, ValueError, KeyError) as exc:
                logger.info("Google Books ISBN lookup failed for %s: %s", isbn, exc)

        if ol_result and gb_result:
            return cls._merge_results(ol_result, gb_result)
        if ol_result:
            return ol_result
        if gb_result:
            return gb_result

        raise ISBNLookupError(f"No metadata found for ISBN {isbn}")

    @staticmethod
    def _merge_results(primary: dict, secondary: dict) -> dict:
        """Fill gaps in the primary result with data from the secondary source."""
        for key in ("author", "language", "description", "cover_url", "page_count", "publish_year"):
            if not primary.get(key) and secondary.get(key):
                primary[key] = secondary[key]
        return primary

    @classmethod
    def search_external(cls, query: str, limit: int = 10) -> list[dict[str, Any]]:
        """Search Open Library by title/author query.

        Returns a list of normalised BookMetadata dicts (up to ``limit``).
        """
        try:
            resp = httpx.get(
                OPEN_LIBRARY_SEARCH_URL,
                params={"q": query, "limit": str(min(limit, 20))},
                headers={"User-Agent": USER_AGENT},
                timeout=ISBN_TIMEOUT,
            )
            resp.raise_for_status()
            data = resp.json()
        except (httpx.HTTPError, ValueError) as exc:
            logger.warning("Open Library search failed for '%s': %s", query, exc)
            return []

        results = []
        for doc in data.get("docs", []):
            cover_id = doc.get("cover_i")
            cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-M.jpg" if cover_id else ""
            isbn_list = doc.get("isbn", [])
            results.append(
                {
                    "isbn": isbn_list[0] if isbn_list else "",
                    "title": doc.get("title", ""),
                    "author": ", ".join(doc.get("author_name", [])),
                    "description": "",
                    "cover_url": cover_url,
                    "page_count": doc.get("number_of_pages_median"),
                    "publish_year": doc.get("first_publish_year"),
                }
            )
        return results
