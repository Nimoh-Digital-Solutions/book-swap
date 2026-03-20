"""
bookswap views.

Replace this stub with your application views.

Example pattern — a simple ModelViewSet:

    class ExampleViewSet(viewsets.ModelViewSet):
        serializer_class = ExampleSerializer
        permission_classes = [IsAuthenticated]

        def get_queryset(self):
            return Example.objects.filter(user=self.request.user)

        def perform_create(self, serializer):
            serializer.save(user=self.request.user)
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class ExampleView(APIView):
    """
    Example API view — replace with your application logic.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"message": "Hello from bookswap!"}, status=status.HTTP_200_OK)
