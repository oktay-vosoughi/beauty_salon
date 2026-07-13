import type { Metadata } from "next";
import AdminCampaignsClient from "./AdminCampaignsClient";

export const metadata: Metadata = { title: "Admin — Kampanyalar" };

export default function AdminCampaignsPage() {
  return <AdminCampaignsClient />;
}
