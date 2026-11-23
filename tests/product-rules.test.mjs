import test from "node:test";
import assert from "node:assert/strict";
import { filterRooms } from "../src/features/rooms/filter-rooms.js";
import { mayApprove, mayReschedule } from "../src/features/reservations/rules.js";
import { createRoomSearchStore } from "../src/stores/room-search-store.js";

test("catálogo exclui inativos e combina capacidade, tipo e todas as características", () => {
  const base = { active: true, capacity: 2, type: { id: 1 }, amenities: [{ id: 1 }, { id: 2 }] };
  const rooms = [{ ...base, id: 1 }, { ...base, id: 2, active: false }, { ...base, id: 3, capacity: 1 }, { ...base, id: 4, amenities: [{ id: 1 }] }];
  assert.deepEqual(filterRooms(rooms, { guestCount: 2, typeId: 1, amenityIds: [1, 2] }).map((room) => room.id), [1]);
});

test("prazo e status diferenciam aprovação no dia da entrada e remarcação apenas antes", () => {
  const reservation = { status: "PENDING", checkInDate: "2027-01-10" };
  assert.equal(mayApprove(reservation, "2027-01-10"), true);
  assert.equal(mayReschedule(reservation, "2027-01-10"), false);
  assert.equal(mayReschedule(reservation, "2027-01-09"), true);
  assert.equal(mayApprove({ ...reservation, status: "APPROVED" }, "2027-01-09"), false);
  assert.equal(mayReschedule({ ...reservation, status: "CANCELLED" }, "2027-01-09"), false);
});

test("preferências de visitantes distintos ficam isoladas", () => {
  const first = createRoomSearchStore();
  const second = createRoomSearchStore();
  first.getState().setPreferences({ typeId: 2, amenityIds: [3], checkInDate: "2027-01-10" });
  assert.equal(second.getState().typeId, null);
  assert.deepEqual(second.getState().amenityIds, []);
  assert.equal(second.getState().checkInDate, "");
});
