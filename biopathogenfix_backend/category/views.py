from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Category
from .serializers import CategoryListSerializer
from rest_framework import viewsets
from rest_framework.decorators import api_view
from product.models import Product


class CategoryViewset(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategoryListSerializer


    def list(self, request, *args, **kwargs):
        categories = Category.objects.filter(is_active=True).order_by("name")
        serializer = CategoryListSerializer(categories,many=True)
        return Response({
            "status": "success",
            "message": "Categories retrieved successfully",
            "data": serializer.data
        }, status=status.HTTP_200_OK)


@api_view(["GET"])
def GetCategoryChildrenWithProducts(request):
    category_slug = request.query_params.get("category_slug")
    if not category_slug:
        return Response(
            {"status": "error", "message": "category_slug is required"},
            status=400,
        )

    category = Category.objects.filter(slug=category_slug, is_active=True).first()
    if not category:
        return Response(
            {"status": "error", "message": "Category not found"},
            status=404,
        )

    children = list(category.children.filter(is_active=True).order_by("sort_order", "name"))

    grouped_sections = []
    for child in children:
        products = list(Product.objects.filter(categories__id=child.id, is_active=True).distinct().order_by("name").values("id", "name", "slug"))
        grouped_sections.append(
            {
                "id": child.id,
                "name": child.name,
                "slug": child.slug,
                "products": products,
            }
        )

    return Response(
        {
            "status": "success",
            "message": "Data Fetched Successfully",
            "result": {
                "category": {
                    "id": category.id,
                    "name": category.name,
                    "slug": category.slug,
                },
                "sections": grouped_sections,
            },
        },
        status=200,
    )



    

