

export interface ButtonProps{
    customClass: string
    customStyle?: React.CSSProperties
    onClick?: () => void
    btnLable?: React.ReactNode  
    disabled?:boolean

}


export default function Button({customClass,customStyle,onClick,btnLable,disabled}:ButtonProps){


    const handleClick = (e: React.MouseEvent<HTMLButtonElement>)=>{
        console.log("Button Clicked")
        onClick?.()
    }


    return(<>
        <button disabled={disabled} className={customClass} style={customStyle} onClick={handleClick}> {btnLable} </button>
    </>)

}