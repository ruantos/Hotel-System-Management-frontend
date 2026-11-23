import { notFound } from "next/navigation";
import { RoomForm } from "@/features/rooms/admin-pages";
import { numericId } from "@/lib/routing";
export default async function Page({ params }) { const id = numericId((await params).id); if (!id) notFound(); return <RoomForm id={id} />; }
