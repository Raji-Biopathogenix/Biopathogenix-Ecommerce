import { useEffect, useState } from "react"

export interface InputFieldProps{
    label?:string
    type:string
    onChange: (e: React.ChangeEvent<HTMLInputElement>,value:number,targetVal:string) => void
    name:string
    maxNumber?:number
    min?: string | number   
    max?: string | number   
    defaultVal?: string | number 
    customClass?:string
}
''
export default function InputField({label,type,onChange,defaultVal,name,min,max,customClass}:InputFieldProps){

    const [value,setValue]= useState<string | number >('')


    const handleChange =(e: React.ChangeEvent<HTMLInputElement>)=>{
        let val = Number(e.target.value);
        console.log("Input Field",e.target.value,"==>", Number(e.target.value))
        if(val || val === 0){
            if (min !== undefined && val < Number(min)) val = Number(min)
            if (max !== undefined && val > Number(max)) val = Number(max)
            if(val === 0){
                setValue('')
            }else{
                setValue(val)
            }
            onChange(e,val,e.target.value)
        }else{
            setValue('')
        }
    }

    useEffect(()=>{
        if(defaultVal){
            setValue(defaultVal)
        }
    },[defaultVal])

    return(<>


    <div className={`form-group `}>
       {label && <label>{label}</label>}
        <input
            type={type}
            value={value}
            id={name}
            name={name}
            onChange={handleChange}
            min={min}
            max={max}
            className={customClass}
        />
    </div>
    </>)
}