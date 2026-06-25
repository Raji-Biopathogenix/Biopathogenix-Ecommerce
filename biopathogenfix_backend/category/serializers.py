from rest_framework import serializers
from .models import Category

class CategoryListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']





class HeaderSubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('name', 'slug','image')  


class HeaderCategorySerializer(serializers.ModelSerializer):
    sub_categories =  serializers.SerializerMethodField() 

    class Meta:
        model = Category
        fields = ( 'name', 'slug', 'sub_categories')

    def get_sub_categories(self, obj):
        active_sub_categories = obj.children.filter(is_active=True).order_by('sort_order')
        return HeaderSubCategorySerializer(
            active_sub_categories,
            many=True,
            context=self.context 
        ).data


class SearchCategoryHeaderSerializer(serializers.ModelSerializer):
    # product_count = serializers.SerializerMethodField()    
    product_count = serializers.IntegerField(read_only=True)
    parent = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'parent', 'product_count','image']

    def get_parent(self, obj):
        if obj.parent:
            return {'slug': obj.parent.slug}
        return None

    # def get_product_count(self, obj):
    #     return getattr(obj, 'product_count', 0)  # fallback to 0 if not annotated