# តារាងបន្ទប់ និងអនាម័យ · Hotel Room Rack

A tablet for the front desk of a boutique hotel, Siem Reap or Sihanoukville resort, or guesthouse. It stays mounted behind the desk and shows every room in one glance. There is no monthly property-management fee: the rack, guest cards, and folios live in the browser on that tablet.

## What the desk can do

**Visual room rack.** Rooms are color-coded and labeled in Khmer and English:

| Status | Khmer | Meaning on the rack |
| --- | --- | --- |
| Occupied | មានភ្ញៀវ | Guest in house, with departure date |
| Vacant clean | ទំនេរ-ស្អាត | Ready to sell |
| Dirty | មិនទាន់សម្អាត | Waiting for housekeeping |
| Maintenance | កំពុងជួសជុល | Out of order, with a note |

**Check-in.** Tap a clean room, snap the passport and the vehicle plate, and have the guest sign with a stylus. The tablet files a bilingual registration card. Photos stay on this device.

**KHQR checkout.** Room nights, minibar, and laundry roll into one total in USD and riel. The folio shows a KHQR code (Bakong EMV layout, USD, hotel category 7011) plus a Khmer/English invoice. Completing checkout turns the room dirty so housekeeping sees it immediately.

**Housekeeping.** Switch modes and dirty rooms jump to the top with a large “mark clean” control. A repair sends the room back to dirty, not straight to vacant.

The sample property is **Lotus Court / សណ្ឋាគារលំអងផ្កាឈូក** in Siem Reap, with 24 rooms and a few guests already in house, including a departure due today. Replace the name, Bakong ID, exchange rate, and rack rates in Settings.

## Run it

```bash
npm install
npm test
npm run dev
```

Open the local address on the tablet, then use the browser’s “Add to Home Screen” so it fills the display. The rack asks the tablet to keep the screen awake while the page is visible.

`npm run build` writes a static site into `dist/`. Serve that folder on the hotel network if the tablet should keep working when the wider internet drops. Guest data still remains in that browser only.

## Desk routine

1. Leave **Room rack** on the mounted tablet.
2. Tap a **vacant clean** room to check a guest in.
3. Add minibar or laundry on the occupied room when the guest calls.
4. At departure, let the guest scan **KHQR**, print the invoice, then complete checkout.
5. Housekeeping opens **Housekeeping**, cleans, and marks the room clean.

Restore the sample rack from Settings if you want the original demo rooms back.
