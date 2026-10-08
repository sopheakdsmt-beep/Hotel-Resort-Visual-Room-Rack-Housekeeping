import { useEffect, useState } from "react";
import { formatPretty, formatUsd, todayIso } from "../folio";
import type { PrintJob } from "../print";
import { useHotel } from "../state";
import { InvoiceDoc } from "./Docs";

export function HistorySheet({ onClose, onPrint }: { onClose: () => void; onPrint: (job: PrintJob) => void }) {
  const { state } = useHotel();
  const [stayId, setStayId] = useState<string | null>(null);
  const closed = state.stays
    .filter((stay) => stay.status === "checkedout" && stay.invoice)
    .sort((a, b) => (b.closedAt ?? "").localeCompare(a.closedAt ?? ""))
    .slice(0, 20);
  const stay = closed.find((item) => item.id === stayId);
  const room = state.rooms.find((item) => item.id === stay?.roomId);

  useEffect(() => {
    if (stay) onPrint({ kind: "invoice", stayId: stay.id });
    else onPrint(null);
    return () => onPrint(null);
  }, [stay, onPrint]);

  return (
    <>
      <button type="button" className="backdrop" aria-label="Close folios" onClick={onClose} />
      <aside className="sheet" role="dialog" aria-modal="true" aria-labelledby="history-title">
        <header className="sheet-head">
          <div>
            <p className="kicker">Desk</p>
            <h2 id="history-title">{stay ? "Invoice" : "Recent folios"}</h2>
            <p lang="km">{stay ? "វិក្កយបត្រ" : "វិក្កយបត្រថ្មីៗ"}</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="sheet-body stack">
          {stay && room ? (
            <>
              <button type="button" className="btn btn-line" onClick={() => setStayId(null)}>
                Back · ត្រឡប់
              </button>
              <InvoiceDoc stay={stay} room={room} settings={state.settings} />
              <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                Print invoice · បោះពុម្ពវិក្កយបត្រ
              </button>
            </>
          ) : closed.length === 0 ? (
            <p className="help">Settled folios will gather here after the first checkout.</p>
          ) : (
            <div className="history-list">
              {closed.map((item) => {
                const itemRoom = state.rooms.find((roomItem) => roomItem.id === item.roomId);
                return (
                  <button key={item.id} type="button" onClick={() => setStayId(item.id)}>
                    <strong>
                      {itemRoom?.number} · {item.guestName}
                    </strong>
                    <span>
                      {item.closedAt ? formatPretty(todayIso(new Date(item.closedAt))) : ""} · {formatUsd(item.invoice?.totalUsd ?? 0)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
