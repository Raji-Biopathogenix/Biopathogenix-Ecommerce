"use client"

import React,{ useState }  from "react";
import Container from "@/components/layout/Container";
import Logo from "./Logo";
import NavItem from "./NavbarMenus";
import HeaderIcons from "./HeaderIcons";
import "./header.css";
import { usePathname } from 'next/navigation';

import {useAuth} from "@/context/AuthContext";
// import SearchBar from "./SearchBar";
import {HeaderItem,SearchCategoryItem, TopSearchItem} from "@/types/header"

import  MobileMenu from './mobileopen'

interface HeaderSectionProps{
  menus : HeaderItem[]
  search_categories:SearchCategoryItem[] 
  top_searchs: TopSearchItem[]
}

const AdminMenus= [{
    "id": 100,
    "category": {
        "name": "Admin",
        "slug": "admin",
        "sub_categories": [
            {
                "name": "Orders",
                "slug": "/orders",
                "image": ''
            }
        ]
    },
    "title": "",
    "type": "admin_menu",
    "hide_menu_items": false,
    "navigation_flag": false
}]


function HeaderSection({ menus,search_categories,top_searchs }: HeaderSectionProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSuperAdmin } = useAuth()

  console.log("menu",menus)
  const pathname = usePathname();

  const HIDE_HEADER_ROUTES = [
  '/print',
  ];

  const hideHeader = HIDE_HEADER_ROUTES.some(route =>
  pathname.includes(route)
);

  return (
    hideHeader?<></>: <>


    <div className="navbar_container">
 <nav className=" mr-15 ml-15  navbar" role="navigation" aria-label="Main navigation">
        <div className="navbar__start">
          {/* Hamburger - first child so it sits on the left on mobile */}
          <button
            className={`navbar__hamburger ${mobileOpen ? 'navbar__hamburger--open' : ''}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <span />
            <span />
            <span />
          </button>

          {/* Logo */}
          <Logo />
        </div>

        {/* Desktop Nav Links */}
        <div className="navbar__links">
          {menus.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}

          {
            isSuperAdmin() &&  AdminMenus.map((item) => (
            <NavItem key={item.id} item={item} />
          ))
          }
        </div>

        {/* Right Actions */}
        <div className="navbar__actions">
          <HeaderIcons search_categories={search_categories} top_searchs={top_searchs} />
        </div>

      </nav>
        </div>

      {/* Mobile Menu */}
      <MobileMenu menus={menus} open={mobileOpen} onClose={() => setMobileOpen(false)} />


  </>);
};

export default HeaderSection;
