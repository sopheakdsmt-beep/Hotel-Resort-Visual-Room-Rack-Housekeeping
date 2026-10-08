import { liveInvoice } from "./folio";
import { createDemoState } from "./seed";
import type { Charge, RoomStatus, Settings, State, Stay } from "./types";

export type Action =
  | { type: "checkin"; stay: Stay }
  | { type: "setCharge"; stayId: string; charge: Charge }
  | {
      type: "updateStay";
      stayId: string;
      patch: Partial<Pick<Stay, "checkOut" | "rateUsd" | "dnd" | "phone">>;
    }
  | { type: "checkout"; stayId: string }
  | {
      type: "setStatus";
      roomId: string;
      status: Exclude<RoomStatus, "occupied">;
      maintNote?: string;
    }
  | { type: "setRoomRate"; roomId: string; rateUsd: number }
  | { type: "updateSettings"; settings: Settings }
  | { type: "reset" };

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "checkin": {
      const room = state.rooms.find((item) => item.id === action.stay.roomId);
      if (!room || room.status !== "clean") return state;
      const guestName = action.stay.guestName.trim();
      if (!guestName) return state;
      if (state.stays.some((stay) => stay.id === action.stay.id)) return state;
      const stay: Stay = {
        ...action.stay,
        guestName,
        status: "inhouse",
        charges: action.stay.charges ?? [],
        dnd: false,
        invoice: undefined,
        closedAt: undefined,
      };
      return {
        ...state,
        rooms: state.rooms.map((item) =>
          item.id === room.id ? { ...item, status: "occupied", stayId: stay.id } : item,
        ),
        stays: [stay, ...state.stays],
      };
    }
    case "setCharge": {
      return {
        ...state,
        stays: state.stays.map((stay) => {
          if (stay.id !== action.stayId || stay.status !== "inhouse") return stay;
          const index = stay.charges.findIndex((charge) => charge.id === action.charge.id);
          if (action.charge.qty <= 0) {
            if (index < 0) return stay;
            return { ...stay, charges: stay.charges.filter((charge) => charge.id !== action.charge.id) };
          }
          if (index < 0) return { ...stay, charges: [...stay.charges, action.charge] };
          const charges = stay.charges.slice();
          charges[index] = action.charge;
          return { ...stay, charges };
        }),
      };
    }
    case "updateStay": {
      return {
        ...state,
        stays: state.stays.map((stay) => {
          if (stay.id !== action.stayId || stay.status !== "inhouse") return stay;
          const next = { ...stay, ...action.patch };
          if (next.checkOut < next.checkIn) return stay;
          if (!Number.isFinite(next.rateUsd) || next.rateUsd <= 0) return stay;
          return next;
        }),
      };
    }
    case "checkout": {
      const stay = state.stays.find((item) => item.id === action.stayId && item.status === "inhouse");
      if (!stay) return state;
      const room = state.rooms.find((item) => item.id === stay.roomId);
      if (!room) return state;
      const issuedAt = new Date().toISOString();
      let invoice = stay.invoice;
      try {
        invoice = liveInvoice(stay, room, state.settings);
      } catch {
        invoice = stay.invoice;
      }
      return {
        ...state,
        rooms: state.rooms.map((item) =>
          item.id === room.id
            ? { ...item, status: "dirty", stayId: undefined, maintNote: undefined }
            : item,
        ),
        stays: state.stays.map((item) =>
          item.id === stay.id ? { ...item, status: "checkedout", closedAt: issuedAt, invoice } : item,
        ),
      };
    }
    case "setStatus": {
      const room = state.rooms.find((item) => item.id === action.roomId);
      if (!room) return state;
      const live = state.stays.some((stay) => stay.id === room.stayId && stay.status === "inhouse");
      if (live) return state;
      return {
        ...state,
        rooms: state.rooms.map((item) =>
          item.id === room.id
            ? {
                ...item,
                status: action.status,
                stayId: undefined,
                maintNote:
                  action.status === "maintenance"
                    ? action.maintNote?.trim() || "Maintenance"
                    : undefined,
              }
            : item,
        ),
      };
    }
    case "setRoomRate": {
      if (!Number.isFinite(action.rateUsd) || action.rateUsd <= 0) return state;
      return {
        ...state,
        rooms: state.rooms.map((room) =>
          room.id === action.roomId ? { ...room, rateUsd: action.rateUsd } : room,
        ),
      };
    }
    case "updateSettings":
      return { ...state, settings: action.settings };
    case "reset":
      return createDemoState();
    default:
      return state;
  }
}
