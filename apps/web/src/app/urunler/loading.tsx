import styles from "./page.module.css";
import skeletonStyles from "./loading.module.css";

export default function Loading() {
  return (
    <div className="section">
      <div className="container">
        <div className="section-title">
          <h2>Ürünlerimiz</h2>
        </div>
        <div className={styles.grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={skeletonStyles.card}>
              <div className={skeletonStyles.imgWrap} />
              <div className={skeletonStyles.body}>
                <div className={skeletonStyles.line} style={{ width: "40%" }} />
                <div className={skeletonStyles.line} style={{ width: "80%" }} />
                <div className={skeletonStyles.line} style={{ width: "30%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
