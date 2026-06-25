from rest_framework.response import Response
from rest_framework import status, permissions, viewsets
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import Address
from .serializers import AddressSerializer


class AddressViewset(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        addresses = self.get_queryset()
        serializer = AddressSerializer(addresses, many=True)
        return Response(
            {"status": "success", "result": {"data": serializer.data}},
            status=status.HTTP_200_OK,
        )

    def create(self, request, *args, **kwargs):
        data = {**request.data, "user": request.user.id}
        serializer = AddressSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"status": "success", "message": "Address saved.", "result": {"data": serializer.data}},
                status=status.HTTP_201_CREATED,
            )
        return Response(
            {"status": "error", "errors": serializer.errors, "message": "Validation failed."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def update(self, request, *args, **kwargs):
        address = self.get_object()
        data = {**request.data, "user": request.user.id}
        serializer = AddressSerializer(address, data=data, partial=kwargs.get("partial", False))
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"status": "success", "message": "Address updated.", "result": {"data": serializer.data}},
                status=status.HTTP_200_OK,
            )
        return Response(
            {"status": "error", "errors": serializer.errors, "message": "Validation failed."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        address = self.get_object()
        address.delete()
        return Response({"status": "success", "message": "Address deleted."}, status=status.HTTP_200_OK)
