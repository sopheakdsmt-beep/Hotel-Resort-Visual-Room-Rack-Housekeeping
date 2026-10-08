import { describe, expect, it } from "vitest";
import { khqrCrcValid } from "./khqr";
import { reducer } from "./reducer";
import { createDemoState, DEMO_SETTINGS } from "./seed";
import type { State, Stay } from "./types";

function emptyHouse(): State {
  return {
    version: 1,
    settings: DEMO_SETTINGS,
    rooms: [
      {
        id: "101",
        number: "101",
        floor: 1,
        floorEn: "Garden",
        floorKm: "សួន",
        type: "Garden double",
        typeKm: "បន្ទប់សួន",
        status: "clean",
        rateUsd: 40,
      },
    ],
    stays: [],
  };
}

const stay: Stay = {
  id: "stay-new",
  roomId: "101",
  guestName: "Apsara Keo",
  nationality: "Cambodia",
  passportNo: "N555",
  dateOfBirth: "1995-01-01",
  phone: "012000000",
  vehiclePlate: "2AB-1001",
  signature: "data:image/png;base64,abc",
  checkIn: "2026-10-08",
  checkOut: "2026-10-09",
  rateUsd: 40,
  charges: [],
  dnd: false,
  status: "inhouse",
};

describe("reducer", () => {
  it("seeds a full rack with linked in-house stays", () => {
    const state = createDemoState(new Date("2026-10-08T06:00:00Z"));
    expect(state.rooms).toHaveLength(24);
    const occupied = state.rooms.filter((room) => room.status === "occupied");
    expect(occupied.length).toBeGreaterThan(0);
    for (const room of occupied) {
      const guest = state.stays.find((item) => item.id === room.stayId);
      expect(guest?.status).toBe("inhouse");
    }
    const departed = state.stays.find((item) => item.id === "stay-103-prev");
    expect(departed?.invoice && khqrCrcValid(departed.invoice.khqr)).toBe(true);
  });

  it("checks a guest in, posts a minibar item, and settles the room to dirty", () => {
    const checkedIn = reducer(emptyHouse(), { type: "checkin", stay });
    expect(checkedIn.rooms[0]?.status).toBe("occupied");

    const withBeer = reducer(checkedIn, {
      type: "setCharge",
      stayId: stay.id,
      charge: { id: "beer", kind: "minibar", label: "Angkor beer", labelKm: "ស្រាបៀរអង្គរ", unitUsd: 2, qty: 1 },
    });

    const settled = reducer(withBeer, { type: "checkout", stayId: stay.id });
    expect(settled.rooms[0]?.status).toBe("dirty");
    expect(settled.rooms[0]?.stayId).toBeUndefined();
    const closed = settled.stays[0];
    expect(closed?.status).toBe("checkedout");
    expect(closed?.invoice?.totalUsd).toBe(42);
    expect(closed?.invoice && khqrCrcValid(closed.invoice.khqr)).toBe(true);
  });

  it("keeps an occupied room out of the housekeeping clean action", () => {
    const checkedIn = reducer(emptyHouse(), { type: "checkin", stay });
    const next = reducer(checkedIn, { type: "setStatus", roomId: "101", status: "clean" });
    expect(next.rooms[0]?.status).toBe("occupied");
  });

  it("turns a repaired room into a dirty room for the next clean", () => {
    const dirty = reducer(emptyHouse(), {
      type: "setStatus",
      roomId: "101",
      status: "maintenance",
      maintNote: "Tap",
    });
    expect(dirty.rooms[0]?.maintNote).toBe("Tap");
    const repaired = reducer(dirty, { type: "setStatus", roomId: "101", status: "dirty" });
    expect(repaired.rooms[0]?.status).toBe("dirty");
    expect(repaired.rooms[0]?.maintNote).toBeUndefined();
  });
});
