/** Wallet amounts are stored in kobo; these helpers render them as naira. */

export const koboToNaira = (kobo: number) => kobo / 100;

export const formatNaira = (naira: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(naira);

/** Format a kobo amount directly as a naira currency string. */
export const formatKobo = (kobo: number) => formatNaira(koboToNaira(kobo));
