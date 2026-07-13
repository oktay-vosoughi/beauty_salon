"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";

interface ProductImage {
  url: string;
  alt: string;
  blurDataUrl?: string | null;
}

interface ProductGalleryProps {
  images: ProductImage[];
  title: string;
}

export default function ProductGallery({ images, title }: ProductGalleryProps) {
  const galleryImages = useMemo(
    () => (images.length > 0 ? images : [{ url: "/placeholder.jpg", alt: title }]),
    [images, title]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = galleryImages[activeIndex] ?? galleryImages[0];
  const hasMultipleImages = galleryImages.length > 1;
  const activeImageIsUploaded = activeImage.url.startsWith("/uploads/");

  function showPrevious() {
    setActiveIndex((current) =>
      current === 0 ? galleryImages.length - 1 : current - 1
    );
  }

  function showNext() {
    setActiveIndex((current) =>
      current === galleryImages.length - 1 ? 0 : current + 1
    );
  }

  return (
    <div className={styles.gallery}>
      <div className={styles.mainImgWrap}>
        <Image
          src={activeImage.url}
          alt={activeImage.alt || title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ objectFit: "contain" }}
          priority
          placeholder={activeImage.blurDataUrl ? "blur" : "empty"}
          blurDataURL={activeImage.blurDataUrl ?? undefined}
          unoptimized={activeImageIsUploaded}
        />

        {hasMultipleImages && (
          <>
            <button
              type="button"
              className={`${styles.galleryButton} ${styles.galleryButtonPrev}`}
              onClick={showPrevious}
              aria-label="Onceki gorsel"
            >
              ‹
            </button>
            <button
              type="button"
              className={`${styles.galleryButton} ${styles.galleryButtonNext}`}
              onClick={showNext}
              aria-label="Sonraki gorsel"
            >
              ›
            </button>
            <span className={styles.galleryCounter}>
              {activeIndex + 1} / {galleryImages.length}
            </span>
          </>
        )}
      </div>

      {hasMultipleImages && (
        <div className={styles.thumbs} aria-label="Urun gorselleri">
          {galleryImages.map((img, index) => (
            <button
              key={`${img.url}-${index}`}
              type="button"
              className={`${styles.thumbWrap} ${
                index === activeIndex ? styles.thumbWrapActive : ""
              }`}
              onClick={() => setActiveIndex(index)}
              aria-label={`${index + 1}. gorseli goster`}
              aria-current={index === activeIndex ? "true" : undefined}
            >
              <Image
                src={img.url}
                alt={img.alt || title}
                fill
                sizes="70px"
                style={{ objectFit: "cover" }}
                loading="lazy"
                placeholder={img.blurDataUrl ? "blur" : "empty"}
                blurDataURL={img.blurDataUrl ?? undefined}
                unoptimized={img.url.startsWith("/uploads/")}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
