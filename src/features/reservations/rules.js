export function mayReschedule(reservation, today) {
  return reservation.status !== "CANCELLED" && reservation.checkInDate > today;
}
export function mayApprove(reservation, today) {
  return reservation.status === "PENDING" && reservation.checkInDate >= today;
}
export const statusLabels = { PENDING: "Pendente", APPROVED: "Aprovada", CANCELLED: "Cancelada" };
