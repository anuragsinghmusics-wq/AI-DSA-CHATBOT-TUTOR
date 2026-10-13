export interface CompanyFilter {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bg: string;
  border: string;
  activeBg: string;
  activeBorder: string;
  activeColor: string;
}

export const COMPANIES: CompanyFilter[] = [
  {
    id: 'amazon',
    name: 'Amazon',
    shortName: 'AMZN',
    color: 'text-amber-800',
    bg: 'bg-amber-50/70',
    border: 'border-amber-200',
    activeBg: 'bg-amber-100',
    activeBorder: 'border-amber-300',
    activeColor: 'text-amber-900',
  },
  {
    id: 'google',
    name: 'Google',
    shortName: 'GOOG',
    color: 'text-blue-700',
    bg: 'bg-blue-50/70',
    border: 'border-blue-200',
    activeBg: 'bg-blue-100',
    activeBorder: 'border-blue-300',
    activeColor: 'text-blue-900',
  },
  {
    id: 'meta',
    name: 'Meta',
    shortName: 'META',
    color: 'text-sky-700',
    bg: 'bg-sky-50/70',
    border: 'border-sky-200',
    activeBg: 'bg-sky-100',
    activeBorder: 'border-sky-300',
    activeColor: 'text-sky-900',
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    shortName: 'MSFT',
    color: 'text-brand-700',
    bg: 'bg-orange-50/70',
    border: 'border-orange-200',
    activeBg: 'bg-orange-100',
    activeBorder: 'border-orange-300',
    activeColor: 'text-brand-900',
  },
  {
    id: 'apple',
    name: 'Apple',
    shortName: 'AAPL',
    color: 'text-gray-800',
    bg: 'bg-gray-100/70',
    border: 'border-gray-200',
    activeBg: 'bg-gray-200',
    activeBorder: 'border-gray-300',
    activeColor: 'text-gray-900',
  },
  {
    id: 'netflix',
    name: 'Netflix',
    shortName: 'NFLX',
    color: 'text-red-700',
    bg: 'bg-red-50/70',
    border: 'border-red-200',
    activeBg: 'bg-red-100',
    activeBorder: 'border-red-300',
    activeColor: 'text-red-900',
  },
  {
    id: 'uber',
    name: 'Uber',
    shortName: 'UBER',
    color: 'text-neutral-800',
    bg: 'bg-neutral-100/70',
    border: 'border-neutral-200',
    activeBg: 'bg-neutral-200',
    activeBorder: 'border-neutral-300',
    activeColor: 'text-neutral-900',
  },
  {
    id: 'bloomberg',
    name: 'Bloomberg',
    shortName: 'BLMB',
    color: 'text-slate-800',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    activeBg: 'bg-slate-200',
    activeBorder: 'border-slate-300',
    activeColor: 'text-slate-900',
  },
  {
    id: 'adobe',
    name: 'Adobe',
    shortName: 'ADBE',
    color: 'text-rose-700',
    bg: 'bg-rose-50/70',
    border: 'border-rose-200',
    activeBg: 'bg-rose-100',
    activeBorder: 'border-rose-300',
    activeColor: 'text-rose-900',
  },
];

export const COMPANY_MAP: Record<string, CompanyFilter> = COMPANIES.reduce((acc, c) => {
  acc[c.id] = c;
  return acc;
}, {} as Record<string, CompanyFilter>);
