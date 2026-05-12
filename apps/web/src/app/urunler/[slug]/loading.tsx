import styles from "./page.module.css";
import skeletonStyles from "../loading.module.css";

export default function Loading() {
  return (
    <div className="section">
      <div className="container">
        <div className={styles.detail}>
          <div className={skeletonStyles.imgWrap} style={{ aspectRatio: "1/1", borderRadius: 8 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className={skeletonStyles.line} style={{ width: "30%", height: 12 }} />
            <div className={skeletonStyles.line} style={{ width: "70%", height: 32 }} />
            <div className={skeletonStyles.line} style={{ width: "25%", height: 28 }} />
            <div className={skeletonStyles.line} style={{ width: "100%", height: 80 }} />
            <div className={skeletonStyles.line} style={{ width: "50%", height: 44 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
