/** EMV QR payload laid out as individual KHQR (NBC Bakong tag 29), dynamic, USD. */

const GUID = "kh.gov.nbc.bakong";

function tlv(id: string, value: string): string {
  if (value.length > 99) {
    throw new Error(`Field ${id} is too long for KHQR`);
  }
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

/** CRC-16/CCITT-FALSE, the checksum KHQR appends in tag 63. */
export function crc16CcittFalse(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i += 1) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      if (crc & 0x8000) crc = ((crc << 1) ^ 0x1021) & 0xffff;
      else crc = (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function khqrCrcValid(payload: string): boolean {
  if (payload.length < 8) return false;
  const body = payload.slice(0, -4);
  if (!body.endsWith("6304")) return false;
  return crc16CcittFalse(body) === payload.slice(-4);
}

function latin(value: string, max: number, fallback: string): string {
  const cleaned = value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return (cleaned || fallback).slice(0, max);
}

export type KhqrInput = {
  bakongId: string;
  merchantName: string;
  merchantCity: string;
  amountUsd: number;
  billNumber: string;
  storeLabel?: string;
  terminalLabel?: string;
};

export function buildKhqr(input: KhqrInput): string {
  const account = input.bakongId.trim().toLowerCase();
  if (!/^[\w.-]+@[\w.-]+$/.test(account)) {
    throw new Error("Bakong ID should look like name@bank");
  }
  if (!Number.isFinite(input.amountUsd) || input.amountUsd < 0) {
    throw new Error("Amount must be a positive USD value");
  }

  const merchantAccount = tlv("00", GUID) + tlv("01", account.slice(0, 32));
  let additional = tlv("01", latin(input.billNumber, 25, "BILL"));
  if (input.storeLabel) additional += tlv("03", latin(input.storeLabel, 25, "ROOM"));
  if (input.terminalLabel) additional += tlv("07", latin(input.terminalLabel, 25, "DESK"));

  const body =
    tlv("00", "01") +
    tlv("01", "12") +
    tlv("29", merchantAccount) +
    tlv("52", "7011") +
    tlv("53", "840") +
    tlv("54", input.amountUsd.toFixed(2)) +
    tlv("58", "KH") +
    tlv("59", latin(input.merchantName, 25, "Hotel")) +
    tlv("60", latin(input.merchantCity, 15, "Siem Reap")) +
    tlv("62", additional) +
    "6304";

  return body + crc16CcittFalse(body);
}
