// Executar manualmente: cria somente novos registros fictícios de demonstração.
// Não faz parte do CI. Credenciais reais chegam pelo ambiente/entrada oculta.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, chmodSync } from "node:fs";
import { createApiClient } from "../src/lib/api/client.js";
import { ApiError } from "../src/lib/api/problem.js";
import { hotelToday } from "../src/lib/format.js";

if (process.env.HOTEL_DEMO_WRITE_ENABLED !== "true") throw new Error("Defina HOTEL_DEMO_WRITE_ENABLED=true para criar dados novos de demonstração.");
if (!process.env.HOTEL_SMOKE_RECEPTIONIST_EMAIL || !process.env.HOTEL_SMOKE_RECEPTIONIST_PASSWORD) throw new Error("Conta de recepção necessária no ambiente, sem inserir segredos no comando.");

const origin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const base = origin + "/api/backend";
const tag = Date.now().toString(36) + randomBytes(3).toString("hex");
const report = { date: hotelToday(), run: tag, checks: [], created: { users: [], rooms: [], amenities: [], reservations: [] }, counts: {} };
mkdirSync(".local", { recursive: true });
function saveReport() { writeFileSync(".local/demo-validation.json", JSON.stringify(report, null, 2) + "\n", { mode: 0o600 }); }
function privateSettings(values) {
  const path = ".env.local";
  let content;
  try { content = readFileSync(path, "utf8"); } catch { content = ""; }
  for (const [key, value] of Object.entries(values)) {
    const line = key + "=" + value;
    const pattern = new RegExp("^" + key + "=.*$", "m");
    content = pattern.test(content) ? content.replace(pattern, line) : content.trimEnd() + "\n" + line + "\n";
  }
  writeFileSync(path, content, { mode: 0o600 });
  chmodSync(path, 0o600);
}
async function step(label, action) {
  const result = await action();
  report.checks.push({ label, passed: true }); saveReport();
  console.log("Aprovado: " + label);
  return result;
}
async function expectStatus(action, status) {
  try { await action(); } catch (error) {
    assert.ok(error instanceof ApiError, "Erro HTTP esperado");
    assert.equal(error.status, status, "Status HTTP esperado " + status);
    return;
  }
  throw new Error("A operação deveria retornar HTTP " + status);
}
function actor(email, password) {
  const cookies = new Map();
  const api = createApiClient(async (url, options) => {
    const headers = new Headers(options.headers);
    if (cookies.size) headers.set("Cookie", [...cookies].map(([name, value]) => name + "=" + value).join("; "));
    if (options.method !== "GET") headers.set("Origin", origin);
    const response = await fetch(url, { ...options, headers, redirect: "manual", signal: AbortSignal.timeout(90_000) });
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";", 1)[0]; const split = pair.indexOf("=");
      const key = pair.slice(0, split); const value = pair.slice(split + 1);
      if (!value || /max-age=0/i.test(cookie)) cookies.delete(key); else cookies.set(key, value);
    }
    return response;
  }, base);
  return { api, email, password, login: async function () {
    await api.request("auth/login", { method: "POST", body: new URLSearchParams({ email: this.email, password: this.password }) });
    this.user = await api.request("auth/me");
    return this.user;
  } };
}
function future(days) {
  let [year, month, day] = hotelToday().split("-").map(Number);
  while (days-- > 0) {
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const length = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
    if (++day > length) { day = 1; if (++month > 12) { month = 1; year++; } }
  }
  return [year, String(month).padStart(2, "0"), String(day).padStart(2, "0")].join("-");
}
function roomPayload(room, changes = {}) {
  return { name: room.name, number: room.number, typeId: room.type.id, description: room.description,
    capacity: room.capacity, pricePerNight: room.pricePerNight, active: room.active, amenityIds: room.amenities.map((item) => item.id), ...changes };
}

const reception = actor(process.env.HOTEL_SMOKE_RECEPTIONIST_EMAIL, process.env.HOTEL_SMOKE_RECEPTIONIST_PASSWORD);
const clients = [];
const temporary = { rooms: [], amenities: [] };
let currentStep = "inicialização";
try {
  const run = async (label, action) => { currentStep = label; return step(label, action); };
  await run("Autenticação da recepção", async () => { assert.equal((await reception.login()).role, "RECEPTIONIST"); });
  const types = await reception.api.request("room-types");
  assert.ok(types.length >= 2, "Dois tipos reais necessários");
  const existingRooms = await reception.api.request("rooms");
  const numbers = new Set(existingRooms.map((room) => room.number));
  function nextNumber() { let number = 101; while (numbers.has(number)) number++; numbers.add(number); return number; }
  const amenities = await run("Cadastrar duas características de demonstração", async () => {
    const items = [];
    for (const name of ["Wi-Fi", "Ar-condicionado"]) {
      const item = await reception.api.request("amenities", { method: "POST", body: { name, description: "Demonstração frontend " + tag } });
      items.push(item); report.created.amenities.push(item.id); saveReport();
    }
    return items;
  });
  await run("Consultar, editar e excluir característica descartável", async () => {
    const item = await reception.api.request("amenities", { method: "POST", body: { name: "Temporária " + tag } });
    temporary.amenities.push(item.id);
    assert.equal((await reception.api.request("amenities/" + item.id)).id, item.id);
    const edited = await reception.api.request("amenities/" + item.id, { method: "PUT", body: { name: "Temporária editada " + tag, description: "Descartável" } });
    assert.equal(edited.name, "Temporária editada " + tag);
    await reception.api.request("amenities/" + item.id, { method: "DELETE" }); temporary.amenities = [];
    await expectStatus(() => reception.api.request("amenities/" + item.id), 404);
  });
  const rooms = await run("Cadastrar dois quartos com relacionamento N:N", async () => {
    const items = [];
    for (const [index, name] of ["Jardim (demonstração)", "Horizonte (demonstração)"].entries()) {
      const room = await reception.api.request("rooms", { method: "POST", body: { name, number: nextNumber(), typeId: types[index].id,
        description: "Dados fictícios de demonstração frontend " + tag, capacity: 2 + index * 2, pricePerNight: 180.5 + index * 100,
        active: true, amenityIds: amenities.map((item) => item.id) } });
      assert.equal(room.amenities.length, 2); items.push(room); report.created.rooms.push(room.id); saveReport();
    }
    return items;
  });
  await run("Consultar, editar e excluir quarto descartável; preservar amenityIds", async () => {
    const room = await reception.api.request("rooms", { method: "POST", body: roomPayload(rooms[0], { number: nextNumber(), name: "Quarto descartável " + tag }) });
    temporary.rooms.push(room.id);
    assert.equal((await reception.api.request("rooms/" + room.id)).id, room.id);
    const edited = await reception.api.request("rooms/" + room.id, { method: "PUT", body: roomPayload(room, { capacity: 3, active: false }) });
    assert.equal(edited.active, false); assert.equal(edited.capacity, 3);
    assert.deepEqual(edited.amenities.map((item) => item.id).sort(), amenities.map((item) => item.id).sort());
    await reception.api.request("rooms/" + room.id, { method: "DELETE" }); temporary.rooms = [];
    await expectStatus(() => reception.api.request("rooms/" + room.id), 404);
  });
  await run("Recusar número duplicado e exclusão de característica vinculada", async () => {
    await expectStatus(() => reception.api.request("rooms", { method: "POST", body: roomPayload(rooms[0]) }), 409);
    await expectStatus(() => reception.api.request("amenities/" + amenities[0].id, { method: "DELETE" }), 409);
  });
  await run("Cadastrar dois clientes, preservar cadastro sem login automático e perfil CLIENT", async () => {
    for (const [index, suffix] of ["a", "b"].entries()) {
      const client = actor("demo-frontend-" + tag + "-" + suffix + "@example.invalid", randomBytes(24).toString("base64url"));
      const account = await client.api.request("auth/register", { method: "POST", body: { name: "Cliente Demonstração " + suffix.toUpperCase(), email: client.email, password: client.password } });
      assert.equal(account.role, "CLIENT"); assert.ok(account.customerProfile);
      clients.push(client); report.created.users.push(account.id); saveReport();
      const prefix = index === 0 ? "HOTEL_SMOKE_CLIENT" : "HOTEL_DEMO_CLIENT2";
      privateSettings({ [prefix + "_EMAIL"]: client.email, [prefix + "_PASSWORD"]: client.password });
      await expectStatus(() => client.api.request("auth/me"), 401);
      await client.login(); assert.equal(client.user.id, account.id);
      await expectStatus(() => client.api.request("users"), 403);
    }
  });
  await run("Atualizar conta do cliente e exigir reautenticação", async () => {
    await clients[0].api.request("users/me", { method: "PUT", body: { name: "Cliente Demonstração A (editado)", email: clients[0].email, phone: null, document: null } });
    await expectStatus(() => clients[0].api.request("auth/me"), 401);
    await clients[0].login();
    assert.equal(clients[0].user.name, "Cliente Demonstração A (editado)");
  });
  await run("Alterar senha do cliente, revogar sessão e recusar senha anterior", async () => {
    const nextPassword = randomBytes(24).toString("base64url");
    await clients[0].api.request("users/me/password", { method: "PUT", body: { currentPassword: clients[0].password, newPassword: nextPassword } });
    privateSettings({ HOTEL_SMOKE_CLIENT_PASSWORD: nextPassword });
    await expectStatus(() => clients[0].api.request("auth/me"), 401);
    await expectStatus(() => clients[0].login(), 401);
    clients[0].password = nextPassword; await clients[0].login();
  });
  const period = { checkInDate: future(30), checkOutDate: future(32) };
  const availability = (dates) => reception.api.request("rooms/" + rooms[0].id + "/availability?" + new URLSearchParams(dates));
  const race = await run("Concorrência real: uma reserva aceita e outra recusada por período ocupado", async () => {
    const results = await Promise.allSettled(clients.map((client) => client.api.request("reservations", { method: "POST", body: { roomId: rooms[0].id, ...period, guestCount: 2 } })));
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(results.filter((result) => result.status === "rejected" && result.reason.status === 409).length, 1);
    const winner = results.findIndex((result) => result.status === "fulfilled");
    const reservation = results[winner].value;
    assert.equal(reservation.status, "PENDING"); report.created.reservations.push(reservation.id); saveReport();
    return { owner: clients[winner], other: clients[1 - winner], reservation };
  });
  await run("Isolar reservas dos clientes e impedir aprovação/cancelamento por perfil incorreto", async () => {
    await expectStatus(() => race.other.api.request("reservations/" + race.reservation.id), 404);
    await expectStatus(() => race.owner.api.request("reservations/" + race.reservation.id + "/approve", { method: "PUT" }), 403);
    await expectStatus(() => reception.api.request("reservations/" + race.reservation.id + "/cancel", { method: "PUT" }), 403);
    assert.equal((await availability(period)).available, false);
    assert.equal((await availability({ checkInDate: period.checkOutDate, checkOutDate: future(34) })).available, true);
  });
  await run("Aprovar, remarcar, exigir nova aprovação e preservar status para datas idênticas", async () => {
    const path = "reservations/" + race.reservation.id;
    assert.equal((await reception.api.request(path + "/approve", { method: "PUT" })).status, "APPROVED");
    await expectStatus(() => reception.api.request(path + "/approve", { method: "PUT" }), 409);
    const dates = { checkInDate: future(40), checkOutDate: future(42) };
    assert.equal((await race.owner.api.request(path + "/dates", { method: "PUT", body: dates })).status, "PENDING");
    assert.equal((await availability(period)).available, true);
    assert.equal((await reception.api.request(path + "/approve", { method: "PUT" })).status, "APPROVED");
    assert.equal((await race.owner.api.request(path + "/dates", { method: "PUT", body: dates })).status, "APPROVED");
  });
  const secondDates = { checkInDate: future(60), checkOutDate: future(62) };
  const second = await run("Criar segunda reserva futura e recusar remarcação sobre período ocupado", async () => {
    const reservation = await race.other.api.request("reservations", { method: "POST", body: { roomId: rooms[0].id, ...secondDates, guestCount: 2 } });
    report.created.reservations.push(reservation.id); saveReport();
    await expectStatus(() => race.owner.api.request("reservations/" + race.reservation.id + "/dates", { method: "PUT", body: secondDates }), 409);
    const unchanged = await race.owner.api.request("reservations/" + race.reservation.id);
    assert.equal(unchanged.checkInDate, future(40)); assert.equal(unchanged.status, "APPROVED");
    return reservation;
  });
  await run("Recusar capacidade incompatível e impedir exclusão de quarto/cliente com reserva", async () => {
    await expectStatus(() => reception.api.request("rooms/" + rooms[0].id, { method: "PUT", body: roomPayload(rooms[0], { capacity: 1 }) }), 409);
    await expectStatus(() => reception.api.request("rooms/" + rooms[0].id, { method: "DELETE" }), 409);
    await expectStatus(() => reception.api.request("users/" + race.owner.user.id, { method: "DELETE" }), 409);
  });
  await run("Quarto inativo bloqueia disponibilidade e aprovação; reativação preserva vínculos", async () => {
    try {
      await reception.api.request("rooms/" + rooms[0].id, { method: "PUT", body: roomPayload(rooms[0], { active: false }) });
      assert.equal((await availability({ checkInDate: future(70), checkOutDate: future(72) })).available, false);
      await expectStatus(() => reception.api.request("reservations/" + second.id + "/approve", { method: "PUT" }), 409);
    } finally {
      await reception.api.request("rooms/" + rooms[0].id, { method: "PUT", body: roomPayload(rooms[0], { active: true }) });
    }
    assert.equal((await reception.api.request("rooms/" + rooms[0].id)).amenities.length, 2);
  });
  await run("Cancelar reserva do proprietário, liberar disponibilidade e recusar repetição", async () => {
    const path = "reservations/" + second.id;
    assert.equal((await race.other.api.request(path + "/cancel", { method: "PUT" })).status, "CANCELLED");
    assert.equal((await availability(secondDates)).available, true);
    await expectStatus(() => race.other.api.request(path + "/cancel", { method: "PUT" }), 409);
    await expectStatus(() => race.other.api.request(path + "/dates", { method: "PUT", body: secondDates }), 409);
  });
  await run("Preparar característica extra descartável para demonstração em vídeo", async () => {
    const item = await reception.api.request("amenities", { method: "POST", body: { name: "Característica para vídeo (descartável)", description: "Demonstração frontend " + tag } });
    report.created.amenities.push(item.id);
  });
  await run("Conferir persistência via API e mínimos das seis entidades", async () => {
    const users = await reception.api.request("users");
    report.counts = { User: users.length, CustomerProfile: users.filter((user) => user.customerProfile).length,
      RoomType: (await reception.api.request("room-types")).length, Amenity: (await reception.api.request("amenities")).length,
      Room: (await reception.api.request("rooms")).length, Reservation: (await reception.api.request("reservations")).length };
    for (const count of Object.values(report.counts)) assert.ok(count >= 2);
  });
  report.passed = true; saveReport();
  console.log("Validação real concluída. Contagens: " + JSON.stringify(report.counts));
  console.log("Credenciais dos clientes fictícios somente em .env.local; relatório sem segredos em .local/demo-validation.json.");
} catch (error) {
  report.passed = false; report.failure = { step: currentStep, status: error instanceof ApiError ? error.status : "assertion" };
  saveReport(); console.error("Falha na etapa: " + currentStep + "; código " + report.failure.status + ". Confira o relatório local.");
  process.exitCode = 1;
} finally {
  for (const id of temporary.rooms) { try { await reception.api.request("rooms/" + id, { method: "DELETE" }); } catch { /* somente descartáveis criados nesta execução */ } }
  for (const id of temporary.amenities) { try { await reception.api.request("amenities/" + id, { method: "DELETE" }); } catch { /* somente descartáveis criados nesta execução */ } }
  for (const account of [...clients, reception]) {
    try { await account.api.request("auth/logout", { method: "POST" }); } catch { /* não expor credenciais em falha de encerramento */ }
    account.password = "";
  }
}
