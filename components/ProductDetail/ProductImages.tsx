
import {useState,useEffect} from 'react';
import Image from 'next/image';
import {ArrowLeft,ArrowRight,ZoomIcon} from '@/components/app_icons/app_icons';
import ImageModal from '@/components/Modal/Product/ImageModal/ImageModal';


export interface ProductImages{
    is_primary:boolean
    image:string
    alt_text:string
}

export default function ProductImages({product_images}:{product_images:ProductImages[]}){

    const [activeImg, setActiveImg] = useState(0);
    const [fading, setFading] = useState(false);
    const [primaryImage, setPrimaryImage] = useState<string | null>(null);
    const [primaryImageAltText, setPrimaryImageAltText] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);




    const switchImage = (idx: number) => {
        if (idx === activeImg) return;
        setFading(true);
        setTimeout(() => { 
            setActiveImg(idx); 
            setPrimaryImage(product_images?.[idx]?.image)
            setPrimaryImageAltText(product_images?.[idx]?.alt_text)
            setFading(false); 
        }, 200);
    };

    const prev = () => switchImage(activeImg === 0 ? product_images.length - 1 : activeImg - 1);
    const next = () => switchImage(activeImg === product_images.length - 1 ? 0 : activeImg + 1);


    useEffect(()=>{
        let primary_img = product_images?.filter((item)=> item.is_primary == true)
        if(primary_img){
            setPrimaryImage(primary_img?.[0]?.image)
        }


        let active_img_index = product_images?.findIndex((item)=> item.is_primary == true)
        setActiveImg(active_img_index)

    },[product_images])

    



    return(<>
         <div className="lg:w-[50%]">
            <div className="flex items-center justify-between mb-3">
              <button
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                style={{ fontFamily: "sans-serif" }}
                onClick={() => setModalOpen(true)}
              >
                <span className="font-semibold tracking-widest uppercase text-xs">ZOOM</span>
                <ZoomIcon />
              </button>
              <div className="flex items-center gap-6">
                <button onClick={prev} className="text-[#1e3a5f] hover:text-[#1e6fb5] transition-colors p-1">
                  <ArrowLeft cls="w-6 h-6" />
                </button>
                <button onClick={next} className="text-[#1e3a5f] hover:text-[#1e6fb5] transition-colors p-1">
                  <ArrowRight cls="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className={`relative w-full bg-gray-50 rounded-sm border border-gray-100 flex items-center justify-center overflow-hidden`}
            >
            <div className="relative w-full aspect-[3/2] bg-white">
            <Image
                src={`${primaryImage}`}
                fill
                alt={`${primaryImageAltText}-primary-image`}
                unoptimized
                sizes="(max-width: 724px) 100vw, 50vw"
                className={`object-contain p-4 ${fading ? "opacity-0" : "opacity-100"}`}
                />
            </div>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-700 bg-white/80 rounded-full shadow-sm hover:shadow transition-all"
              >
                <ArrowLeft cls="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-700 bg-white/80 rounded-full shadow-sm hover:shadow transition-all"
              >
                <ArrowRight cls="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-3 mt-4">
              {product_images?.length > 0 &&  product_images.map((img, i) => (
                <button
                  key={i}
                  onMouseEnter={() => switchImage(i)}
                  onClick={() => switchImage(i)}
                  className={`w-20 h-20 rounded-sm border-2 overflow-hidden bg-gray-50 transition-all duration-150 flex-shrink-0 ${
                    activeImg === i
                      ? "border-[#1e6fb5]"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                 <Image
                    src={img?.image}
                    alt={`Thumbnail ${img?.alt_text}-img-${i}`}
                    width={80}
                    height={80}
                    unoptimized
                    loading="lazy"
                    className="object-contain"
                    />
                </button>
              ))}
            </div>
          </div>

          <ImageModal
            images={product_images??[]}
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            initialIndex={activeImg}
          />
    </>)
}
