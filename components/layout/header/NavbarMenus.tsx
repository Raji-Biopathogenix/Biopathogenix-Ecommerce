"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSubCategories = item.category.sub_categories.length > 0;

  const handleOpen = () => {
    if (!hasSubCategories) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpen(true);
  };

  const handleCloseDelayed = () => {
    if (!hasSubCategories) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
      closeTimeoutRef.current = null;
    }, 180);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className="nav-item"
      onMouseEnter={handleOpen}
      onMouseLeave={handleCloseDelayed}
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

