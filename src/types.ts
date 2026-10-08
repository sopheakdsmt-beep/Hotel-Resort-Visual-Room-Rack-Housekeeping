export type RoomStatus = "occupied" | "clean" | "dirty" | "maintenance";

export const STATUS_META: Record<
  RoomStatus,
  { en: string; km: string; shortKm: string }
> = {
  occupied: { en: "Occupied", km: "មានភ្ញៀវ", shortKm: "មានភ្ញៀវ" },
  clean: { en: "Vacant clean", km: "ទំនេរ-ស្អាត", shortKm: "ស្អាត" },
  dirty: { en: "Dirty", km: "មិនទាន់សម្អាត", shortKm: "មិនស្អាត" },
  maintenance: { en: "Maintenance", km: "កំពុងជួសជុល", shortKm: "ជួសជុល" },
};

export type Settings = {
  name: string;
  nameKm: string;
  city: string;
  cityKm: string;
  address: string;
  phone: string;
  bakongId: string;
  exchangeRate: number;
};

export type Charge = {
  id: string;
  kind: "minibar" | "laundry" | "other";
  label: string;
  labelKm: string;
  unitUsd: number;
  qty: number;
};

export type InvoiceLine = {
  label: string;
  labelKm: string;
  qty: number;
  amountUsd: number;
};

export type Invoice = {
  no: string;
  issuedAt: string;
  nights: number;
  rateUsd: number;
  lines: InvoiceLine[];
  totalUsd: number;
  totalKhr: number;
  exchangeRate: number;
  khqr: string;
};

export type Stay = {
  id: string;
  roomId: string;
  guestName: string;
  nationality: string;
  passportNo: string;
  dateOfBirth: string;
  phone: string;
  vehiclePlate: string;
  passportImage?: string;
  plateImage?: string;
  signature?: string;
  checkIn: string;
  checkOut: string;
  rateUsd: number;
  charges: Charge[];
  dnd: boolean;
  status: "inhouse" | "checkedout";
  closedAt?: string;
  invoice?: Invoice;
};

export type Room = {
  id: string;
  number: string;
  floor: number;
  floorEn: string;
  floorKm: string;
  type: string;
  typeKm: string;
  status: RoomStatus;
  rateUsd: number;
  stayId?: string;
  maintNote?: string;
};

export type State = {
  version: 1;
  settings: Settings;
  rooms: Room[];
  stays: Stay[];
};
