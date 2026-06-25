import logging

from django.db.utils import OperationalError, ProgrammingError
from rest_framework import status
from rest_framework import viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Prefetch
from .models import HeaderMenus, CareerOpenRole,Search,LandingPageType,LandingPageContext,LandingPageImage,BlogPost,BlogPostImage
from .career_constants import CAREER_DEPARTMENTS, normalize_department
from .serializers import HeaderMenuHomeSerializer,CareerApplicationCreateSerializer,CareerOpenRoleListSerializer,CareerOpenRoleSerializer,SearchSerializer,LandingPageImageSerializer,LandingPageContextSerializer,LandingPageTypeSerializer,BlogPostSerializer
from .career_email_service import (
    send_candidate_application_confirmation_email,
    send_internal_career_application_email,
)
from django.db.models import Count, Q
from category.models import Category
from category.serializers import SearchCategoryHeaderSerializer
from rest_framework.decorators import api_view


logger = logging.getLogger(__name__)



class HeaderMenuViewset(viewsets.ModelViewSet):
    queryset = HeaderMenus.objects.all()
    serializer_class = HeaderMenuHomeSerializer


    def list(self, request, *args, **kwargs):
        headermenus = HeaderMenus.objects.filter(category__is_active=True).order_by('category__sort_order')
        header_serialize_data = HeaderMenuHomeSerializer(headermenus,many = True,context={'request': request}).data
        categories = (
            Category.objects
            .filter(parent__isnull=False, is_active=True)
            .select_related('parent')                                  
            .annotate(product_count=Count('all_products',filter=Q(all_products__is_active=True),distinct=True))
            .filter(product_count__gt=0)
            .order_by('name')
        )
        search_categories= SearchCategoryHeaderSerializer(categories,many=True,context={'request': request}).data
        top_searchs=Search.objects.order_by('count','date')
        topSearches = SearchSerializer(top_searchs,many=True).data
        return Response({
            "status":"success",
            "message":"Data Fetched Successfully",
            "result":{
                "data":header_serialize_data,
                'search_categories':search_categories,
                'top_searchs': topSearches
                }}
            ,status=200)




class SearchViewset(viewsets.ModelViewSet):
    queryset = Search.objects.all()
    serializer_class = SearchSerializer







class CareerOpenRoleViewset(viewsets.ReadOnlyModelViewSet):
    queryset = CareerOpenRole.objects.all()
    serializer_class = CareerOpenRoleSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def get_serializer_class(self):
        if self.action == "list":
            return CareerOpenRoleListSerializer
        return CareerOpenRoleSerializer

    def get_queryset(self):
        queryset = CareerOpenRole.objects.filter(is_active=True).order_by("sort_order", "title")
        keyword = (self.request.query_params.get("keyword") or "").strip()
        location = (self.request.query_params.get("location") or "").strip()
        department = normalize_department(self.request.query_params.get("department") or "")
        if keyword:
            queryset = queryset.filter(title__icontains=keyword)
        if location:
            queryset = queryset.filter(location__icontains=location)
        if department:
            queryset = queryset.filter(department__iexact=department)
        return queryset

    def list(self, request, *args, **kwargs):
        try:
            serialized = self.get_serializer(self.get_queryset(), many=True).data
        except (ProgrammingError, OperationalError):
            logger.exception("CareerOpenRole table is not ready")
            serialized = []
        return Response(
            {
                "status": "success",
                "message": "Data Fetched Successfully",
                "result": {"departments": CAREER_DEPARTMENTS, "data": serialized},
            },
            status=status.HTTP_200_OK,
        )

    def retrieve(self, request, *args, **kwargs):
        try:
            role = self.get_object()
            serialized = self.get_serializer(role).data
        except (ProgrammingError, OperationalError):
            logger.exception("CareerOpenRole table is not ready")
            return Response(
                {"status": "error", "message": "Career roles table is not initialized."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {
                "status": "success",
                "message": "Data Fetched Successfully",
                "result": {"data": serialized},
            },
            status=status.HTTP_200_OK,
        )


class CareerApplicationCreateView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = CareerApplicationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save()

        try:
            send_internal_career_application_email(application)
        except Exception:
            logger.exception("Failed to send career application email")
            return Response(
                {"status": "error", "message": "Application saved, but email sending failed."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        confirmation_delivered = True
        try:
            send_candidate_application_confirmation_email(application)
        except Exception:
            confirmation_delivered = False
            logger.exception("Failed to send candidate confirmation email")

        response_message = "Application submitted successfully."
        if not confirmation_delivered:
            response_message = (
                "Application submitted successfully, but confirmation email could not be delivered."
            )

        return Response(
            {"status": "success", "message": response_message},
            status=status.HTTP_201_CREATED,
        )


class BlogPostViewset(viewsets.ReadOnlyModelViewSet):
    queryset = BlogPost.objects.filter(is_published=True)
    serializer_class = BlogPostSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        queryset = BlogPost.objects.filter(is_published=True).prefetch_related(
            Prefetch("images", queryset=BlogPostImage.objects.all().order_by("order", "created_at"))
        ).order_by("-published_at", "-created_at", "-id")
        search = (self.request.query_params.get("search") or "").strip()
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(excerpt__icontains=search)
                | Q(content_html__icontains=search)
            )
        return queryset

    def list(self, request, *args, **kwargs):
        try:
            serialized = self.get_serializer(self.get_queryset(), many=True, context={"request": request}).data
        except (ProgrammingError, OperationalError):
            logger.exception("BlogPost table is not ready")
            serialized = []
        return Response(
            {
                "status": "success",
                "message": "Data Fetched Successfully",
                "result": {"data": serialized},
            },
            status=status.HTTP_200_OK,
        )

    def retrieve(self, request, *args, **kwargs):
        try:
            post = self.get_object()
            serialized = self.get_serializer(post, context={"request": request}).data
        except (ProgrammingError, OperationalError):
            logger.exception("BlogPost table is not ready")
            return Response(
                {"status": "error", "message": "Blog posts table is not initialized."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {
                "status": "success",
                "message": "Data Fetched Successfully",
                "result": {"data": serialized},
            },
            status=status.HTTP_200_OK,
        )




@api_view(["GET"])
def LandingPageView(request):
    try:
        landing_page_contents=LandingPageType.objects.filter(is_active=True).prefetch_related(
            Prefetch("contexts", queryset=LandingPageContext.objects.filter(is_active=True)),
            Prefetch("images", queryset=LandingPageImage.objects.filter(is_active=True).order_by("order")),
        ).order_by("order")
        landing_page_serialization= LandingPageTypeSerializer(landing_page_contents,many=True,context={'request': request}).data
        # return Response({
        return Response(
            {
                "status": "success",
                "message": "Data Fetched Successfully",
                "result": {"data": landing_page_serialization},
            },
            status=status.HTTP_200_OK,
        )

    except Exception as exc:
        return Response({"status":"error", "message": "Data Not Found"}, status=400)
    

 
