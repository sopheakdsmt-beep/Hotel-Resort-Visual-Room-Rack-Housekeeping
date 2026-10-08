import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HistorySheet } from "./components/HistorySheet";
import { InvoiceDoc, RegistrationDoc } from "./components/Docs";
import { RoomSheet } from "./components/RoomSheet";
import { SettingsSheet } from "./components/SettingsSheet";
import { nightsBetween, stayDay, todayIso } from "./folio";
import type { PrintJob } from "./print";
import { useHotel } from "./state";
import { STATUS_META, type Room, type RoomStatus } from "./types";

type Panel = { type: "room"; id: string } | { type: "settings" } | { type: "history" } | null;
type Mode = "rack" | "housekeeping";

function LotusMark() {
  return (
    <svg className="mark" viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="14" fill="#e7c56a" />
      <path
        d="M24 36c-7-6-9-13-9-18 4.2 2.4 6.6 6.4 9 11 2.4-4.6 4.8-8.6 9-11 0 5-2 12-9 18z"
        fill="#241e18"
      />
      <path d="M24 33c-2.2-5.2-1.2-11 .2-15.2 1.2 4.2 2.2 10 0 15.2z" fill="#f7f3eb" />
    </svg>
  );
}

function clockParts(now: Date) {
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Phnom_Penh",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  const en = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Phnom_Penh",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(now);
  const km = new Intl.DateTimeFormat("km-KH", {
    timeZone: "Asia/Phnom_Penh",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
  return { time, en, km };
}

export function App() {
  const { state, dispatch, storageWarning } = useHotel();
  const [now, setNow] = useState(() => new Date());
  const [mode, setMode] = useState<Mode>("rack");
  const [filter, setFilter] = useState<RoomStatus | "all">("all");
  const [floor, setFloor] = useState<number | "all">("all");
  const [query, setQuery] = useState("");
  const [panel, setPanel] = useState<Panel>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [awake, setAwake] = useState(false);
  const [printJob, setPrintJob] = useState<PrintJob>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const today = todayIso(now);
  const clock = clockParts(now);

  const flash = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const onPrint = useCallback((job: PrintJob) => {
    setPrintJob(job);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    document.title = `${state.settings.name} · តារាងបន្ទប់`;
  }, [state.settings.name]);

  useEffect(() => {
    let released = false;
    let current: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> };
    };
    async function request() {
      if (!nav.wakeLock || document.visibilityState !== "visible") return;
      try {
        current = await nav.wakeLock.request("screen");
        if (!released) setAwake(true);
      } catch {
        if (!released) setAwake(false);
      }
    }
    const onVisible = () => void request();
    void request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisible);
      void current?.release();
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (event.key === "/" && target && target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const counts = useMemo(() => {
    const tally: Record<RoomStatus, number> = { occupied: 0, clean: 0, dirty: 0, maintenance: 0 };
    for (const room of state.rooms) tally[room.status] += 1;
    return tally;
  }, [state.rooms]);

  const floors = useMemo(
    () => [...new Set(state.rooms.map((room) => room.floor))].sort((a, b) => a - b),
    [state.rooms],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return state.rooms.filter((room) => {
      if (filter !== "all" && room.status !== filter) return false;
      if (floor !== "all" && room.floor !== floor) return false;
      if (!needle) return true;
      const guest = state.stays.find((stay) => stay.id === room.stayId);
      return (
        room.number.toLowerCase().includes(needle) ||
        guest?.guestName.toLowerCase().includes(needle) ||
        guest?.vehiclePlate.toLowerCase().includes(needle)
      );
    });
  }, [state.rooms, state.stays, filter, floor, query]);

  const sections = useMemo(() => {
    if (mode === "housekeeping") {
      const rank: Record<RoomStatus, number> = { dirty: 0, maintenance: 1, occupied: 2, clean: 3 };
      const todo = visible
        .filter((room) => room.status === "dirty" || room.status === "maintenance")
        .sort((a, b) => rank[a.status] - rank[b.status] || a.number.localeCompare(b.number, undefined, { numeric: true }));
      const rest = visible
        .filter((room) => room.status !== "dirty" && room.status !== "maintenance")
        .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
      return [
        { id: "todo", title: "To clean", titleKm: "ត្រូវសម្អាត", rooms: todo },
        { id: "rest", title: "Rest of house", titleKm: "បន្ទប់ដទៃ", rooms: rest },
      ].filter((section) => section.rooms.length > 0);
    }
    return floors
      .map((level) => {
        const sample = state.rooms.find((room) => room.floor === level);
        return {
          id: String(level),
          title: sample?.floorEn ?? `Floor ${level}`,
          titleKm: sample?.floorKm ?? "",
          rooms: visible
            .filter((room) => room.floor === level)
            .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })),
        };
      })
      .filter((section) => section.rooms.length > 0);
  }, [mode, visible, floors, state.rooms]);

  const movements = useMemo(() => {
    return state.stays
      .filter((stay) => stay.status === "inhouse" && (stay.checkIn === today || stay.checkOut === today))
      .map((stay) => ({
        stay,
        room: state.rooms.find((room) => room.id === stay.roomId),
        kind: stay.checkOut === today ? "out" : "in",
      }))
      .filter((item) => item.room);
  }, [state.stays, state.rooms, today]);

  const printStay = printJob ? state.stays.find((stay) => stay.id === printJob.stayId) : undefined;
  const printRoom = printStay ? state.rooms.find((room) => room.id === printStay.roomId) : undefined;

  return (
    <>
      <div className="app">
        <header className="head">
          <div className="brand">
            <LotusMark />
            <div>
              <p className="brand-km" lang="km">
                {state.settings.nameKm}
              </p>
              <h1>{state.settings.name}</h1>
              <p className="brand-sub">
                <span lang="km">{clock.km}</span>
                <span>
                  {clock.en} · {state.settings.cityKm} {state.settings.city}
                </span>
              </p>
            </div>
          </div>
          <div className="clock-block">
            <p className="clock">{clock.time}</p>
            {awake && (
              <p className="awake">
                Screen awake · <span lang="km">អេក្រង់មិនរលត់</span>
              </p>
            )}
          </div>
          <div className="occ">
            <p>
              <strong>{counts.occupied}</strong>
              <span> / {state.rooms.length}</span>
            </p>
            <p lang="km">មានភ្ញៀវ</p>
            <div className="mix" aria-hidden="true">
              {(Object.keys(counts) as RoomStatus[]).map((status) =>
                counts[status] > 0 ? <i key={status} className={status} style={{ flex: counts[status] }} /> : null,
              )}
            </div>
          </div>
        </header>
        <div className="toolbar">
          <div className="modes" role="tablist" aria-label="Desk mode">
            <button type="button" className={mode === "rack" ? "mode on" : "mode"} onClick={() => setMode("rack")}>
              <span lang="km">តារាងបន្ទប់</span>
              Room rack
            </button>
            <button
              type="button"
              className={mode === "housekeeping" ? "mode on" : "mode"}
              onClick={() => setMode("housekeeping")}
            >
              <span lang="km">អនាម័យ</span>
              Housekeeping
            </button>
          </div>
          <div className="filters" role="toolbar" aria-label="Room filters">
            <button type="button" className={filter === "all" ? "chip on" : "chip"} onClick={() => setFilter("all")}>
              All {state.rooms.length}
            </button>
            {(Object.keys(STATUS_META) as RoomStatus[]).map((status) => (
              <button
                key={status}
                type="button"
                className={filter === status ? `chip on ${status}` : `chip ${status}`}
                aria-pressed={filter === status}
                onClick={() => setFilter(filter === status ? "all" : status)}
              >
                <i />
                <span lang="km">{STATUS_META[status].km}</span>
                <span>{counts[status]}</span>
              </button>
            ))}
            <button type="button" className={floor === "all" ? "chip on" : "chip"} onClick={() => setFloor("all")}>
              All floors
            </button>
            {floors.map((level) => {
              const sample = state.rooms.find((room) => room.floor === level);
              return (
                <button
                  key={level}
                  type="button"
                  className={floor === level ? "chip on" : "chip"}
                  onClick={() => setFloor(floor === level ? "all" : level)}
                >
                  <span lang="km">{sample?.floorKm}</span> {sample?.floorEn}
                </button>
              );
            })}
          </div>
          <div className="toolbar-end">
            <input
              ref={searchRef}
              className="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Room or guest · បន្ទប់ / ភ្ញៀវ"
              aria-label="Search rooms or guests"
            />
            <button type="button" className="icon-btn dark" onClick={() => setPanel({ type: "history" })}>
              Folios
            </button>
            <button type="button" className="icon-btn dark" onClick={() => setPanel({ type: "settings" })}>
              Settings
            </button>
          </div>
        </div>
        {storageWarning && (
          <p className="warn">Free a little space on this tablet so the next passport photo can be saved.</p>
        )}
        <main className={`rack-scroll ${mode}`}>
          {mode === "housekeeping" && (
            <p className="mode-note">
              Dirty rooms are listed first. Mark each one when the clean is finished. ·{" "}
              <span lang="km">បន្ទប់មិនទាន់សម្អាតនៅខាងលើ ចុចពេលសម្អាតរួច</span>
            </p>
          )}
          {movements.length > 0 && mode === "rack" && (
            <div className="movers">
              {movements.map(({ stay, room, kind }) => (
                <button key={stay.id} type="button" className={`mover ${kind}`} onClick={() => setPanel({ type: "room", id: stay.roomId })}>
                  <span lang="km">{kind === "out" ? "ចេញថ្ងៃនេះ" : "ចូលថ្ងៃនេះ"}</span>
                  <strong>{room?.number}</strong>
                  <span>{stay.guestName}</span>
                </button>
              ))}
            </div>
          )}
          {sections.length === 0 && <p className="empty">No rooms match this filter.</p>}
          {sections.map((section) => (
            <section key={section.id} className="floor">
              <h2 className="floor-label">
                <span lang="km">{section.titleKm}</span>
                {section.title}
                <em>{section.rooms.length}</em>
              </h2>
              <div className={mode === "housekeeping" ? "grid house" : "grid"}>
                {section.rooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    today={today}
                    mode={mode}
                    selected={panel?.type === "room" && panel.id === room.id}
                    guestName={state.stays.find((stay) => stay.id === room.stayId)?.guestName}
                    stay={state.stays.find((stay) => stay.id === room.stayId && stay.status === "inhouse")}
                    onOpen={() => setPanel({ type: "room", id: room.id })}
                    onClean={() => {
                      dispatch({ type: "setStatus", roomId: room.id, status: "clean" });
                      flash(`Room ${room.number} is clean · បន្ទប់ ${room.number} ស្អាតហើយ`);
                    }}
                    onRepaired={() => {
                      dispatch({ type: "setStatus", roomId: room.id, status: "dirty" });
                      flash(`Room ${room.number} needs a clean · បន្ទប់ ${room.number} ត្រូវសម្អាត`);
                    }}
                  />
                ))}
              </div>
            </section>
          ))}
        </main>
        {panel?.type === "room" && (
          <RoomSheet roomId={panel.id} onClose={() => setPanel(null)} onPrint={onPrint} onFlash={flash} />
        )}
        {panel?.type === "settings" && <SettingsSheet onClose={() => setPanel(null)} onFlash={flash} />}
        {panel?.type === "history" && <HistorySheet onClose={() => setPanel(null)} onPrint={onPrint} />}
        {toast && (
          <div className="toast" role="status">
            {toast}
          </div>
        )}
      </div>
      {printJob && printStay && printRoom && (
        <div className="print-root">
          {printJob.kind === "invoice" ? (
            <InvoiceDoc stay={printStay} room={printRoom} settings={state.settings} />
          ) : (
            <RegistrationDoc stay={printStay} room={printRoom} settings={state.settings} />
          )}
        </div>
      )}
    </>
  );
}

function RoomCard({
  room,
  today,
  mode,
  selected,
  guestName,
  stay,
  onOpen,
  onClean,
  onRepaired,
}: {
  room: Room;
  today: string;
  mode: Mode;
  selected: boolean;
  guestName?: string;
  stay?: { guestName: string; checkIn: string; checkOut: string; dnd: boolean; passportImage?: string };
  onOpen: () => void;
  onClean: () => void;
  onRepaired: () => void;
}) {
  const due = stay?.checkOut === today;
  const nights = stay ? nightsBetween(stay.checkIn, stay.checkOut) : 0;
  const day = stay ? Math.min(stayDay(stay.checkIn, today), nights) : 0;
  return (
    <article className={`room ${room.status} ${selected ? "selected" : ""} ${due ? "due" : ""}`}>
      <button type="button" className="room-open" data-testid={`room-${room.number}`} onClick={onOpen}>
        <span className={`band ${room.status}`}>
          <span lang="km">{STATUS_META[room.status].shortKm}</span>
          <span>{STATUS_META[room.status].en}</span>
        </span>
        <span className="room-body">
          <span className="room-no">{room.number}</span>
          <span className="room-type">
            <span lang="km">{room.typeKm}</span>
            {room.type}
          </span>
          {stay && <span className="guest-line">{guestName}</span>}
          {stay && (
            <span className="guest-line muted">
              Night {day}/{nights} · {stay.checkOut === today ? "departs today" : `out ${stay.checkOut.slice(5)}`}
            </span>
          )}
          {room.maintNote && <span className="guest-line">{room.maintNote}</span>}
          {stay?.dnd && <span className="dnd">DND · សូមកុំរំខាន</span>}
          {due && (
            <span className="due-flag">
              Due out · <span lang="km">ចេញថ្ងៃនេះ</span>
            </span>
          )}
        </span>
      </button>
      {mode === "housekeeping" && room.status === "dirty" && (
        <button type="button" className="card-action" data-testid={`quick-clean-${room.number}`} onClick={onClean}>
          <span lang="km">សម្អាតរួច</span>
          Mark clean
        </button>
      )}
      {mode === "housekeeping" && room.status === "maintenance" && (
        <button type="button" className="card-action" onClick={onRepaired}>
          <span lang="km">ជួសជុលរួច</span>
          Repair done
        </button>
      )}
    </article>
  );
}
