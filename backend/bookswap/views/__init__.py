"""bookswap views package — split by domain (AUD-B-301).

Public API is preserved: every view callable that used to live in
``bookswap.views`` is re-exported here so imports such as
``from bookswap.views import login_view`` and ``mock.patch`` paths like
``bookswap.views.AppleMobileAuthView._get_apple_public_keys`` keep working.
"""

from .account import (
    AccountDeletionCancelView,
    AccountDeletionRequestView,
    DataExportView,
)
from .auth import _hash_login_input, login_view
from .devices import MobileDeviceProxyView
from .social_auth import AppleMobileAuthView, GoogleMobileAuthView
from .users import (
    CheckUsernameView,
    OnboardingCompleteView,
    SetLocationView,
    UserDetailView,
    UserMeView,
)

__all__ = [
    "AccountDeletionCancelView",
    "AccountDeletionRequestView",
    "AppleMobileAuthView",
    "CheckUsernameView",
    "DataExportView",
    "GoogleMobileAuthView",
    "MobileDeviceProxyView",
    "OnboardingCompleteView",
    "SetLocationView",
    "UserDetailView",
    "UserMeView",
    "_hash_login_input",
    "login_view",
]
