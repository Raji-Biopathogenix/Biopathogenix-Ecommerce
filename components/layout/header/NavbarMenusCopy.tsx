"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CATEGORY_FALLBACK,
  fetchCategories,
  getCategoryImage,
  sortCategories,
  type Category,
} from "@/lib/categories";
import {
  fetchNavigationMenu,
  NAVIGATION_FALLBACK,
  type NavigationGroup,
} from "@/lib/navigation";


const NavbarMenus = () => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>(CATEGORY_FALLBACK);
  const [navigation, setNavigation] = useState<NavigationGroup[]>(NAVIGATION_FALLBACK);

  

  useEffect(() => {
    let isActive = true;

    fetchCategories().then((data) => {
      if (!isActive) return;
      if (data.length) {
        setCategories(data);
      }
    });

    fetchNavigationMenu().then((data) => {
      if (!isActive) return;
      if (data.length) {
        setNavigation(data);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  const shopItems = useMemo(() => {
    const sorted = sortCategories(categories);
    const items = sorted.map((item) => ({
      label: item.name,
      href:
        item.slug === "quality-control"
          ? "/quality-control"
          : `/product-category/${item.slug}/`,
      img: getCategoryImage(item.slug, item.icon),
    }));

    items.push({
      label: "All Products",
      href: "/shop",
      img: getCategoryImage("all-products"),
    });

    return items;
  }, [categories]);

  const navGroups = useMemo(() => {
    const groups = new Map(navigation.map((group) => [group.slug, group]));
    return {
      services: groups.get("services"),
      resources: groups.get("resources"),
      about: groups.get("about"),
    };
  }, [navigation]);

  const renderMenu = (group: NavigationGroup | undefined, slug: string) => {
    if (!group) return null;
    return (
      <li
        className="relative list-none"
        aria-haspopup="true"
        aria-expanded={openMenu === slug}
        onMouseEnter={() => setOpenMenu(slug)}
        onMouseLeave={() => setOpenMenu(null)}
      >
        <button
          type="button"
          className="text-[15px] font-semibold tracking-[0.02em] text-[#0b2e59] hover:text-[#0b76d1] transition"
        >
          {group.title}
        </button>

        <ul
          className={`absolute left-0 top-full mt-4 w-[320px] rounded-2xl border border-[#e5eff9] bg-white/95 shadow-[0_18px_60px_rgba(11,46,89,0.18)] backdrop-blur-sm
          transition-all duration-300
          ${
            openMenu === slug
              ? "opacity-100 translate-y-0 visible"
              : "opacity-0 translate-y-2 invisible"
          }`}
        >
          <li className="flex flex-col gap-2 p-4">
            {group.items.map((item) => (
              <Link
                key={item.title}
                href={item.url}
                target={item.open_in_new_tab ? "_blank" : undefined}
                rel={item.open_in_new_tab ? "noreferrer" : undefined}
                className="rounded-lg px-3 py-2 text-[14px] font-medium text-[#0b2e59] hover:bg-[#f4f8fc] hover:text-[#0b76d1] transition"
              >
                {item.title}
              </Link>
            ))}
          </li>
        </ul>
      </li>
    );
  };

  return (
    <nav className="hidden lg:flex items-center gap-8">
      {/* SHOP */}
      <li
        className="relative list-none"
        aria-haspopup="true"
        aria-expanded={openMenu === "products"}
        onMouseEnter={() => setOpenMenu("products")}
        onMouseLeave={() => setOpenMenu(null)}
      >
        <Link
          href="/shop"
          className="text-[15px] font-semibold tracking-[0.02em] text-[#0b2e59] hover:text-[#0b76d1] transition"
        >
          Products
        </Link>

        <ul
          className={`absolute left-0 top-full mt-4 w-[760px] rounded-2xl border border-[#e5eff9] bg-white/95 shadow-[0_18px_60px_rgba(11,46,89,0.18)] backdrop-blur-sm
          transition-all duration-300
          ${
            openMenu === "products"
              ? "opacity-100 translate-y-0 visible"
              : "opacity-0 translate-y-2 invisible"
          }`}
        >
          <li className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6b7e99]">
                Shop by Category
              </span>
              <Link
                href="/shop"
                className="text-[12px] font-semibold text-[#0b76d1] hover:text-[#0a66b5] transition"
              >
                View all
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-6">
            {shopItems.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                className="group flex items-center gap-4 rounded-xl p-3 hover:bg-[#f4f8fc] transition"
                style={{ transitionDelay: `${index * 30}ms` }}
              >
                {/* ICON */}
                <Image
                  src={item.img}
                  alt={item.label}
                  width={60}
                  height={60}
                  className="rounded-md object-contain"
                />

                {/* TEXT */}
                <span className="text-[14px] font-semibold leading-tight text-[#0b2e59] group-hover:text-[#0b76d1]">
                  {item.label}
                </span>
              </Link>
            ))}
            </div>
          </li>
        </ul>
      </li>

      <Link
        href="/quality-control"
        className="flex items-center gap-2 text-[15px] font-semibold tracking-[0.02em] text-[#0b2e59] hover:text-[#0b76d1] transition"
      >
        Quality Control
        <span className="rounded-full bg-[#e8f3ff] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0b76d1]">
          New
        </span>
      </Link>

      {renderMenu(navGroups.services, "services")}
      {renderMenu(navGroups.resources, "resources")}
      {renderMenu(navGroups.about, "about")}
    </nav>
  );
};

export default NavbarMenus;
