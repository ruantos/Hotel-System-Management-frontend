import { notFound } from "next/navigation";
import { RoomDetail } from "@/features/rooms/room-detail";
import { numericId } from "@/lib/routing";
export default async function Page({ params }) { const id = numericId((await params).id); if (!id) notFound(); return <div className="container"><RoomDetail id={id} /></div>; }
