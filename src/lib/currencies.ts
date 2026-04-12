/** Default app currency when no profile exists yet. */
export const DEFAULT_CURRENCY_CODE = 'BDT';

export interface CountryOption {
  code: string;
  name: string;
  currencyCode: string;
}

/** Curated list: Bangladesh first as primary market; others map to local currency. */
export const COUNTRIES: CountryOption[] = [
  {code: 'BD', name: 'Bangladesh', currencyCode: 'BDT'},
  {code: 'IN', name: 'India', currencyCode: 'INR'},
  {code: 'PK', name: 'Pakistan', currencyCode: 'PKR'},
  {code: 'NP', name: 'Nepal', currencyCode: 'NPR'},
  {code: 'LK', name: 'Sri Lanka', currencyCode: 'LKR'},
  {code: 'US', name: 'United States', currencyCode: 'USD'},
  {code: 'GB', name: 'United Kingdom', currencyCode: 'GBP'},
  {code: 'DE', name: 'Germany', currencyCode: 'EUR'},
  {code: 'FR', name: 'France', currencyCode: 'EUR'},
  {code: 'AE', name: 'United Arab Emirates', currencyCode: 'AED'},
  {code: 'SA', name: 'Saudi Arabia', currencyCode: 'SAR'},
  {code: 'MY', name: 'Malaysia', currencyCode: 'MYR'},
  {code: 'SG', name: 'Singapore', currencyCode: 'SGD'},
  {code: 'AU', name: 'Australia', currencyCode: 'AUD'},
  {code: 'CA', name: 'Canada', currencyCode: 'CAD'},
  {code: 'JP', name: 'Japan', currencyCode: 'JPY'},
  {code: 'CN', name: 'China', currencyCode: 'CNY'},
  {code: 'OTHER', name: 'Other / prefer BDT', currencyCode: 'BDT'},
];

export function currencyForCountry(countryCode: string): string {
  const row = COUNTRIES.find((c) => c.code === countryCode);
  return row?.currencyCode ?? DEFAULT_CURRENCY_CODE;
}

export function formatMoney(amount: number, currencyCode: string, locale = 'en'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
    }).format(amount);
  } catch {
    const rounded = currencyCode === 'JPY' ? Math.round(amount) : Math.round(amount * 100) / 100;
    return `${currencyCode} ${rounded.toLocaleString(locale)}`;
  }
}
