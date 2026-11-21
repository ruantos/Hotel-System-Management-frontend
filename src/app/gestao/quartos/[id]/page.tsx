import { notFound } from "next/navigation";
import { RoomDetail } from "@/features/rooms/room-detail";
import { numericId } from "@/lib/routing";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const id = numericId((await params).id); if (!id) notFound(); return <RoomDetail id={id} management />; }
