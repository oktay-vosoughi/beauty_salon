import type { Metadata } from "next";
import PaymentClient from "./PaymentClient";

export const metadata: Metadata = {
  title: "Ödeme",
  description: "Güvenli ödeme sayfası.",
};

export default function OdemePage({ params }: { params: { orderId: string } }) {
  return (
    <div className="section">
      <div className="container">
        <PaymentClient orderId={params.orderId} />
      </div>
    </div>
  );
}
