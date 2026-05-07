import type { Metadata } from "next";
import SepetClient from "./SepetClient";

export const metadata: Metadata = {
  title: "Sepetim",
  description: "Alışveriş sepetiniz.",
};

export default function SepetPage() {
  return (
    <div className="section">
      <div className="container">
        <SepetClient />
      </div>
    </div>
  );
}
