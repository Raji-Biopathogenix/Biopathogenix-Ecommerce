"use client"
import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export interface ActivationUserProps {
    resMsg:string
    resultData: {
        is_verified: boolean
        first_name: string
        last_name: string
        status : boolean
    }
}


export default function ActivationUser({resMsg,resultData}:ActivationUserProps){
    const router = useRouter();
    const { user } = useAuth();


    useEffect(()=>{
        if(resultData?.status){
            router.push('/')
        }
    },[resultData?.status])


    return(<>
        <p>{resMsg}</p>
        <p>Successfully Access Granted.</p>
        <Link href={`/`}> Home </Link>
    </>)
}