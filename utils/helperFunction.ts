



const CouponCalulations =(total: number,couponVal: number | undefined,coponType:string| undefined)=>{

    if(coponType === 'fixed' && couponVal){
        const couponAmt = Math.min(total, Math.max(0, couponVal))
        const totalAmt = Math.round((total - couponAmt) * 100) / 100
        return {totalAmt,couponAmt}
    }else if(couponVal){
        const couponAmt = Math.min(total, Math.max(0, Math.round(total * couponVal) / 100))
        const totalAmt = Math.round((total - couponAmt) * 100) / 100
        return {totalAmt,couponAmt}
    }
}

export {CouponCalulations}
