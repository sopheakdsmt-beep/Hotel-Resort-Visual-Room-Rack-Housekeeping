import { describe, expect, it } from "vitest";
import { buildKhqr, crc16CcittFalse, khqrCrcValid } from "./khqr";

describe("KHQR", () => {
  it("matches the CRC-16/CCITT-FALSE check vector", () => {
    expect(crc16CcittFalse("123456789")).toBe("29B1");
  });

  it("builds a dynamic USD KHQR with a valid checksum", () => {
    const payload = buildKhqr({
      bakongId: "lotuscourt@aba",
      merchantName: "Lotus Court",
      merchantCity: "Siem Reap",
      amountUsd: 2.5,
      billNumber: "LC20261008V1",
      storeLabel: "Room V1",
      terminalLabel: "DESK",
    });

    expect(payload.startsWith("000201")).toBe(true);
    expect(payload).toContain("010212");
    expect(payload).toContain("kh.gov.nbc.bakong");
    expect(payload).toContain("lotuscourt@aba");
    expect(payload).toContain("52047011");
    expect(payload).toContain("5303840");
    expect(payload).toContain("54042.50");
    expect(payload).toContain("5802KH");
    expect(khqrCrcValid(payload)).toBe(true);
  });

  it("rejects a Bakong ID without a bank suffix", () => {
    expect(() =>
      buildKhqr({
        bakongId: "lotuscourt",
        merchantName: "Lotus Court",
        merchantCity: "Siem Reap",
        amountUsd: 10,
        billNumber: "BILL1",
      }),
    ).toThrow(/Bakong ID/);
  });
});
