import type { Metadata } from "next";
import { CatalogPage } from "@/features/rooms/catalog-page";

export const metadata: Metadata = { title: "Acomodações" };

export default function RoomsPage() {
  return <CatalogPage />;
}
