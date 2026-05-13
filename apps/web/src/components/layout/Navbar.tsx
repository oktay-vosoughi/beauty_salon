"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAppState } from "@/components/state/AppStateProvider";
import { site } from "@/lib/site";
import styles from "./Navbar.module.css";

const navLinks = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/urunler", label: "Ürünler" },
  { href: "/iletisim", label: "İletişim" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { authStatus, cartQuantity } = useAppState();
  const [open, setOpen] = useState(false);
  const signedIn = authStatus === "authenticated";

  return (
    <nav className={styles.nav}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand}>
          ✦ {site.name}
        </Link>

        <button
          className={styles.menuBtn}
          onClick={() => setOpen((v) => !v)}
          aria-label="Menüyü aç/kapat"
          aria-expanded={open}
        >
          {open ? "✕" : "☰"}
        </button>

        <ul className={`${styles.links} ${open ? styles.open : ""}`}>
          {navLinks.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={pathname === l.href ? styles.active : ""}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/sepet" className={styles.cartLink} onClick={() => setOpen(false)}>
              Sepet
              {cartQuantity > 0 && (
                <span className={styles.cartBadge} aria-label={`Sepette ${cartQuantity} ürün`}>
                  {cartQuantity}
                </span>
              )}
            </Link>
          </li>
          <li>
            <Link href={signedIn ? "/hesabim" : "/giris"} onClick={() => setOpen(false)}>
              {signedIn ? "Hesabım" : "Giriş Yap"}
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
