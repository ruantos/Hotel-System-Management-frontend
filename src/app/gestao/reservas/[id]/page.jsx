import { notFound } from "next/navigation";
import { ReservationDetail } from "@/features/reservations/reservation-pages";
import { numericId } from "@/lib/routing";
export default async function Page({ params }) { const id = numericId((await params).id); if (!id) notFound(); return <ReservationDetail id={id} management />; }
