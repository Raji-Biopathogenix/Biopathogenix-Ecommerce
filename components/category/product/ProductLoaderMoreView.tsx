'use client'
import { useEffect,useState,useRef } from "react";
import { CategoryData, SubCategoryData, Products } from "@/types/product";
import ProductGridView from "./ProductGridView";
import SelectField from "@/components/common/selectField";
import { usePathname, useParams, useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation";
import { productServices } from "@/services/productServices";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export interface ProductLoaderPageProps {
  category: CategoryData,
  subCategory: SubCategoryData,
  products: Products[],
  currentPage : number,
  totalPages : number,
  count   : number,
  next ?: string | null | undefined
}

export default function ProductLoaderMoreView({ category, next,subCategory, products,currentPage,totalPages,count }: ProductLoaderPageProps) {

  const pathname = usePathname()      
  const searchParams = useSearchParams()
  const {  setShowMainPageLoader  } = useAuth();
  const { setToastNotification } = useToast();

  const router = useRouter();
  const [nextLink,setnextLink]= useState<string | null | undefined>(next)
  const [prds,setPrds]= useState<Products[]>(products)

  useEffect(()=>{

    setPrds(products)

  },[products])


  useEffect(()=>{
    setnextLink(next)
  },[next])


  const handleChange =(value: string)=>{

    router.push(`${pathname}?orderby=${value}`)

  }

  const loadMore = async()=>{
    console.log("Load More Products")
    if(nextLink){
      setShowMainPageLoader(true)
      try {
        let response = await productServices.fetchProductBySubCat(nextLink)

        console.log("response",response)
        if (response.status === "success") {
        console.log("response inside",response)

          setPrds([...prds,...response?.result?.data])
          console.log([...prds,...response?.result?.data])
          setnextLink(response?.result?.next)
        }
      } catch (error:any) {
        setToastNotification({ type: "error", message:error?.message });
      }
      finally {
        setShowMainPageLoader(false)
      }
    }










  }



  const observerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextLink) {
          loadMore()
        }
      },
      { threshold: 1.0 }
    )

    if (observerRef.current) observer.observe(observerRef.current)

    return () => observer.disconnect()
  }, [nextLink])


  console.log("prds",prds)

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-800">
          SHOWING {prds.length} OF {count} RESULTS
        </h2>

        <div>
          <SelectField onChange={handleChange}  name={'orderby'} selectOptions={[{label:"Default sorting",value:"menu_order"},{label:"Sort by popularity",value:"popularity"},{label:"Sort by average rating",value:"rating"},{label:"Sort by latest",value:"date"},{label:"Sort by price: low to high",value:"asc"},{label:"Sort by price: high to low",value:"desc"}]} />
        </div>
      </div>
      <ProductGridView products={prds} />


      <div ref={observerRef} style={{ height: "1px" }} />



    </>
  );
}