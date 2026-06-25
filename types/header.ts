export interface headerSubCategoryitem{
    name: string 
    slug: string
    image: string
}




export interface HeaderCategoryItem{
    name: string 
    slug: string
    sub_categories: headerSubCategoryitem[]
}



export interface HeaderItem{
    hide_menu_items:boolean
    id:number
    navigation_flag:boolean
    title:string
    type:string
    category :HeaderCategoryItem
}



export interface SearchCategoryItem{
   name: string 
   slug: string 
   product_count: number
   image: string
   id:number
}


export interface TopSearchItem{
    name: string
}


export interface HeaderMenus{

    status: string
    message: string
    result :{
        data: HeaderItem[]
        search_categories: SearchCategoryItem[]
        top_searchs: TopSearchItem[]
    }
}


export interface LandingPageContext{
    "id":number
    "title": string
    "short_description": string
    "description": string
    "btn_text": string
    "btn_url":string
    "download_file": string
}



export interface LandingPageImages{
    "id":number
    "image":string
    "alt_text":string 
    "order":number 
    "is_active":boolean
}


export interface LandingPageType{
    "id":number ,
    "name": string,
    "order": number, 
    "is_active":boolean,
    "contexts": LandingPageContext[],
    "images": LandingPageImages[]

}


export interface LandingPageResponse{
    status: string
    message: string
    result :{data: LandingPageType[]}
}
