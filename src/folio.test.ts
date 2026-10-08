import { describe, expect, it } from "vitest";
import { khqrCrcValid } from "./khqr";
import { nightsBetween, quoteStay, usdToKhr, liveInvoice } from "./folio";
import { DEMO_SETTINGS } from "./seed";
import type { Room, Stay } from "./types";

const stay: Stay = {
  id: "s1",
  roomId: "101",
  guestName: "Chan Dara",
  nationality: "Cambodia",
  passportNo: "N1",
  dateOfBirth: "",
  phone: "",
  vehiclePlate: "",
  checkIn: "2026-10-08",
  checkOut: "2026-10-10",
  rateUsd: 40,
  charges: [{ id: "beer", kind: "minibar", label: "Angkor beer", labelKm: "ស្រាបៀរអង្គរ", unitUsd: 2, qty: 2 }],
  dnd: false,
  status: "inhouse",
};

const room: Room = {
  id: "101",
  number: "101",
  floor: 1,
  floorEn: "Garden",
  floorKm: "សួន",
  type: "Garden double",
  typeKm: "បន្ទប់សួន",
  status: "occupied",
  rateUsd: 40,
  stayId: "s1",
};

describe("folio", () => {
  it("counts nights and same-day stays as one night", () => {
    expect(nightsBetween("2026-10-08", "2026-10-10")).toBe(2);
    expect(nightsBetween("2026-10-08", "2026-10-08")).toBe(1);
  });

  it("rounds riel to the nearest 100", () => {
    expect(usdToKhr(10, 4100)).toBe(41000);
    expect(usdToKhr(10.01, 4100)).toBe(41000);
    expect(usdToKhr(10.02, 4100)).toBe(41100);
  });

  it("adds room nights and minibar into a scannable KHQR total", () => {
    const quote = quoteStay(stay);
    expect(quote.nights).toBe(2);
    expect(quote.totalUsd).toBe(84);

    const invoice = liveInvoice(stay, room, DEMO_SETTINGS, new Date("2026-10-08T06:30:00Z"));
    expect(invoice.totalUsd).toBe(84);
    expect(invoice.totalKhr).toBe(344400);
    expect(invoice.khqr).toContain("540584.00");
    expect(khqrCrcValid(invoice.khqr)).toBe(true);
  });
});
