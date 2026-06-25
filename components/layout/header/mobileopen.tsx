"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { HeaderItem } from "@/types/header";

export default function MobileMenu({ menus, open, onClose }: { menus: HeaderItem[]; open: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    onClose();
    router.push("/");
  };

  const handleLinkClick = () => {
    setExpanded(null);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="mobile-menu-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div className={`mobile-menu ${open ? "mobile-menu--open" : ""}`} role="dialog" aria-modal="true" aria-label="Navigation menu">
        {/* Header row inside drawer */}
        <div className="mobile-menu__header">
          <Link href="/" onClick={handleLinkClick}>
            <Image
              src="/images/logo/BioPathogenix-Horizontal-1.svg"
              alt="BioPathogenix"
              width={150}
              height={36}
              className="h-9 w-auto"
            />
          </Link>
          <button className="mobile-menu__close" onClick={onClose} aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mobile-menu__inner">
          {/* Nav items */}
          {menus.map((item) => (
            <div key={item.id} className="mobile-menu__section">
              {item.category.sub_categories.length > 0 ? (
                <>
                  <button
                    className="mobile-menu__category"
                    onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  >
                    {item.category.name}
                    <svg
                      className={`mobile-menu__chevron ${expanded === item.id ? "mobile-menu__chevron--rotated" : ""}`}
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {expanded === item.id && (
                    <div className="mobile-menu__subs">
                      {item.category.sub_categories.map((sub) => (
                        <Link
                          key={sub.slug}
                          href={`/${item.category.slug}/${sub.slug}`}
                          className="mobile-menu__sub"
                          onClick={handleLinkClick}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={`/${item.category.slug}`}
                  className="mobile-menu__category mobile-menu__category--link"
                  onClick={handleLinkClick}
                >
                  {item.category.name}
                </Link>
              )}
            </div>
          ))}

          {/* Account section */}
          <div className="mobile-menu__account">
            <div className="mobile-menu__account-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              YOUR ACCOUNT
            </div>
            {user ? (
              <button className="mobile-menu__logout" onClick={handleLogout}>
                LOG OUT
              </button>
            ) : (
              <Link href="/my-account" className="mobile-menu__login" onClick={handleLinkClick}>
                LOG IN
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
