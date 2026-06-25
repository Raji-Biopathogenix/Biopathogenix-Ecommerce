'use client'

import { useState } from "react"


export interface SelectOption {
  label: string;
  value: string | number;
}


export interface SelectFieldProps{
    labelName?: string
    labelClassName?: string
    customClass?: string
    show_select?:boolean
    selectOptions:SelectOption[]
    name ?: string
    selectCustomClass?: string
    onChange :(value:string)=> void

}


export default function SelectField({
    labelName,
    labelClassName,
    customClass,
    show_select=false,
    selectOptions = [],
    name,
    selectCustomClass,
    onChange

}:SelectFieldProps){


    const [value,setValue]=useState<string | number>('')


    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {

        setValue(e.target.value)
        onChange(e.target.value)
    };


    return(<>
    
        <div className={customClass}>
        {labelName && <label className={labelClassName} htmlFor={name}>{labelName}</label>}
            <select className={selectCustomClass} value={`${value}`} name={name} onChange={(e) => handleChange(e)}>
                {show_select && <option value="">Select</option>}
                {
                    selectOptions?.map((eachOption,idx) => (<option key={`${eachOption?.value}-${idx}`} value={eachOption?.value}>{eachOption?.label}</option>))
                }
            </select>
        </div>
    </>)
}