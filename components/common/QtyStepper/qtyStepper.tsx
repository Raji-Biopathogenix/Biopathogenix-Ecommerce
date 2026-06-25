import { useRef } from "react"
import ButtonProps from '@/components/common/Button';
import InputField from "@/components/common/InputField";
import './qtyStepper.css';
import { CART_ERR_MSG,CART_STOCK_ERR_MSG } from "@/components/utils/AppConstancts";
import {useDebounce} from '@/components/utils/customHooks/debounceHook'

export interface QtyStepperProps{
    stock:number
    qty:number;
    setQty:React.Dispatch<React.SetStateAction<number>>;
    customClass?:string
    is_cart?:boolean
    handleQuantityChange?:(quantity: number|undefined)=> void
    setQtyErrorMsg:(msg : string | null)=>void
    Skuobj:boolean
}




export default function QtyStepper({stock,qty,setQty,customClass,handleQuantityChange, is_cart=false,setQtyErrorMsg,Skuobj}:QtyStepperProps){

    const latestQty = useRef<number>(qty)
    const isAtStockLimit = stock <= qty

    const debouncedQuantityChange = useDebounce(() => {
        console.log("latestQty.current",latestQty.current)
        if(stock >= latestQty.current){
            setQty(latestQty.current)
            if (is_cart && handleQuantityChange) {
                handleQuantityChange(latestQty.current)
            }
        }
    },2000)

    const showStockLimitError = () => {
        const msg = CART_STOCK_ERR_MSG.replace("StockVal", `${stock}`);
        setQtyErrorMsg(msg);
        setTimeout(() => setQtyErrorMsg(null), 3000);
    }
    

    const handleStock=(type:string)=>{
        if(!Skuobj){
            setQtyErrorMsg(CART_ERR_MSG)
            setTimeout(() => setQtyErrorMsg(null),3000)
            return
        }

        if(type =="inc"){
            if (stock <= qty) {
                showStockLimitError()
                return
            }
            setQtyErrorMsg(null)
            setQty(qty + 1) 
            if(is_cart && handleQuantityChange){
                latestQty.current = qty + 1
                debouncedQuantityChange(qty + 1)
            }
        }else{
            if(qty > 1 ){
                setQtyErrorMsg(null)
                setQty(qty - 1)
                if(is_cart && handleQuantityChange){
                    latestQty.current = qty - 1
                    debouncedQuantityChange(qty - 1)
                }
            }
        }
    }

    const handleQtyChange=(event:  React.ChangeEvent<HTMLInputElement>,value:number,targetVal:string )=>{
        latestQty.current = Number(targetVal) 
        if(!Skuobj){
            setQtyErrorMsg(CART_ERR_MSG)
            setTimeout(() => setQtyErrorMsg(null),3000)
            return;
        }else if(Number(targetVal) > stock){
            const val = CART_STOCK_ERR_MSG.replace("StockVal", `${stock}`); 
            setQtyErrorMsg(val)
            setQty(stock)
            setTimeout(() =>{
                setQtyErrorMsg(null)
                if (is_cart && handleQuantityChange) {
                    handleQuantityChange(stock)
                 }
                },3000)
            return;
        }
        setQtyErrorMsg(null)
        setTimeout(() => debouncedQuantityChange(value) ,3000)
    }


    console.log("qty",qty)




    return(<>   
    <div className={`flex items-center border border-gray-300 rounded overflow-hidden ${customClass}`} style={{ fontFamily: "sans-serif" }}>
     

        <ButtonProps  disabled={qty == 1} customClass={`w-10 h-11 flex items-center justify-center ${qty==1 ? ' bg-gray-100 ': ' text-gray-500 hover:bg-gray-100  ' } cursor-pointer transition-colors text-lg font-light border-r border-gray-300`} btnLable ={"-"} onClick={() => handleStock('dec') } />

        {/* <span className="w-12 text-center text-gray-800 font-medium text-sm">{qty}</span> */}
        <InputField  name={'qty'} defaultVal={qty} customClass={" h-11 quantity-input"} type={'number'} onChange={handleQtyChange} min={0} max={stock} />

        <ButtonProps customClass={`w-10 h-11 flex items-center justify-center ${isAtStockLimit ? ' bg-gray-100 text-gray-400 ' : ' text-gray-500 hover:bg-gray-100 ' }  cursor-pointer transition-colors text-lg font-light border-l border-gray-300`} btnLable ={"+"} onClick={() =>  handleStock('inc') }/>

    </div>
    </>)
} 


