"""Default pagination classes used across the bookswap app.

A single ``DefaultPagination`` class is applied to every list endpoint so that
list responses always return a bounded, predictable page envelope
(``count`` / ``next`` / ``previous`` / ``results``) and clients cannot request
arbitrarily large pages — see AUD-B-401..405 in the deep audit.

Usage::

    from bookswap.pagination import DefaultPagination

    class MyViewSet(viewsets.ModelViewSet):
        pagination_class = DefaultPagination
"""

from rest_framework.pagination import PageNumberPagination


class DefaultPagination(PageNumberPagination):
    """Standard page-number pagination, capped at ``max_page_size``.

    - Default page size is 25 items.
    - Clients can override with ``?page_size=<n>``.
    - Anything above ``max_page_size`` is silently clamped down.
    """

    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100
