from rest_framework import serializers
from .models import HeaderMenus, CareerOpenRole, CareerApplication,Search,LandingPageType,LandingPageContext,LandingPageImage,BlogPost,BlogPostImage

from category.serializers import HeaderCategorySerializer



class HeaderMenuHomeSerializer(serializers.ModelSerializer):
    category = HeaderCategorySerializer(read_only=True)
    class Meta:
        model = HeaderMenus
        fields = '__all__'


class SearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Search
        fields = ['name']


class CareerOpenRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerOpenRole
        fields = [
            "id",
            "title",
            "slug",
            "department",
            "location",
            "short_description",
            "description",
            "responsibilities",
            "requirements",
            "salary_range",
            "employment_type",
            "apply_url",
            "sort_order",
        ]


class CareerOpenRoleListSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerOpenRole
        fields = [
            "id",
            "title",
            "slug",
            "department",
            "location",
            "short_description",
            "employment_type",
            "apply_url",
            "sort_order",
        ]


class CareerApplicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerApplication
        fields = [
            "id",
            "role",
            "full_name",
            "email",
            "phone",
            "linkedin_url",
            "message",
            "resume",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_role(self, value):
        if not value.is_active:
            raise serializers.ValidationError("This role is no longer accepting applications.")
        return value

    def validate_resume(self, value):
        max_size = 5 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("Resume file size must be 5MB or less.")
        return value



class LandingPageImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandingPageImage
        fields = [ "image", "alt_text", "order", "is_active"]


class LandingPageContextSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandingPageContext
        fields = ["title","short_description","description", "btn_text", "btn_url", "download_file"]


class LandingPageTypeSerializer(serializers.ModelSerializer):
    contexts = LandingPageContextSerializer(many=True, read_only=True)
    images = LandingPageImageSerializer(many=True, read_only=True)

    class Meta:
        model = LandingPageType
        fields = [ "name", "order", "is_active", "contexts", "images"]


class BlogPostSerializer(serializers.ModelSerializer):
    featured_image_url = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = [
            "id",
            "title",
            "slug",
            "excerpt",
            "content_html",
            "featured_image_url",
            "images",
            "image_alt",
            "published_at",
            "is_published",
            "sort_order",
            "created_at",
            "updated_at",
        ]

    def get_featured_image_url(self, obj):
        if not obj.featured_image:
            return ""
        request = self.context.get("request")
        image_url = obj.featured_image.url
        if request is not None:
            return request.build_absolute_uri(image_url)
        return image_url

    def get_images(self, obj):
        request = self.context.get("request")
        serialized_images = []
        for image in obj.images.all():
            image_url = image.image.url
            if request is not None:
                image_url = request.build_absolute_uri(image_url)
            serialized_images.append(
                {
                    "id": image.id,
                    "image_url": image_url,
                    "alt_text": image.alt_text,
                    "order": image.order,
                    "show_in_gallery": image.show_in_gallery,
                }
            )
        return serialized_images
