import { useState } from "react";
import { useHotel } from "../state";
import type { Settings } from "../types";

export function SettingsSheet({ onClose, onFlash }: { onClose: () => void; onFlash: (message: string) => void }) {
  const { state, dispatch } = useHotel();
  const [draft, setDraft] = useState<Settings>(state.settings);
  const [error, setError] = useState<string | null>(null);

  function save() {
    const exchangeRate = Number(draft.exchangeRate);
    const bakongId = draft.bakongId.trim().toLowerCase();
    if (!/^[\w.-]+@[\w.-]+$/.test(bakongId)) {
      setError("Use a Bakong ID like lotuscourt@aba");
      return;
    }
    if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
      setError("Enter how many riel equal one dollar");
      return;
    }
    dispatch({
      type: "updateSettings",
      settings: {
        ...draft,
        name: draft.name.trim() || state.settings.name,
        nameKm: draft.nameKm.trim() || state.settings.nameKm,
        city: draft.city.trim() || state.settings.city,
        bakongId,
        exchangeRate,
      },
    });
    setError(null);
    onFlash("Settings saved · រក្សាទុករួច");
  }

  return (
    <>
      <button type="button" className="backdrop" aria-label="Close settings" onClick={onClose} />
      <aside className="sheet" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header className="sheet-head">
          <div>
            <p className="kicker">Tablet</p>
            <h2 id="settings-title">Property</h2>
            <p lang="km">ការកំណត់សណ្ឋាគារ</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="sheet-body stack">
          <p className="help">
            Records stay in this browser. Mount the tablet, add it to the home screen, and leave the rack on.
          </p>
          {error && <p className="errors">{error}</p>}
          <label className="field">
            <span className="en">Property name</span>
            <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </label>
          <label className="field">
            <span lang="km">ឈ្មោះខ្មែរ</span>
            <input value={draft.nameKm} onChange={(event) => setDraft({ ...draft, nameKm: event.target.value })} />
          </label>
          <div className="cols">
            <label className="field">
              <span className="en">City (Latin, printed in KHQR)</span>
              <input value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} />
            </label>
            <label className="field">
              <span lang="km">ទីក្រុង</span>
              <input value={draft.cityKm} onChange={(event) => setDraft({ ...draft, cityKm: event.target.value })} />
            </label>
          </div>
          <label className="field">
            <span className="en">Address</span>
            <input value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} />
          </label>
          <label className="field">
            <span lang="km">ទូរស័ព្ទ</span>
            <input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
          </label>
          <label className="field">
            <span className="en">Bakong ID</span>
            <span lang="km">គណនីបាគង សម្រាប់ KHQR</span>
            <input
              value={draft.bakongId}
              onChange={(event) => setDraft({ ...draft, bakongId: event.target.value })}
              autoCapitalize="off"
              spellCheck={false}
            />
          </label>
          <label className="field">
            <span className="en">Riel per 1 USD</span>
            <span lang="km">អត្រារៀល</span>
            <input
              type="number"
              min="1"
              value={draft.exchangeRate}
              onChange={(event) => setDraft({ ...draft, exchangeRate: Number(event.target.value) })}
            />
          </label>
          <button type="button" className="btn btn-primary" onClick={save}>
            Save · រក្សាទុក
          </button>
          <h3>Rack rates · តម្លៃបន្ទប់</h3>
          <p className="help">These rates apply to the next check-in. An open folio keeps its own rate.</p>
          <div className="rate-grid">
            {state.rooms.map((room) => (
              <label key={room.id}>
                <span>{room.number}</span>
                <input
                  type="number"
                  min="1"
                  defaultValue={room.rateUsd}
                  aria-label={`Rate for room ${room.number}`}
                  onBlur={(event) => {
                    const rateUsd = Number(event.target.value);
                    if (Number.isFinite(rateUsd) && rateUsd > 0 && rateUsd !== room.rateUsd) {
                      dispatch({ type: "setRoomRate", roomId: room.id, rateUsd });
                    }
                  }}
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-line"
            onClick={() => {
              if (window.confirm("Restore the sample Lotus Court rack on this tablet?")) {
                dispatch({ type: "reset" });
                onFlash("Sample rack restored · តារាងគំរូបានវិញ");
                onClose();
              }
            }}
          >
            Restore sample rooms
          </button>
        </div>
      </aside>
    </>
  );
}
