import { notFound } from "next/navigation";
import { AmenityForm } from "@/features/amenities/amenity-pages";
import { numericId } from "@/lib/routing";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const id = numericId((await params).id); if (!id) notFound(); return <AmenityForm id={id} />; }
