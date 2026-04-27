"""apps.books views package — split by domain (AUD-B-302).

Public API is preserved: every view callable that used to live in
``apps.books.views`` is re-exported here so imports such as
``from . import views; views.BookViewSet`` and ``mock.patch`` paths like
``apps.books.views.CommunityStatsView._compute_payload`` keep working.
"""

from ._helpers import _get_blocked_user_ids
from .crud import BookPagination, BookViewSet
from .discovery import RADIUS_BUCKETS, BrowsePagination, BrowseViewSet, NearbyCountView
from .lookups import ExternalSearchView, ISBNLookupView
from .photos import BookPhotoViewSet
from .stats import CommunityStatsView
from .wishlist import WishlistItemViewSet

__all__ = [
    "RADIUS_BUCKETS",
    "BookPagination",
    "BookPhotoViewSet",
    "BookViewSet",
    "BrowsePagination",
    "BrowseViewSet",
    "CommunityStatsView",
    "ExternalSearchView",
    "ISBNLookupView",
    "NearbyCountView",
    "WishlistItemViewSet",
    "_get_blocked_user_ids",
]
