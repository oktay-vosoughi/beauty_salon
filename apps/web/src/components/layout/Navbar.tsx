"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import styles from "./Navbar.module.css";

const navLinks = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/urunler", label: "Ürünler" },
  { href: "/iletisim", label: "İletişim" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className={styles.nav}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand}>
          ✦ Güzellik Merkezi
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
            </Link>
          </li>
          <li>
            <Link href="/giris" onClick={() => setOpen(false)}>
              Giriş Yap
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
