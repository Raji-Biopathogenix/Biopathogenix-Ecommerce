"use client";
import { useEffect,useState,useRef } from "react";
import {SearchModal} from '@/components/Modal/search/searchModalComp';
import Link from "next/link";
import { usePathname } from "next/navigation"
import CartModal from "@/components/Modal/Cart/CartModal";
import {useAuth} from "@/context/AuthContext";
import  {ShoppingCartIcon,ProfileIcon,SearchIcon} from '@/components/app_icons/app_icons'; 
import "./header-icons.css";
import {SearchCategoryItem,TopSearchItem} from "@/types/header"

interface HeaderIconsProps{
search_categories:SearchCategoryItem[]
top_searchs:TopSearchItem[]
}


export default function HeaderIcons({search_categories,top_searchs}:HeaderIconsProps) {
  const { reducerState ,dispatch } = useAuth()
  const pathname = usePathname()  

  const [searchModalOpen,setSearchModalOpen]= useState(false)
  

  const handleCartModal=() =>{
    if(!['/cart','/checkout'].includes(pathname)){
      dispatch({ type: "CART_MODAL", payload: !reducerState.cartModalOpenFlag });
    }
  }

  const handleSearchModal = ()=>{
    setSearchModalOpen(!searchModalOpen)
  }


  return (
    <div className="flex items-center gap-4 md:gap-7">

      {/* SEARCH — hidden on mobile */}
      <button
        aria-label="Search"
        className="header-icon-btn hidden md:flex"
        onClick={handleSearchModal}
      >
        <SearchIcon />
      </button>

      {/* ACCOUNT */}
      <Link
        href="/my-account"
        aria-label="Account"
        className="header-icon-btn"
      >
        <ProfileIcon />
      </Link>

      {/* CART */}
      <button
        aria-label="Cart"
        className="relative header-icon-btn"
        onClick={() => handleCartModal()}
      >
        <ShoppingCartIcon />
        {/* CART BADGE */}
        {reducerState.cartItemsCount > 0 && <span className="header-cart-badge">{reducerState.cartItemsCount}</span>}
      </button>

      <CartModal
        open={reducerState.cartModalOpenFlag}
        cartCount={reducerState.cartItemsCount}
        onClose={() => handleCartModal()}
        onCartCountChange={()=>{}}
      />

      <SearchModal 
      open={searchModalOpen}
      onClose={handleSearchModal}
      search_categories={search_categories}
      top_searchs={top_searchs}
      />

    </div>
  );
}
