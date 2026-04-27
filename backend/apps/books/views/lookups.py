"""ISBN lookup and external metadata search proxy views."""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers import ExternalSearchSerializer, ISBNLookupSerializer
from ..services import ISBNLookupError, ISBNLookupService


class ISBNLookupView(APIView):
    """GET /books/isbn-lookup/?isbn=<isbn> — proxy ISBN metadata lookup."""

    permission_classes = (IsAuthenticated,)

    def get(self, request):
        serializer = ISBNLookupSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        isbn = serializer.validated_data["isbn"]
        try:
            metadata = ISBNLookupService.lookup_isbn(isbn)
        except ISBNLookupError:
            return Response(
                {"detail": f"No metadata found for ISBN {isbn}."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(metadata)


class ExternalSearchView(APIView):
    """GET /books/search-external/?q=<query> — proxy Open Library search."""

    permission_classes = (IsAuthenticated,)

    def get(self, request):
        serializer = ExternalSearchSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        query = serializer.validated_data["q"]
        results = ISBNLookupService.search_external(query)
        return Response(results)
