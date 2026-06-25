from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Product, ProductDocument, ProductFaQ, ProductAssayDetail, ProductRelatedInfo, AssayPanelTargetDocument
from .serializers import ProductByCategorySerializer, ProductDetailSerializer, AssayProductSerializer, AssayPanelTargetDocumentSerializer
from rest_framework import viewsets
from rest_framework.decorators import api_view, action, permission_classes
from django.core.paginator import Paginator
from rest_framework.permissions import AllowAny
from category.models import Category
from prd_variant.models import ProductSKU, ProductVariantOption
from django.db.models import Prefetch
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django.http import QueryDict
import logging
from home.models import Search
from datetime import date
from api.views import get_or_none
import re
from order.models import OrderItem
from django.db.models import Max
from django.db.models import F
import zipfile
import xml.etree.ElementTree as ET
from .target_documents import extract_xlsx_rows, get_file_extension


from django.core.cache import cache
from django.db.models import F, Prefetch

PRODUCT_CACHE_TTL = 60 * 15  # 15 minutes

def get_product_cache_key(slug):
    return f"product_detail:{slug}"

CATEGORY_PRODUCTS_CACHE_TTL = 60 * 15
def get_category_cache_key(slug):
    return f"category_products:{slug}"


SUB_CATEGORY_CACHE_TTL = 60 * 15
def get_sub_category_cache_key(category_slug, sub_category_slug, order_param, page=1):
    """
    Unique key per slug + order + page combination.
    Example: subcategory_products:bio:proteins:asc:1
    """
    return f"subcategory_products:{category_slug}:{sub_category_slug}:{order_param or 'asc'}:{page}"

logger = logging.getLogger(__name__)


def _product_serializer_context(request):
    user_id = request.user.id if getattr(request.user, "is_authenticated", False) else None
    return {"request": request, "user_id": user_id}


def _category_slug_match_q(slug):
    return Q(categories__slug=slug) | Q(categories__parent__slug=slug)

class StandardPagination(PageNumberPagination):
    page_size = 8
    page_size_query_param = 'page_size'
    max_page_size = 100


    def get_paginated_response(self, data):

        if isinstance(data, dict) and 'view' in data and  data['view'] == 'product_by_subcategory':
            # If the data is already in the desired format, return it directly
            return Response({
                "status":"success",
                "message":"Data Fetch successfully",
                "result":{
                    "data": data.get('serializer', []),
                    'category': data.get('category', {}),
                    'subCategory': data.get('subCategory', {}),
                    "count": self.page.paginator.count,
                    "total_pages": self.page.paginator.num_pages,
                    "current_page": self.page.number,
                    "next": self.get_next_link(),
                    "previous": self.get_previous_link(),
                } 
            },status=status.HTTP_200_OK)

        return Response({
            "status":"success",
            "message":"Data Fetch successfully",
            "result":{
                "data": data,
                "count": self.page.paginator.count,
                "total_pages": self.page.paginator.num_pages,
                "current_page": self.page.number,
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
            } 
        },status=status.HTTP_200_OK)


class ProductViewset(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductByCategorySerializer
    pagination_class = StandardPagination

    def list(self, request, *args, **kwargs):
        products = Product.objects.filter(is_active=True).prefetch_related('categories__parent').order_by("name")
        serializer = ProductByCategorySerializer(products,many=True,context=_product_serializer_context(request))
        return Response({
            "status": "success",
            "total": len(serializer.data),
            "items": serializer.data
        }, status=status.HTTP_200_OK)

    # OLD CODE — chatbot used the list() endpoint above which returned full product data
    # (images, variants, SKUs, prices) for ALL products — very slow, caused 2.2s timeout to fire
    # before Django could respond, so product lookup always failed and AI gave text description instead.

    # NEW CODE — lightweight endpoint returns only id, name, slug, category slugs needed for matching
    @action(detail=False, methods=['GET'], permission_classes=[AllowAny], url_path='chat-lookup')
    def ChatLookupView(self, request, *args, **kwargs):
        search = (request.query_params.get('search') or '').strip()
        qs = Product.objects.filter(is_active=True).prefetch_related('categories__parent').order_by('name')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(slug__icontains=search))
        items = []
        for p in qs[:300]:
            child = p.categories.filter(parent__isnull=False, is_active=True).first()
            items.append({
                'id': p.id,
                'name': p.name,
                'slug': p.slug,
                'parent_category_slug': child.parent.slug if child and child.parent else None,
                'sub_category_slug': child.slug if child else None,
            })
        return Response({'status': 'success', 'items': items}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['GET'], permission_classes=[AllowAny], url_path='get-assay-products')
    def GetAssayProductsView(self, request, *args, **kwargs):
        assay_type = (request.query_params.get('assay_type') or '').strip()
        category_slug = (request.query_params.get('category_slug') or '').strip()
        category_slugs = [
            slug.strip()
            for slug in (request.query_params.get('category_slugs') or '').split(',')
            if slug.strip()
        ]
        valid_assay_types = {choice[0] for choice in ProductAssayDetail.ASSAY_TYPE_CHOICES}

        if assay_type not in valid_assay_types:
            return Response(
                {"status": "error", "message": "Valid assay_type is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        product_filter = Q(assay_detail__assay_type=assay_type, assay_detail__is_active=True)
        category_filter = Q()
        if category_slug:
            category_filter |= _category_slug_match_q(category_slug)
        for slug in category_slugs:
            category_filter |= _category_slug_match_q(slug)
        if category_filter:
            product_filter |= category_filter

        products = (
            Product.objects
            .filter(product_filter, is_active=True)
            .select_related('assay_detail')
            .prefetch_related(
                'images',
                Prefetch(
                    'documents',
                    queryset=ProductDocument.objects.filter(is_active=True).select_related('section', 'sku').order_by('section__sort_order', 'sort_order', 'id'),
                    to_attr='active_documents',
                ),
            )
            .distinct()
            .order_by('name')
        )

        page = self.paginate_queryset(products)
        if page is not None:
            serializer = AssayProductSerializer(page, many=True, context=_product_serializer_context(request))
            response = self.get_paginated_response(serializer.data)
            documents = AssayPanelTargetDocument.objects.filter(
                panel_type__in=['all', assay_type],
                is_active=True,
            ).order_by('panel_type', 'document_type', 'sort_order', 'id')
            response.data['result']['panel_documents'] = AssayPanelTargetDocumentSerializer(
                documents,
                many=True,
                context=_product_serializer_context(request),
            ).data
            return response

        serializer = AssayProductSerializer(products, many=True, context=_product_serializer_context(request))
        documents = AssayPanelTargetDocument.objects.filter(
            panel_type__in=['all', assay_type],
            is_active=True,
        ).order_by('panel_type', 'document_type', 'sort_order', 'id')
        return Response({
            "status": "success",
            "message": "Data Fetch successfully",
            "result": {
                "data": serializer.data,
                "panel_documents": AssayPanelTargetDocumentSerializer(
                    documents,
                    many=True,
                    context=_product_serializer_context(request),
                ).data,
            },
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['GET'], permission_classes=[AllowAny], url_path='preview-target-document')
    def PreviewTargetDocumentView(self, request, *args, **kwargs):
        source = (request.query_params.get('source') or 'product').strip().lower()
        document_id = request.query_params.get('id')

        if not document_id:
            return Response(
                {"status": "error", "message": "Document id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        model = AssayPanelTargetDocument if source == 'panel' else ProductDocument
        document = model.objects.filter(pk=document_id, is_active=True).first()
        if not document:
            return Response(
                {"status": "error", "message": "Target document not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        file_field = document.file
        extension = get_file_extension(file_field.name) if file_field else ''
        file_url = request.build_absolute_uri(file_field.url) if file_field else None

        result = {
            "id": document.id,
            "source": source,
            "title": document.title,
            "file_url": file_url,
            "file_extension": extension,
            "preview_supported": extension == "xlsx",
            "target_count": getattr(document, "target_count", 0),
            "columns": [],
            "rows": [],
            "sheet_name": "",
            "truncated": False,
        }

        if extension != "xlsx":
            result["message"] = "Preview is currently available for .xlsx target lists. Open the uploaded file to view this document."
            return Response(
                {"status": "success", "message": "Preview metadata loaded.", "result": result},
                status=status.HTTP_200_OK,
            )

        try:
            result.update(extract_xlsx_rows(file_field, max_rows=200, max_columns=30))
        except (KeyError, zipfile.BadZipFile, ET.ParseError):
            logger.exception("Failed to preview target document %s:%s", source, document_id)
            result["preview_supported"] = False
            result["message"] = "This Excel file could not be previewed. Please open the uploaded file directly."

        return Response(
            {"status": "success", "message": "Preview loaded successfully.", "result": result},
            status=status.HTTP_200_OK,
        )

    @action(detail=False,methods=['GET'],permission_classes=[AllowAny], url_path='get-products-by-category')
    def GetProductByCategoryView(self, request, *args, **kwargs):
        category_slug = request.query_params['category_slug']
        try:
            cache_key = get_category_cache_key(category_slug)
            cached_data = cache.get(cache_key)
            if cached_data:
                return Response({
                    "status": "success",
                    "message": "Data Fetch successfully",
                    "result": cached_data
                }, status=200)
            
            categoryExist = Category.objects.get(slug= category_slug,is_active=True)
            if not categoryExist:
                return Response({"status":"error","message": "Data Not Found",}, status=404)

            if categoryExist.display_type == "product_card":
                subcategories = Category.objects.filter(parent=categoryExist,is_active=True)
                
                result = []
                for sub in subcategories:
                    products_qs = Product.objects.filter(
                        categories__id=sub.id,
                        is_active=True
                    ).prefetch_related(
                    Prefetch(
                        'variant_options',
                        queryset=ProductVariantOption.objects.filter(variant_option__variant__is_active=True,variant_option__is_active=True).select_related(
                            'variant_option__variant'  # single query with JOIN
                        )
                    ),               
                    Prefetch(                          
                        'skus',
                        queryset=ProductSKU.objects.filter(is_active=True).prefetch_related('sku_options'),
                        to_attr='active_skus'
                    ))

                    total_count = products_qs.count()
                    limited_products = products_qs[:8]        
                    productserializer = ProductByCategorySerializer(
                        limited_products,
                        many=True,
                        context=_product_serializer_context(request),
                    ).data

                    result.append({
                        "name": sub.name,
                        "display_type":sub.display_type,
                        "slug": sub.slug,
                        "product_count": total_count,         
                        "products": productserializer,                
                    })


                response_data={
                    "data":result,
                    "category":{
                        "display_type":categoryExist.display_type,
                        "name":categoryExist.name,
                        "slug":categoryExist.slug
                    }
                }
                cache.set(cache_key, response_data, CATEGORY_PRODUCTS_CACHE_TTL)

                return Response({"status":"success",
                                "message":"Data Fetch successfully",
                                "result":response_data},status=200)
            
            
        except Category.DoesNotExist as e:
            return Response({"status":"error","message": "Data Not Found"}, status=404)
        
    

    @action(detail=False,methods=['GET'],permission_classes=[AllowAny], url_path='get-products-by-sub-category')
    def GetProductBySubCategoryView(self, request, *args, **kwargs):
        category_slug = request.query_params.get('category_slug')
        sub_category_slug = request.query_params.get('sub_category_slug')
        res: QueryDict = request.query_params
        order_param = (res.get("orderBy") or "").strip()
        orderBy = "name"
        page_number = request.query_params.get("page", 1)



        try:
            if not category_slug or not sub_category_slug:
                return Response({"status": "error", "message": "category_slug and sub_category_slug are required"}, status=400)
            
            cache_key   = get_sub_category_cache_key(category_slug, sub_category_slug, order_param, page_number)
            cached_data = cache.get(cache_key)

            
            if cached_data:
                return Response(cached_data, status=200)
            
            categoryExist = Category.objects.get(slug= category_slug,is_active=True)
            if not categoryExist:
                return Response({"status":"error","message": "Data Not Found",}, status=404)
            
            subCatExist = Category.objects.get(slug=sub_category_slug,is_active=True)
            if not subCatExist:
                return Response({"status":"error","message": "Data Not Found",}, status=404)
            

            result = []
            if subCatExist.display_type == "product_card":

                if order_param == "desc":
                    orderBy = "-name"
                elif order_param == "asc":
                    orderBy = "name"
                elif order_param == "rating":
                    orderBy = "-created_at"

                products = Product.objects.filter(categories__id=subCatExist.id, is_active=True).prefetch_related(
                    Prefetch(
                        'variant_options',
                        queryset=ProductVariantOption.objects.filter(variant_option__variant__is_active=True,variant_option__is_active=True).select_related(
                            'variant_option__variant'  # single query with JOIN
                        )
                    ),               
                    Prefetch(                          
                        'skus',
                        queryset=ProductSKU.objects.filter(is_active=True).prefetch_related('sku_options'),
                        to_attr='active_skus'
                    )).order_by(orderBy)

                page = self.paginate_queryset(products)
                if page is not None:
                    serializer = ProductByCategorySerializer(page, many=True,context=_product_serializer_context(request))
                    data ={
                        'view': 'product_by_subcategory',
                        'serializer': serializer.data,
                         "category":{
                            "name":categoryExist.name,
                            "slug":categoryExist.slug
                            },
                        "subCategory":{
                            "display_type":subCatExist.display_type,
                            "name":subCatExist.name,
                            "slug":subCatExist.slug
                            }
                    }
                    paginated_response = self.get_paginated_response(data) 
                    cache.set(cache_key,paginated_response.data , SUB_CATEGORY_CACHE_TTL)
                    return  paginated_response
                
                result = ProductByCategorySerializer(products, many=True, context=_product_serializer_context(request)).data
            
            elif subCatExist.display_type == "multi_level_cat":
                children = list(subCatExist.children.filter(is_active=True).order_by("sort_order", "name"))
                result = []
                for child in children:
                    products = list(Product.objects.filter(categories__id=child.id, is_active=True).distinct().order_by("name").values("id", "name", "slug", "trademark"))
                    result.append(
                        {
                            "id": child.id,
                            "name": child.name,
                            "slug": child.slug,
                            "products": products,
                        }
                    )

            serialized_data = {
                "data": result,
                "category": {
                    "name": categoryExist.name,
                    "slug": categoryExist.slug
                },
                "subCategory": {
                    "display_type": subCatExist.display_type,
                    "name": subCatExist.name,
                    "slug": subCatExist.slug
                }
            }

            response_data={"status": "success",
                             "message": "Data Fetch successfully",
                             "result":serialized_data}
            cache.set(cache_key, response_data, SUB_CATEGORY_CACHE_TTL)       
            return Response(response_data, status=200)

        except Exception as e:
            logger.exception("Failed to fetch products by sub-category %s/%s", category_slug, sub_category_slug)
            return Response({"status": "error", "message": "Data Not Found"}, status=400)
        

    
    @action(detail=False,methods=['GET'],permission_classes=[AllowAny], url_path='get-products-by-sub-category-loaderView')
    def GetProductBySubCategoryViewLoader(self, request, *args, **kwargs):
        category_slug = request.query_params.get('category_slug')
        sub_category_slug = request.query_params.get('sub_category_slug')
        res: QueryDict = request.query_params
        order_param = (res.get("orderBy") or "").strip()
        orderBy = "name"
        page_number = request.query_params.get("page", 1)


        try:
            if not category_slug or not sub_category_slug:
                return Response({"status": "error", "message": "category_slug and sub_category_slug are required"}, status=400)
            
            cache_key   = get_sub_category_cache_key(category_slug, sub_category_slug, order_param, page_number)
            cached_data = cache.get(cache_key)
            print("============",cached_data,cache_key)

            subCatExist = Category.objects.get(slug=sub_category_slug,is_active=True)
            if not subCatExist:
                return Response({"status":"error","message": "Data Not Found",}, status=404)
            
            if cached_data:
                if subCatExist.display_type == "product_card":
                    return  self.get_paginated_response(cached_data)

                return Response({
                    "status": "success",
                    "message": "Data Fetch successfully",
                    "result": cached_data
                }, status=200)
            
            categoryExist = Category.objects.get(slug= category_slug,is_active=True)
            if not categoryExist:
                return Response({"status":"error","message": "Data Not Found",}, status=404)
            

            result = []
            if subCatExist.display_type == "product_card":

                if order_param == "desc":
                    orderBy = "-name"
                elif order_param == "asc":
                    orderBy = "name"
                elif order_param == "rating":
                    orderBy = "-created_at"

                products = Product.objects.filter(categories__id=subCatExist.id, is_active=True).prefetch_related(
                    Prefetch(
                        'variant_options',
                        queryset=ProductVariantOption.objects.filter(variant_option__variant__is_active=True,variant_option__is_active=True).select_related(
                            'variant_option__variant'  # single query with JOIN
                        )
                    ),               
                    Prefetch(                          
                        'skus',
                        queryset=ProductSKU.objects.filter(is_active=True).prefetch_related('sku_options'),
                        to_attr='active_skus'
                    )).order_by(orderBy)

                page = self.paginate_queryset(products)
                if page is not None:
                    serializer = ProductByCategorySerializer(page, many=True,context=_product_serializer_context(request))
                    data ={
                        'view': 'product_by_subcategory',
                        'serializer': serializer.data,
                         "category":{
                            "name":categoryExist.name,
                            "slug":categoryExist.slug
                            },
                        "subCategory":{
                            "display_type":subCatExist.display_type,
                            "name":subCatExist.name,
                            "slug":subCatExist.slug
                            }
                    }
                    cache.set(cache_key, data, SUB_CATEGORY_CACHE_TTL)
                    return  self.get_paginated_response(data)
                
                result = ProductByCategorySerializer(products, many=True, context=_product_serializer_context(request)).data
            
            elif subCatExist.display_type == "multi_level_cat":
                children = list(categoryExist.children.filter(is_active=True).order_by("sort_order", "name"))
                result = []
                for child in children:
                    products = list(Product.objects.filter(categories__id=child.id, is_active=True).distinct().order_by("name").values("id", "name", "slug", "trademark"))
                    result.append(
                        {
                            "id": child.id,
                            "name": child.name,
                            "slug": child.slug,
                            "products": products,
                        }
                    )

            response_data = {
                                 "data": result,
                                 "category": {
                                     "name": categoryExist.name,
                                     "slug": categoryExist.slug
                                 },
                                 "subCategory": {
                                     "display_type": subCatExist.display_type,
                                     "name": subCatExist.name,
                                     "slug": subCatExist.slug
                                 }
            }


            cache.set(cache_key, response_data, SUB_CATEGORY_CACHE_TTL)
            return Response({"status": "success",
                             "message": "Data Fetch successfully",
                             "result": response_data
                             }, status=200)

        except Exception as e:
            logger.exception("Failed to fetch products by sub-category %s/%s", category_slug, sub_category_slug)
            return Response({"status": "error", "message": "Data Not Found"}, status=400)
        


    @action(detail=False,methods=['GET'],permission_classes=[AllowAny], url_path='search')
    def ProductSearch(self, request, *args, **kwargs):
        search_text = request.query_params.get('search_text', '').strip()
        category = request.query_params.get('category', '').strip()
        products = Product.objects.filter(is_active=True)
        if category:
            products = products.filter(Q(categories__name__icontains=category) | Q(categories__slug__icontains=category)).distinct()

        if search_text:
            today = date.today()
            cleaned_text = re.sub(r'[^a-zA-Z0-9]', '',search_text)
            cleaned_text= cleaned_text.lower()
            searchObj=get_or_none(Search,value=cleaned_text)
            if searchObj:
                searchObj.count = searchObj.count + 1
                searchObj.save()
            elif not searchObj:
                searchVal = Search.objects.create(name=search_text,value=cleaned_text,date=today,count=1)
                searchVal.save()

            target_document_filter = Q(documents__is_active=True) & (
                Q(documents__title__icontains=search_text)
                | Q(documents__target_search_text__icontains=search_text)
                | Q(documents__extracted_target_text__icontains=search_text)
            )
            products = products.filter(
                Q(name__icontains=search_text)
                | Q(slug__icontains=search_text)
                | Q(short_description__icontains=search_text)
                | Q(assay_detail__catalog_number__icontains=search_text)
                | target_document_filter
            ).distinct()

            if not products.exists():
                recommended_products = Product.objects.filter(is_active=True).order_by("-views_count")[:10]
                serializer = ProductByCategorySerializer(
                    recommended_products,
                    many=True,
                    context=_product_serializer_context(request),
                ).data
                return Response({"status": "success","message": "Data Fetch successfully",'result': {"data":{"serializer":serializer,"search_result": False}}})

            page = self.paginate_queryset(products)
            if page is not None:
                serializer = ProductByCategorySerializer(page, many=True,context=_product_serializer_context(request))
                data ={
                    'serializer': serializer.data,
                    "search_result": True
                }
                return  self.get_paginated_response(data)
        prdSerializer = ProductByCategorySerializer(products, many=True, context=_product_serializer_context(request)).data
        return Response({"status": "success","message": "Data Fetch successfully",'result': {"data":prdSerializer}})

    




@api_view(["GET"])
@permission_classes([AllowAny])
def GetAllProductSlugs(request):
    products = (
        Product.objects
        .filter(is_active=True)
        .prefetch_related(
            Prefetch(
                'categories',
                queryset=Category.objects.filter(parent__isnull=False, is_active=True).select_related('parent'),
                to_attr='sub_cats'
            )
        )
    )
    result = []
    for p in products:
        sub_cat = p.sub_cats[0] if p.sub_cats else None
        result.append({
            'slug': p.slug,
            'category': sub_cat.parent.slug if sub_cat and sub_cat.parent else None,
            'sub_category': sub_cat.slug if sub_cat else None,
        })
    return Response(result)


@api_view(["GET"])
@permission_classes([AllowAny])
def GetProductDetialData(request):

    product_slug = request.query_params.get('slug')
    if not product_slug:
        return Response({"status": "error", "message": "slug is required"},status=400)
    try:
        cache_key = get_product_cache_key(product_slug)
        cached_data = cache.get(cache_key)
        Product.objects.filter(slug=product_slug,is_active=True).update(views_count=F('views_count') + 1)
        if cached_data is None:
            productDetail = Product.objects.filter(slug=product_slug,is_active=True).prefetch_related(
                'categories__parent',
                'images',
                'faq',  
                Prefetch(
                    'variant_options',
                    queryset=ProductVariantOption.objects.filter(variant_option__variant__is_active=True,variant_option__is_active=True).select_related(
                        'variant_option__variant'  # single query with JOIN
                    )
                ),               
                Prefetch(                          
                    'skus',
                    queryset=ProductSKU.objects.filter(is_active=True).prefetch_related('sku_options'),
                    to_attr='active_skus'
                ),
                Prefetch(
                    'documents',
                    queryset=ProductDocument.objects.filter(is_active=True).select_related('section', 'sku').order_by('section', 'sort_order', 'id'),
                    to_attr='active_documents'
                ),
            ).first()
            productserializer = ProductDetailSerializer(productDetail,context=_product_serializer_context(request))
            cache.set(cache_key, productserializer.data, PRODUCT_CACHE_TTL)
            cached_data = productserializer.data

        return Response({"status":"success", "message":"Data Fetch successfully", "result":{ "data":cached_data }},status=200)
    except Product.DoesNotExist as e:
        return Response({"status":"error","message": "Data Not Found"}, status=404)
    




