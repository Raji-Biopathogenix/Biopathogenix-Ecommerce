



const CouponCalulations =(total: number,couponVal: number | undefined,coponType:string| undefined)=>{

    if(coponType === 'fixed' && couponVal){
        let couponAmt = couponVal
        let totalAmt = total - couponVal
        return {totalAmt,couponAmt}
    }else if(couponVal){
        let couponAmt = total * (couponVal/100)
        let totalAmt = total - couponAmt
        return {totalAmt,couponAmt}
    }
}

export {CouponCalulations}