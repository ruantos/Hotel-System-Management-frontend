export function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatStayDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "A definir";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function hotelToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Recife", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
