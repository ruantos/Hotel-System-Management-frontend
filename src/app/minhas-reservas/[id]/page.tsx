import { notFound } from "next/navigation";
import { ReservationDetail } from "@/features/reservations/reservation-pages";
import { numericId } from "@/lib/routing";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const id = numericId((await params).id); if (!id) notFound(); return <ReservationDetail id={id} />; }
