export interface ProductsByCategoryResponse {
    status:string
    message: string
    result : any
}


export type Products = {
  id: number;
  name: string;
  image: string;
  price: number;
  compare_price?: number | string | null;
  discount_value?: number | string | null;
  slug:string;
  parent_category_slug?: string;
  sub_category_slug?: string;
  requires_login_to_view_price?: boolean;
  originalPrice: number;
  category: string;
  has_variants?: boolean;
  is_customizable?: boolean;
  prd_customization_prices?: {
    price?: number | string;
  } | null;
  prd_skus?: ProductSkus[];
  prd_variants?: Variant[] | undefined;
  hover_image?: { image?: string; alt_text?: string };
  primary_image:{
    image:string;
    alt_text?: string;
  };
  title: string;
  trademark?: {
    display?: boolean;
    postion?: "pre" | "post";
    text?: string;
    trademark?: string;
  };
};



export interface ProductTrademark {
  display: boolean;
  postion: 'pre' | 'post';
  text: string;
  trademark: 'TM' | 'R' | 'SM';
}

export interface MultiLevelProduct{
  id: number;
  name: string;
  slug: string;
  trademark?: ProductTrademark;
}

export interface MultiLevelCatgoryResponse{
  id: number;
  name: string;
  slug: string;
  products: MultiLevelProduct[];

}


export interface CategoryData{
  display_type: string
  name: string
  slug: string  
}
export interface SubCategoryData{
  display_type: string
  name: string
  slug: string  
  url?: string
}


export interface ProductResponse{
  name: string,
  display_type:string,
  slug: string,
  product_count: number,         
  products: Products[],  
}

export interface DefaultCards{
  name: string,
  slug: string, 

}

export interface ProductCardResponse {
  category: CategoryData & { display_type: "product_card" }
  data: ProductResponse[]
}

export interface DefaultCardResponse {
  category: CategoryData & { display_type: "default_card" }
  data: DefaultCards[]
}

export type CategoryResponse = ProductCardResponse | DefaultCardResponse






export interface SubCategoryProductCardResponse {
  category: CategoryData 
  subCategory: SubCategoryData  & { display_type: "product_card" }
  next ?: string | null
  previous ?: string | null
  count : number
  total_pages : number
  current_page : number
  data: Products[]
}

export interface SubCategoryMultiLevelCardResponse {
  category: CategoryData 
  subCategory: SubCategoryData & { display_type: "multi_level_cat" }
  data: MultiLevelCatgoryResponse[]
}

export type SubCategoryResponse = SubCategoryProductCardResponse | SubCategoryMultiLevelCardResponse




export interface ProductsBySubCategoryResponse {
    status:string
    message: string
    result : any
}



export interface ProductDetailResponse{
  status : string
  message : string
  result : any
  
}


export interface VariantOption{
    id: number
    value : string 
    selected:boolean
    order:number
    variant_option_id?: number
}

export interface Variant{
  id: number
  name : string
  order :number
  variant_options : VariantOption[]
}


export interface SkuVariantOption{
  variant_option_name : string
  variant_option_id : number
}


export interface ProductSkus{

  id: number,
  sku_code : string,
  price : number,
  stock : number,
  low_stock_threshold : number,
  sku_options : SkuVariantOption[]

}




export interface ProductImages{
    is_primary:boolean
    image:string
    alt_text:string
}



export interface ProductSearchResponse {
    status:string
    message: string
    result : {
      next ?: string | null
      previous ?: string | null
      count ?: number
      total_pages ?: number
      current_page ?: number
      data:{"serializer":Products[],"search_result": boolean} 
    }
}
