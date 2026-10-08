import { useEffect, useState } from "react";
import { STATUS_META } from "../types";
import { useHotel } from "../state";
import type { PrintJob } from "../print";
import { CheckInForm } from "./CheckInForm";
import { FolioPanel } from "./FolioPanel";
import { RegistrationDoc } from "./Docs";

type RoomSheetProps = {
  roomId: string;
  onClose: () => void;
  onPrint: (job: PrintJob) => void;
  onFlash: (message: string) => void;
};

export function RoomSheet({ roomId, onClose, onPrint, onFlash }: RoomSheetProps) {
  const { state, dispatch } = useHotel();
  const [registeredId, setRegisteredId] = useState<string | null>(null);
  const [cardView, setCardView] = useState(false);
  const [note, setNote] = useState("");
  const room = state.rooms.find((item) => item.id === roomId);
  const stay = state.stays.find((item) => item.id === room?.stayId && item.status === "inhouse");
  const justRegistered = state.stays.find((item) => item.id === registeredId);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (justRegistered) onPrint({ kind: "registration", stayId: justRegistered.id });
    else if (stay && cardView) onPrint({ kind: "registration", stayId: stay.id });
    else if (stay) onPrint({ kind: "invoice", stayId: stay.id });
    else onPrint(null);
    return () => onPrint(null);
  }, [justRegistered, stay, cardView, onPrint]);

  if (!room) return null;

  return (
    <>
      <button type="button" className="backdrop" aria-label="Close room" onClick={onClose} />
      <aside className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <header className="sheet-head">
          <div>
            <p className="kicker">
              <span lang="km">{room.floorKm}</span> {room.floorEn}
            </p>
            <h2 id="sheet-title">{room.number}</h2>
            <p>
              <span lang="km">{room.typeKm}</span> · {room.type}
            </p>
          </div>
          <div className="sheet-head-side">
            <span className={`status-pill ${room.status}`}>
              <span lang="km">{STATUS_META[room.status].km}</span>
              {STATUS_META[room.status].en}
            </span>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </header>
        <div className="sheet-body">
          {justRegistered && room.status === "occupied" && (
            <div className="stack">
              <p className="banner">Checked in · ចុះឈ្មោះរួច</p>
              <RegistrationDoc stay={justRegistered} room={room} settings={state.settings} />
              <button type="button" className="btn btn-line" onClick={() => window.print()}>
                Print card · បោះពុម្ពប័ណ្ណ
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setRegisteredId(null)}>
                Open folio · បើកវិក្កយបត្រ
              </button>
            </div>
          )}
          {!justRegistered && stay && (
            <FolioPanel
              stay={stay}
              room={room}
              onView={(view) => setCardView(view === "registration")}
              onSettled={() => {
                onFlash(`Room ${room.number} is dirty · បន្ទប់ ${room.number} មិនទាន់សម្អាត`);
                onClose();
              }}
            />
          )}
          {!justRegistered && !stay && room.status === "clean" && (
            <CheckInForm
              room={room}
              onDone={(stayId) => {
                setRegisteredId(stayId);
                onFlash(`Room ${room.number} occupied · បន្ទប់ ${room.number} មានភ្ញៀវ`);
              }}
            />
          )}
          {!stay && (
            <section className="stack ops">
              <h3>
                <span lang="km">អនាម័យ</span> Housekeeping
              </h3>
              {room.maintNote && <p className="help">{room.maintNote}</p>}
              {room.status === "dirty" && (
                <button
                  type="button"
                  className="btn btn-primary"
                  data-testid={`clean-${room.number}`}
                  onClick={() => {
                    dispatch({ type: "setStatus", roomId: room.id, status: "clean" });
                    onFlash(`Room ${room.number} is clean · បន្ទប់ ${room.number} ស្អាតហើយ`);
                  }}
                >
                  <span lang="km">សម្អាតរួច</span>
                  Mark clean
                </button>
              )}
              {room.status === "maintenance" && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    dispatch({ type: "setStatus", roomId: room.id, status: "dirty" });
                    onFlash(`Room ${room.number} needs a clean · បន្ទប់ ${room.number} ត្រូវសម្អាត`);
                  }}
                >
                  <span lang="km">ជួសជុលរួច</span>
                  Repair done, needs clean
                </button>
              )}
              {room.status !== "maintenance" && (
                <>
                  <label className="field">
                    <span lang="km">កំណត់ចំណាំជួសជុល</span>
                    <span className="en">Maintenance note</span>
                    <input
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Leaking tap · ក្បាលម៉ាសីនលេច"
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn-line"
                    onClick={() => {
                      dispatch({
                        type: "setStatus",
                        roomId: room.id,
                        status: "maintenance",
                        maintNote: note,
                      });
                      onFlash(`Room ${room.number} is in maintenance · បន្ទប់ ${room.number} កំពុងជួសជុល`);
                    }}
                  >
                    Send to maintenance · ផ្ញើជួសជុល
                  </button>
                </>
              )}
              {room.status === "clean" && (
                <button
                  type="button"
                  className="btn btn-line"
                  onClick={() => {
                    dispatch({ type: "setStatus", roomId: room.id, status: "dirty" });
                    onFlash(`Room ${room.number} is dirty · បន្ទប់ ${room.number} មិនទាន់សម្អាត`);
                  }}
                >
                  Mark dirty · ដាក់ជាមិនទាន់សម្អាត
                </button>
              )}
            </section>
          )}
        </div>
      </aside>
    </>
  );
}
