"use client"
import { useMemo } from 'react';
import ProductImages from './ProductImages';
import ProductDetails from './ProductDetails';
import ProductCarousel from './ProductCarousel';
import ProductTabs from './ProductTabs';


export default  function ProductDetailPage({prd_details}:{prd_details:any}){



    console.log("prd_details", prd_details)
    return(<>

    <div className="min-h-screen ">
        <main className="px-6 md:px-10 py-6  max-w-[1400px] mx-auto">
            <div  className='flex flex-col lg:flex-row  gap-10'>
        <ProductImages product_images = {prd_details?.prd_images}/>
        <ProductDetails prdData={prd_details} />
        </div>

        <ProductTabs prdData={prd_details} />





        </main>




        
    </div>
    </>)
}
