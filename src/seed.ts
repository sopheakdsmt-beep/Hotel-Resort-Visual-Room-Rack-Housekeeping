import { liveInvoice, todayIso, addDays } from "./folio";
import type { Charge, Room, Settings, State, Stay } from "./types";

export const DEMO_SETTINGS: Settings = {
  name: "Lotus Court",
  nameKm: "សណ្ឋាគារលំអងផ្កាឈូក",
  city: "Siem Reap",
  cityKm: "សៀមរាប",
  address: "Sala Kamreuk",
  phone: "+855 63 555 0140",
  bakongId: "lotuscourt@aba",
  exchangeRate: 4100,
};

type RoomDraft = {
  number: string;
  floor: number;
  floorEn: string;
  floorKm: string;
  type: string;
  typeKm: string;
  rateUsd: number;
  status: Room["status"];
  maintNote?: string;
};

function draft(
  number: string,
  floor: number,
  floorEn: string,
  floorKm: string,
  type: string,
  typeKm: string,
  rateUsd: number,
  status: Room["status"],
  maintNote?: string,
): RoomDraft {
  return { number, floor, floorEn, floorKm, type, typeKm, rateUsd, status, maintNote };
}

const GARDEN = ["Garden double", "បន្ទប់សួន", 38] as const;
const POOL = ["Pool view", "បន្ទប់មើលអាង", 62] as const;
const SUITE = ["Family suite", "ស្វីតគ្រួសារ", 95] as const;
const VILLA = ["Lotus villa", "វីឡាផ្កាឈូក", 140] as const;

function row(
  numbers: string[],
  floor: number,
  floorEn: string,
  floorKm: string,
  kind: readonly [string, string, number],
  statusFor: (number: string) => Room["status"],
  noteFor?: (number: string) => string | undefined,
): RoomDraft[] {
  return numbers.map((number) =>
    draft(number, floor, floorEn, floorKm, kind[0], kind[1], kind[2], statusFor(number), noteFor?.(number)),
  );
}

const DRAFTS: RoomDraft[] = [
  ...row(
    ["101", "102", "103", "104", "105", "106", "107", "108", "109", "110"],
    1,
    "Garden",
    "សួន",
    GARDEN,
    (number) => {
      if (["101", "102", "104", "107"].includes(number)) return "occupied";
      if (["103", "105"].includes(number)) return "dirty";
      if (number === "106") return "maintenance";
      return "clean";
    },
    (number) => (number === "106" ? "Air conditioner · ម៉ាស៊ីនត្រជាក់" : undefined),
  ),
  ...row(
    ["201", "202", "203", "204", "205", "206", "207", "208"],
    2,
    "Pool",
    "អាង",
    POOL,
    (number) => {
      if (["201", "203", "206"].includes(number)) return "occupied";
      if (["202", "204"].includes(number)) return "dirty";
      if (number === "207") return "maintenance";
      return "clean";
    },
    (number) => (number === "207" ? "Leaking tap · ក្បាលម៉ាសីនលេច" : undefined),
  ),
  ...row(["301", "302", "303", "304"], 3, "Suites", "ស្វីត", SUITE, (number) => {
    if (number === "301") return "occupied";
    if (number === "302") return "dirty";
    return "clean";
  }),
  ...row(["V1", "V2"], 4, "Villas", "វីឡា", VILLA, (number) => (number === "V1" ? "occupied" : "clean")),
];

type GuestSeed = {
  roomNumber: string;
  guestName: string;
  nationality: string;
  passportNo: string;
  dateOfBirth: string;
  phone: string;
  vehiclePlate: string;
  checkInOffset: number;
  checkOutOffset: number;
  dnd?: boolean;
  charges?: Charge[];
};

const INHOUSE: GuestSeed[] = [
  {
    roomNumber: "101",
    guestName: "Chan Dara",
    nationality: "Cambodia",
    passportNo: "N01020304",
    dateOfBirth: "1992-06-18",
    phone: "012 555 210",
    vehiclePlate: "2AB-4521",
    checkInOffset: -1,
    checkOutOffset: 2,
    charges: [
      { id: "beer", kind: "minibar", label: "Angkor beer", labelKm: "ស្រាបៀរអង្គរ", unitUsd: 2, qty: 2 },
      { id: "shirt", kind: "laundry", label: "Shirt", labelKm: "អាវ", unitUsd: 2, qty: 1 },
    ],
  },
  {
    roomNumber: "102",
    guestName: "Camille Laurent",
    nationality: "France",
    passportNo: "21FV88421",
    dateOfBirth: "1988-03-02",
    phone: "+33 6 12 44 90 10",
    vehiclePlate: "",
    checkInOffset: -2,
    checkOutOffset: 0,
  },
  {
    roomNumber: "104",
    guestName: "Park Minji",
    nationality: "Korea",
    passportNo: "M8829103",
    dateOfBirth: "1996-11-09",
    phone: "+82 10 5555 0133",
    vehiclePlate: "",
    checkInOffset: -1,
    checkOutOffset: 1,
  },
  {
    roomNumber: "107",
    guestName: "John Ellis",
    nationality: "Australia",
    passportNo: "PA4421981",
    dateOfBirth: "1981-01-27",
    phone: "+61 412 000 448",
    vehiclePlate: "",
    checkInOffset: 0,
    checkOutOffset: 3,
  },
  {
    roomNumber: "201",
    guestName: "Li Wei",
    nationality: "China",
    passportNo: "E39281044",
    dateOfBirth: "1990-08-14",
    phone: "+86 138 0000 2211",
    vehiclePlate: "",
    checkInOffset: -2,
    checkOutOffset: 1,
    dnd: true,
  },
  {
    roomNumber: "203",
    guestName: "Sokha Meas",
    nationality: "Cambodia",
    passportNo: "N9988771",
    dateOfBirth: "1985-12-01",
    phone: "017 222 908",
    vehiclePlate: "1A-2290",
    checkInOffset: -3,
    checkOutOffset: 1,
  },
  {
    roomNumber: "206",
    guestName: "Emma Rossi",
    nationality: "France",
    passportNo: "22FR19002",
    dateOfBirth: "1994-05-21",
    phone: "+33 6 70 11 22 33",
    vehiclePlate: "",
    checkInOffset: 0,
    checkOutOffset: 2,
  },
  {
    roomNumber: "301",
    guestName: "The Nakamura family",
    nationality: "Japan",
    passportNo: "TS4412098",
    dateOfBirth: "1979-09-30",
    phone: "+81 90 1111 2223",
    vehiclePlate: "",
    checkInOffset: -1,
    checkOutOffset: 2,
    charges: [{ id: "shirt", kind: "laundry", label: "Shirt", labelKm: "អាវ", unitUsd: 2, qty: 3 }],
  },
  {
    roomNumber: "V1",
    guestName: "Claire Dubois",
    nationality: "France",
    passportNo: "18FD66210",
    dateOfBirth: "1983-02-11",
    phone: "+33 6 18 44 20 09",
    vehiclePlate: "1CD-9088",
    checkInOffset: -1,
    checkOutOffset: 1,
    charges: [{ id: "wine", kind: "minibar", label: "House wine", labelKm: "ស្រាផ្ទះ", unitUsd: 12, qty: 1 }],
  },
];

function toStay(seed: GuestSeed, room: Room, today: string, id: string): Stay {
  return {
    id,
    roomId: room.id,
    guestName: seed.guestName,
    nationality: seed.nationality,
    passportNo: seed.passportNo,
    dateOfBirth: seed.dateOfBirth,
    phone: seed.phone,
    vehiclePlate: seed.vehiclePlate,
    checkIn: addDays(today, seed.checkInOffset),
    checkOut: addDays(today, seed.checkOutOffset),
    rateUsd: room.rateUsd,
    charges: seed.charges ?? [],
    dnd: Boolean(seed.dnd),
    status: "inhouse",
  };
}

export function createDemoState(now = new Date()): State {
  const today = todayIso(now);
  const rooms: Room[] = DRAFTS.map((item) => ({
    id: item.number,
    number: item.number,
    floor: item.floor,
    floorEn: item.floorEn,
    floorKm: item.floorKm,
    type: item.type,
    typeKm: item.typeKm,
    status: item.status,
    rateUsd: item.rateUsd,
    maintNote: item.maintNote,
  }));

  const stays: Stay[] = INHOUSE.map((seed) => {
    const room = rooms.find((item) => item.number === seed.roomNumber);
    if (!room) throw new Error(`Missing room ${seed.roomNumber}`);
    const stay = toStay(seed, room, today, `stay-${room.number}`);
    room.stayId = stay.id;
    return stay;
  });

  const departedRoom = rooms.find((room) => room.number === "103");
  if (!departedRoom) throw new Error("Missing room 103");
  const departed: Stay = {
    id: "stay-103-prev",
    roomId: departedRoom.id,
    guestName: "Hiroshi Tanaka",
    nationality: "Japan",
    passportNo: "TZ2201984",
    dateOfBirth: "1976-04-04",
    phone: "+81 80 3333 1212",
    vehiclePlate: "",
    checkIn: addDays(today, -2),
    checkOut: today,
    rateUsd: departedRoom.rateUsd,
    charges: [],
    dnd: false,
    status: "checkedout",
    closedAt: now.toISOString(),
  };
  departed.invoice = liveInvoice(departed, departedRoom, DEMO_SETTINGS, now);
  stays.push(departed);

  return {
    version: 1,
    settings: DEMO_SETTINGS,
    rooms,
    stays,
  };
}
