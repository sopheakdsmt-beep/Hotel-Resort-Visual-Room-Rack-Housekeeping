import { useState } from "react";
import { NATIONALITIES } from "../catalog";
import { addDays, todayIso } from "../folio";
import { useHotel } from "../state";
import type { Room, Stay } from "../types";
import { CameraCapture } from "./CameraCapture";
import { SignaturePad } from "./SignaturePad";

export function CheckInForm({ room, onDone }: { room: Room; onDone: (stayId: string) => void }) {
  const { dispatch } = useHotel();
  const today = todayIso();
  const [guestName, setGuestName] = useState("");
  const [nationality, setNationality] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(addDays(today, 1));
  const [rateUsd, setRateUsd] = useState(String(room.rateUsd));
  const [passportImage, setPassportImage] = useState<string | undefined>();
  const [plateImage, setPlateImage] = useState<string | undefined>();
  const [signature, setSignature] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  function submit() {
    const rate = Number(rateUsd);
    const missing: string[] = [];
    if (!guestName.trim()) missing.push("Guest name · ឈ្មោះភ្ញៀវ");
    if (!nationality.trim()) missing.push("Nationality · សញ្ជាតិ");
    if (!passportNo.trim()) missing.push("Passport number · លេខលិខិតឆ្លងដែន");
    if (!signature) missing.push("Signature · ហត្ថលេខា");
    if (!Number.isFinite(rate) || rate <= 0) missing.push("Room rate · តម្លៃបន្ទប់");
    if (checkOut < checkIn) missing.push("Departure on the arrival date or later");
    setErrors(missing);
    if (missing.length > 0) return;

    const stay: Stay = {
      id: crypto.randomUUID(),
      roomId: room.id,
      guestName: guestName.trim(),
      nationality: nationality.trim(),
      passportNo: passportNo.trim(),
      dateOfBirth,
      phone: phone.trim(),
      vehiclePlate: vehiclePlate.trim().toUpperCase(),
      passportImage,
      plateImage,
      signature: signature ?? undefined,
      checkIn,
      checkOut,
      rateUsd: rate,
      charges: [],
      dnd: false,
      status: "inhouse",
    };
    dispatch({ type: "checkin", stay });
    onDone(stay.id);
  }

  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <p className="help">Passport photos and the signature stay in this browser on the front-desk tablet.</p>
      {errors.length > 0 && (
        <div className="errors" role="alert">
          <strong>Add these before check-in</strong>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      <label className="field">
        <span lang="km">ឈ្មោះភ្ញៀវ</span>
        <span className="en">Guest name</span>
        <input value={guestName} onChange={(event) => setGuestName(event.target.value)} autoComplete="name" />
      </label>
      <div className="cols">
        <label className="field">
          <span lang="km">សញ្ជាតិ</span>
          <span className="en">Nationality</span>
          <input value={nationality} onChange={(event) => setNationality(event.target.value)} list="nationalities" />
          <datalist id="nationalities">
            {NATIONALITIES.map((country) => (
              <option key={country} value={country} />
            ))}
          </datalist>
        </label>
        <label className="field">
          <span lang="km">លេខលិខិតឆ្លងដែន</span>
          <span className="en">Passport number</span>
          <input value={passportNo} onChange={(event) => setPassportNo(event.target.value)} autoCapitalize="characters" />
        </label>
      </div>
      <div className="cols">
        <label className="field">
          <span lang="km">ថ្ងៃខែឆ្នាំកំណើត</span>
          <span className="en">Date of birth</span>
          <input type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} />
        </label>
        <label className="field">
          <span lang="km">ទូរស័ព្ទ</span>
          <span className="en">Phone</span>
          <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" />
        </label>
      </div>
      <div className="cols">
        <label className="field">
          <span lang="km">ថ្ងៃចូល</span>
          <span className="en">Arrival</span>
          <input type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} />
        </label>
        <label className="field">
          <span lang="km">ថ្ងៃចេញ</span>
          <span className="en">Departure</span>
          <input type="date" value={checkOut} min={checkIn} onChange={(event) => setCheckOut(event.target.value)} />
        </label>
      </div>
      <label className="field">
        <span lang="km">តម្លៃបន្ទប់ (USD / យប់)</span>
        <span className="en">Nightly rate</span>
        <input value={rateUsd} onChange={(event) => setRateUsd(event.target.value)} inputMode="decimal" />
      </label>
      <CameraCapture labelKm="លិខិតឆ្លងដែន" labelEn="Passport" value={passportImage} onChange={setPassportImage} />
      <label className="field">
        <span lang="km">ស្លាកលេខរថយន្ត</span>
        <span className="en">Vehicle plate</span>
        <input
          value={vehiclePlate}
          onChange={(event) => setVehiclePlate(event.target.value)}
          placeholder="2AB-4521"
          autoCapitalize="characters"
        />
      </label>
      <CameraCapture labelKm="រូបស្លាកលេខ" labelEn="Plate photo" value={plateImage} onChange={setPlateImage} />
      <div className="field">
        <span lang="km">ហត្ថលេខាភ្ញៀវ</span>
        <span className="en">Sign with a stylus or finger</span>
        <SignaturePad onChange={setSignature} />
      </div>
      <button type="submit" className="btn btn-gold" data-testid="check-in">
        <span lang="km">ចុះឈ្មោះចូល</span>
        Check in room {room.number}
      </button>
    </form>
  );
}
