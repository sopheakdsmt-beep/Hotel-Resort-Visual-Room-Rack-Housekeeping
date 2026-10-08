import { buildKhqr } from "./khqr";
import type { Invoice, InvoiceLine, Room, Settings, Stay } from "./types";

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const start = Date.parse(`${checkIn}T00:00:00`);
  const end = Date.parse(`${checkOut}T00:00:00`);
  if (Number.isNaN(start) || Number.isNaN(end)) return 1;
  return Math.max(1, Math.round((end - start) / 86_400_000));
}

export function stayDay(checkIn: string, today: string): number {
  const start = Date.parse(`${checkIn}T00:00:00`);
  const now = Date.parse(`${today}T00:00:00`);
  if (Number.isNaN(start) || Number.isNaN(now)) return 1;
  return Math.max(1, Math.round((now - start) / 86_400_000) + 1);
}

/** Riel is quoted to the nearest 100, the way the front desk actually gives change. */
export function usdToKhr(usd: number, rate: number): number {
  if (!Number.isFinite(usd) || !Number.isFinite(rate) || rate <= 0) return 0;
  return Math.round((usd * rate) / 100) * 100;
}

export function quoteStay(stay: Stay): { nights: number; lines: InvoiceLine[]; totalUsd: number } {
  const nights = nightsBetween(stay.checkIn, stay.checkOut);
  const lines: InvoiceLine[] = [
    {
      label: nights === 1 ? "Room, 1 night" : `Room, ${nights} nights`,
      labelKm: `បន្ទប់ ${nights} យប់`,
      qty: nights,
      amountUsd: round2(nights * stay.rateUsd),
    },
    ...stay.charges
      .filter((charge) => charge.qty > 0)
      .map((charge) => ({
        label: charge.label,
        labelKm: charge.labelKm,
        qty: charge.qty,
        amountUsd: round2(charge.unitUsd * charge.qty),
      })),
  ];
  const totalUsd = round2(lines.reduce((sum, line) => sum + line.amountUsd, 0));
  return { nights, lines, totalUsd };
}

export function todayIso(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Phnom_Penh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function formatKhr(amount: number): string {
  return `៛${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(amount))}`;
}

export function formatPretty(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(
    new Date(`${iso}T00:00:00`),
  );
}

export function formatPrettyKm(iso: string): string {
  return new Intl.DateTimeFormat("km-KH", { day: "numeric", month: "short" }).format(
    new Date(`${iso}T00:00:00`),
  );
}

export function invoiceNumber(roomNumber: string, when = new Date()): string {
  const stamp = todayIso(when).replaceAll("-", "");
  const hm = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Phnom_Penh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  })
    .format(when)
    .replaceAll(":", "");
  return `LC${stamp}${roomNumber}${hm}`;
}

export function liveInvoice(stay: Stay, room: Room, settings: Settings, when = new Date()): Invoice {
  const quote = quoteStay(stay);
  const no = invoiceNumber(room.number, when);
  const khqr = buildKhqr({
    bakongId: settings.bakongId,
    merchantName: settings.name,
    merchantCity: settings.city,
    amountUsd: quote.totalUsd,
    billNumber: no,
    storeLabel: `Room ${room.number}`,
    terminalLabel: "DESK",
  });
  return {
    no,
    issuedAt: when.toISOString(),
    nights: quote.nights,
    rateUsd: stay.rateUsd,
    lines: quote.lines,
    totalUsd: quote.totalUsd,
    totalKhr: usdToKhr(quote.totalUsd, settings.exchangeRate),
    exchangeRate: settings.exchangeRate,
    khqr,
  };
}
