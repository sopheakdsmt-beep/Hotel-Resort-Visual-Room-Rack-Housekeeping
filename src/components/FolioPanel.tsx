import { useEffect, useState } from "react";
import { LAUNDRY, MINIBAR, type CatalogItem } from "../catalog";
import { formatKhr, formatUsd } from "../folio";
import { useHotel } from "../state";
import type { Charge, Room, Stay } from "../types";
import { InvoiceDoc, RegistrationDoc, useInvoice } from "./Docs";

type FolioPanelProps = {
  stay: Stay;
  room: Room;
  onView: (view: "invoice" | "registration") => void;
  onSettled: () => void;
};

export function FolioPanel({ stay, room, onView, onSettled }: FolioPanelProps) {
  const { state, dispatch } = useHotel();
  const [view, setView] = useState<"folio" | "card">("folio");
  const [confirming, setConfirming] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const { invoice, error } = useInvoice(stay, room, state.settings);

  useEffect(() => {
    onView(view === "card" ? "registration" : "invoice");
  }, [view, onView]);

  function setQty(item: CatalogItem, kind: Charge["kind"], qty: number) {
    dispatch({
      type: "setCharge",
      stayId: stay.id,
      charge: {
        id: item.id,
        kind,
        label: item.label,
        labelKm: item.labelKm,
        unitUsd: item.unitUsd,
        qty,
      },
    });
    setConfirming(false);
  }

  function addCustom() {
    const unitUsd = Number(customAmount);
    if (!customLabel.trim() || !Number.isFinite(unitUsd) || unitUsd <= 0) return;
    dispatch({
      type: "setCharge",
      stayId: stay.id,
      charge: {
        id: crypto.randomUUID(),
        kind: "other",
        label: customLabel.trim(),
        labelKm: customLabel.trim(),
        unitUsd,
        qty: 1,
      },
    });
    setCustomLabel("");
    setCustomAmount("");
    setConfirming(false);
  }

  return (
    <div className="folio">
    <div className="folio-scroll stack">
      <div className="guest-block">
        <strong>{stay.guestName}</strong>
        <span>
          {stay.nationality} · {stay.passportNo}
        </span>
        {stay.vehiclePlate && <span>Plate {stay.vehiclePlate}</span>}
        {!stay.passportImage && <span className="due-flag">Passport snap still open · មិនទាន់មានរូបលិខិតឆ្លងដែន</span>}
        {stay.passportImage && <img className="thumb" src={stay.passportImage} alt="Passport" />}
      </div>
      <div className="view-switch">
        <button type="button" className={view === "folio" ? "mode on" : "mode"} onClick={() => setView("folio")}>
          Folio · វិក្កយបត្រ
        </button>
        <button type="button" className={view === "card" ? "mode on" : "mode"} onClick={() => setView("card")}>
          Registration · ប័ណ្ណ
        </button>
      </div>
      {view === "card" ? (
        <>
          <RegistrationDoc stay={stay} room={room} settings={state.settings} />
          <button type="button" className="btn btn-line" onClick={() => window.print()}>
            Print card · បោះពុម្ពប័ណ្ណ
          </button>
        </>
      ) : (
        <>
          <div className="cols">
            <label className="field">
              <span lang="km">ថ្ងៃចេញ</span>
              <span className="en">Departure</span>
              <input
                type="date"
                value={stay.checkOut}
                min={stay.checkIn}
                onChange={(event) =>
                  dispatch({ type: "updateStay", stayId: stay.id, patch: { checkOut: event.target.value } })
                }
              />
            </label>
            <label className="field">
              <span lang="km">តម្លៃយប់</span>
              <span className="en">Nightly USD</span>
              <input
                type="number"
                min="1"
                step="0.5"
                value={stay.rateUsd}
                onChange={(event) =>
                  dispatch({
                    type: "updateStay",
                    stayId: stay.id,
                    patch: { rateUsd: Number(event.target.value) },
                  })
                }
              />
            </label>
          </div>
          <button
            type="button"
            className={stay.dnd ? "btn btn-gold" : "btn btn-line"}
            aria-pressed={stay.dnd}
            onClick={() => dispatch({ type: "updateStay", stayId: stay.id, patch: { dnd: !stay.dnd } })}
          >
            {stay.dnd ? "Do not disturb is on · កុំរំខាន" : "Set do not disturb · សូមកុំរំខាន"}
          </button>
          <Catalog title="Minibar" titleKm="មីនីបារ" items={MINIBAR} kind="minibar" stay={stay} onQty={setQty} />
          <Catalog title="Laundry" titleKm="បោកអ៊ុត" items={LAUNDRY} kind="laundry" stay={stay} onQty={setQty} />
          <div className="stack">
            <h3>
              <span lang="km">ថ្លៃផ្សេង</span> Other charge
            </h3>
            <div className="cols">
              <input
                value={customLabel}
                placeholder="Description"
                aria-label="Custom charge description"
                onChange={(event) => setCustomLabel(event.target.value)}
              />
              <input
                value={customAmount}
                placeholder="USD"
                inputMode="decimal"
                aria-label="Custom charge amount"
                onChange={(event) => setCustomAmount(event.target.value)}
              />
            </div>
            <button type="button" className="btn btn-line" onClick={addCustom}>
              Add charge · បន្ថែម
            </button>
            {stay.charges
              .filter((charge) => charge.kind === "other")
              .map((charge) => (
                <div key={charge.id} className="catalog-item">
                  <div>
                    <strong>{charge.label}</strong>
                    <span>{formatUsd(charge.unitUsd * charge.qty)}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-line"
                    onClick={() => dispatch({ type: "setCharge", stayId: stay.id, charge: { ...charge, qty: 0 } })}
                  >
                    Remove
                  </button>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
      {view === "folio" && (
        <div className="settle">
          <InvoiceDoc stay={stay} room={room} settings={state.settings} variant="slip" />
          <div className="settle-actions">
            <button type="button" className="btn btn-line" onClick={() => window.print()}>
              Print invoice · បោះពុម្ពវិក្កយបត្រ
            </button>
            <button
              type="button"
              className="btn btn-danger"
              data-testid="checkout"
              onClick={() => {
                if (!confirming) {
                  setConfirming(true);
                  return;
                }
                dispatch({ type: "checkout", stayId: stay.id });
                onSettled();
              }}
            >
              {confirming ? "Confirm payment · បញ្ជាក់ការទូទាត់" : "Complete checkout · បញ្ចប់ការចេញ"}
            </button>
          </div>
          <p className="help" data-testid="folio-total">
            {invoice
              ? `Checkout marks the room dirty · ${formatUsd(invoice.totalUsd)} · ${formatKhr(invoice.totalKhr)}`
              : error}
          </p>
        </div>
      )}
    </div>
  );
}

function Catalog({
  title,
  titleKm,
  items,
  kind,
  stay,
  onQty,
}: {
  title: string;
  titleKm: string;
  items: CatalogItem[];
  kind: Charge["kind"];
  stay: Stay;
  onQty: (item: CatalogItem, kind: Charge["kind"], qty: number) => void;
}) {
  return (
    <section className="stack">
      <h3>
        <span lang="km">{titleKm}</span> {title}
      </h3>
      <div className="catalog">
        {items.map((item) => {
          const qty = stay.charges.find((charge) => charge.id === item.id)?.qty ?? 0;
          return (
            <div key={item.id} className="catalog-item">
              <div>
                <strong>{item.label}</strong>
                <span lang="km">{item.labelKm}</span>
                <span>{formatUsd(item.unitUsd)}</span>
              </div>
              <div className="stepper">
                <button type="button" aria-label={`Decrease ${item.label}`} disabled={qty === 0} onClick={() => onQty(item, kind, qty - 1)}>
                  −
                </button>
                <span>{qty}</span>
                <button type="button" aria-label={`Increase ${item.label}`} onClick={() => onQty(item, kind, qty + 1)}>
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
