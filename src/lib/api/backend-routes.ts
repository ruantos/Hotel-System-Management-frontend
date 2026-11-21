const routes: { path: RegExp; methods: string[] }[] = [
  { path: /^auth\/csrf$/, methods: ["GET"] },
  { path: /^auth\/(register|login|logout)$/, methods: ["POST"] },
  { path: /^auth\/(forgot-password|reset-password)$/, methods: ["POST"] },
  { path: /^auth\/me$/, methods: ["GET"] },
  { path: /^users\/me$/, methods: ["GET", "PUT"] },
  { path: /^users\/me\/password$/, methods: ["PUT"] },
  { path: /^users$/, methods: ["GET"] },
  { path: /^users\/receptionists$/, methods: ["POST"] },
  { path: /^users\/[1-9]\d*$/, methods: ["GET", "DELETE"] },
  { path: /^(rooms|room-types|amenities)$/, methods: ["GET", "POST"] },
  { path: /^(rooms|room-types|amenities)\/[1-9]\d*$/, methods: ["GET", "PUT", "DELETE"] },
  { path: /^rooms\/[1-9]\d*\/availability$/, methods: ["GET"] },
  { path: /^reservations$/, methods: ["GET", "POST"] },
  { path: /^reservations\/[1-9]\d*$/, methods: ["GET"] },
  { path: /^reservations\/[1-9]\d*\/(dates|approve|cancel)$/, methods: ["PUT"] },
];

export function allowedMethods(path: string) {
  return routes.find((route) => route.path.test(path))?.methods ?? [];
}
