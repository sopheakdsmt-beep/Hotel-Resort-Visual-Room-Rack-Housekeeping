export type CatalogItem = {
  id: string;
  label: string;
  labelKm: string;
  unitUsd: number;
};

export const MINIBAR: CatalogItem[] = [
  { id: "beer", label: "Angkor beer", labelKm: "ស្រាបៀរអង្គរ", unitUsd: 2 },
  { id: "water", label: "Water", labelKm: "ទឹក", unitUsd: 1 },
  { id: "coconut", label: "Coconut", labelKm: "ដូង", unitUsd: 2.5 },
  { id: "coffee", label: "Iced coffee", labelKm: "កាហ្វេទឹកកក", unitUsd: 2.5 },
  { id: "snack", label: "Snack", labelKm: "អាហារសម្រន់", unitUsd: 3 },
  { id: "wine", label: "House wine", labelKm: "ស្រាផ្ទះ", unitUsd: 12 },
];

export const LAUNDRY: CatalogItem[] = [
  { id: "shirt", label: "Shirt", labelKm: "អាវ", unitUsd: 2 },
  { id: "trousers", label: "Trousers", labelKm: "ខោ", unitUsd: 3 },
  { id: "dress", label: "Dress", labelKm: "រ៉ូប", unitUsd: 4 },
  { id: "linen", label: "Extra linen", labelKm: "កម្រាលបន្ថែម", unitUsd: 5 },
];

export const NATIONALITIES = [
  "Cambodia",
  "China",
  "France",
  "Germany",
  "Japan",
  "Korea",
  "Thailand",
  "United Kingdom",
  "United States",
  "Vietnam",
  "Australia",
];
