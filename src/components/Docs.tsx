import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { formatKhr, formatPretty, formatPrettyKm, formatUsd, liveInvoice } from "../folio";
import type { Invoice, Room, Settings, Stay } from "../types";

type DocProps = {
  stay: Stay;
  room: Room;
  settings: Settings;
};

function useQr(payload: string | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!payload) {
      setUrl(null);
      return;
    }
    let cancel = false;
    void QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 360,
      color: { dark: "#1a1a1a", light: "#ffffff" },
    }).then((next) => {
      if (!cancel) setUrl(next);
    });
    return () => {
      cancel = true;
    };
  }, [payload]);
  return url;
}

export function useInvoice(stay: Stay, room: Room, settings: Settings): { invoice: Invoice | null; error: string | null } {
  return useMemo(() => {
    if (stay.invoice) return { invoice: stay.invoice, error: null };
    try {
      return { invoice: liveInvoice(stay, room, settings), error: null };
    } catch (error) {
      return { invoice: null, error: error instanceof Error ? error.message : "KHQR is unavailable" };
    }
  }, [stay, room, settings]);
}

function DocHeader({ settings, kickerKm, kickerEn }: { settings: Settings; kickerKm: string; kickerEn: string }) {
  return (
    <header className="doc-head">
      <p className="doc-kicker">
        <span lang="km">{kickerKm}</span>
        {kickerEn}
      </p>
      <h2>{settings.name}</h2>
      <p lang="km" className="doc-km">
        {settings.nameKm}
      </p>
      <p className="doc-meta">
        {settings.address} · {settings.city} <span lang="km">{settings.cityKm}</span>
        <br />
        {settings.phone}
      </p>
    </header>
  );
}

export function InvoiceDoc({ stay, room, settings }: DocProps) {
  const { invoice, error } = useInvoice(stay, room, settings);
  const qr = useQr(invoice?.khqr);
  return (
    <article className="doc">
      <DocHeader settings={settings} kickerKm="វិក្កយបត្រ" kickerEn="Invoice" />
      {invoice ? (
        <>
          <dl className="doc-facts">
            <div>
              <dt>No. / លេខ</dt>
              <dd>{invoice.no}</dd>
            </div>
            <div>
              <dt>Guest / ភ្ញៀវ</dt>
              <dd>{stay.guestName}</dd>
            </div>
            <div>
              <dt>Room / បន្ទប់</dt>
              <dd>
                {room.number} · {room.type}
              </dd>
            </div>
            <div>
              <dt>Stay / ស្នាក់នៅ</dt>
              <dd>
                {formatPretty(stay.checkIn)} – {formatPretty(stay.checkOut)}
                <span lang="km">
                  {formatPrettyKm(stay.checkIn)} – {formatPrettyKm(stay.checkOut)}
                </span>
              </dd>
            </div>
          </dl>
          <table className="lines">
            <thead>
              <tr>
                <th>Description / បរិយាយ</th>
                <th>Qty</th>
                <th>USD</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line) => (
                <tr key={`${line.label}-${line.qty}-${line.amountUsd}`}>
                  <td>
                    {line.label}
                    <span lang="km">{line.labelKm}</span>
                  </td>
                  <td>{line.qty}</td>
                  <td>{formatUsd(line.amountUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="money">
            <span>Total / សរុប</span>
            <strong>{formatUsd(invoice.totalUsd)}</strong>
            <em>{formatKhr(invoice.totalKhr)}</em>
            <small>1 USD = {formatKhr(invoice.exchangeRate)}</small>
          </div>
          <div className="khqr-card">
            <div className="khqr-flag">KHQR</div>
            {qr ? (
              <img src={qr} alt={`KHQR for ${formatUsd(invoice.totalUsd)}`} width={220} height={220} data-testid="khqr" />
            ) : (
              <div className="qr-wait">Preparing KHQR…</div>
            )}
            <p>Scan with any Bakong bank app · ស្កេនបង់ប្រាក់តាមធនាគារ</p>
            <p className="doc-meta">{settings.bakongId}</p>
          </div>
        </>
      ) : (
        <p className="errors">{error}</p>
      )}
      <p className="thanks">
        Thank you · <span lang="km">អរគុណ</span>
      </p>
    </article>
  );
}

export function RegistrationDoc({ stay, room, settings }: DocProps) {
  return (
    <article className="doc">
      <DocHeader settings={settings} kickerKm="ប័ណ្ណចុះឈ្មោះភ្ញៀវ" kickerEn="Guest registration" />
      <dl className="doc-facts">
        <div>
          <dt>Guest / ឈ្មោះភ្ញៀវ</dt>
          <dd>{stay.guestName}</dd>
        </div>
        <div>
          <dt>Nationality / សញ្ជាតិ</dt>
          <dd>{stay.nationality}</dd>
        </div>
        <div>
          <dt>Passport / លិខិតឆ្លងដែន</dt>
          <dd>{stay.passportNo || "—"}</dd>
        </div>
        <div>
          <dt>Date of birth / ថ្ងៃខែឆ្នាំកំណើត</dt>
          <dd>{stay.dateOfBirth || "—"}</dd>
        </div>
        <div>
          <dt>Phone / ទូរស័ព្ទ</dt>
          <dd>{stay.phone || "—"}</dd>
        </div>
        <div>
          <dt>Vehicle / ស្លាកលេខរថយន្ត</dt>
          <dd>{stay.vehiclePlate || "—"}</dd>
        </div>
        <div>
          <dt>Room / បន្ទប់</dt>
          <dd>
            {room.number} · {room.typeKm} · {room.type}
          </dd>
        </div>
        <div>
          <dt>Dates / កាលបរិច្ឆេទ</dt>
          <dd>
            {formatPretty(stay.checkIn)} – {formatPretty(stay.checkOut)}
          </dd>
        </div>
      </dl>
      <div className="doc-photos">
        {stay.passportImage && (
          <figure>
            <img src={stay.passportImage} alt="Passport scan" />
            <figcaption>Passport · លិខិតឆ្លងដែន</figcaption>
          </figure>
        )}
        {stay.plateImage && (
          <figure>
            <img src={stay.plateImage} alt="Vehicle plate" />
            <figcaption>Plate · ស្លាកលេខ</figcaption>
          </figure>
        )}
      </div>
      <div className="sign-read">
        <span>Signature · ហត្ថលេខា</span>
        {stay.signature ? <img src={stay.signature} alt="Guest signature" /> : <em>Pending</em>}
      </div>
    </article>
  );
}
