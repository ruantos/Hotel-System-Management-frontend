import type { ReservationResponse } from "../../types/api.ts";

export function mayReschedule(reservation: ReservationResponse, today: string) {
  return reservation.status !== "CANCELLED" && reservation.checkInDate > today;
}
export function mayApprove(reservation: ReservationResponse, today: string) {
  return reservation.status === "PENDING" && reservation.checkInDate >= today;
}
export const statusLabels = { PENDING: "Pendente", APPROVED: "Aprovada", CANCELLED: "Cancelada" };
