"use client";
import { useEffect, useMemo, useState,useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {HeaderItem,headerSubCategoryitem} from "@/types/header"



function NavDropdown({ subCategories,category_slug, visible,type }: { subCategories: headerSubCategoryitem[];category_slug:string; visible: boolean,type:string }) {
  return (
    <div
      className={`nav-dropdown nav-dropdown--${type} ${type=="product_cat" ?` grid grid-cols-3 `:""} ${visible ? 'nav-dropdown--visible' : ''}`}
      role="menu"
    >
      {subCategories.map((sub) => (
        <div   key={sub.slug}>
        <Link
          key={sub.slug}
          href={type==="admin_menu"?sub.slug:`/${category_slug}/${sub.slug}`}
          className="nav-dropdown__item"
          role="menuitem"
        >
          {sub.image && sub.image != '' && (
            <img src={sub.image} alt={sub.name} className="nav-dropdown__img" />
          )}
          <span>{sub.name}</span>
        </Link>
        </div>
      ))}
    </div>
  );
}


export default function NavItem({ item }: { item: HeaderItem }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasSubCategories = item.category.sub_categories.length > 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={ref}
      className="nav-item"
      onMouseEnter={() => hasSubCategories && setOpen(true)}
      onMouseLeave={() => hasSubCategories && setOpen(false)}
    >
      <Link
        href={item?.navigation_flag ? `/${item?.category?.slug}` : ``}
        className={`nav-item__label ${open ? 'nav-item__label--active' : ''}`}
        // onClick={(e) => { if(hasSubCategories) e.preventDefault(); }}
        aria-haspopup={hasSubCategories}
        aria-expanded={open}
      >
        {item.category.name}
        {hasSubCategories && (
          <svg
            className={`nav-item__chevron ${open ? 'nav-item__chevron--rotated' : ''}`}
            viewBox="0 0 16 16"
            fill="none"
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </Link>

      {hasSubCategories && (
        <NavDropdown type={item.type} category_slug={item?.category?.slug} subCategories={item.category.sub_categories} visible={open} />
      )}
    </div>
  );
}

