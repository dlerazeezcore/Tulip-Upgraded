// Shared DTOs for the backend wiring layer. Mirrors the FastAPI contracts.

export type SubjectType = 'user' | 'admin';

export type AuthSession = {
  accessToken: string;
  tokenType?: string;
  expiresIn?: number;
  id: string;
  userId?: string;
  adminUserId?: string;
  phone: string;
  name: string;
  email?: string | null;
  subjectType: SubjectType;
  isAdmin: boolean;
};

export type AuthMe = {
  subjectType: SubjectType;
  id: string;
  phone: string;
  name: string;
  email?: string | null;
  status: string;
  isLoyalty?: boolean;
  preferredLanguage?: string | null;
  preferredCurrency?: string | null;
  notificationsEnabled?: boolean;
  role?: string;
  permissions?: Record<string, boolean>;
};

export type OtpChannel = 'sms' | 'whatsapp';

export type OtpStartResult = {
  to: string;
  channel: OtpChannel;
  status: string;
  sid?: string | null;
};

export type ExchangeSettings = {
  enableIQD: boolean;
  exchangeRate: string; // units of IQD per 1 USD
  markupPercent: string; // percent added on top of the converted price
  source: string;
  updatedAt?: string | null;
  cacheStatus?: string;
};

export type IncludedCountry = { code: string; name: string };

export type ProviderPackage = {
  packageCode: string;
  slug?: string;
  name?: string;
  price?: number; // provider price (USD, in 1/10000 units)
  currencyCode?: string;
  volume?: number; // total data in bytes (0 = unlimited)
  unusedValidTime?: number;
  duration?: number;
  durationUnit?: string;
  location?: string;
  speed?: string;
  supportTopUpType?: number;
  includedCountries?: IncludedCountry[];
};

export type ManualEntry = { smdpAddress: string | null; activationCode: string | null };

export type EsimProfile = {
  id: number | string;
  userId?: string;
  providerOrderNo?: string | null;
  esimTranNo?: string | null;
  iccid?: string | null;
  countryCode?: string | null;
  countryName?: string | null;
  status: 'inactive' | 'active' | 'expired';
  isExpired?: boolean;
  canActivate?: boolean;
  canTopUp?: boolean;
  canShowQr?: boolean;
  installed: boolean;
  installedAt?: string | null;
  activatedAt?: string | null;
  bundleExpiresAt?: string | null;
  expiresAt?: string | null;
  totalDataMb?: number | null;
  usedDataMb?: number | null;
  remainingDataMb?: number | null;
  totalDataGb?: number | null;
  usedDataGb?: number | null;
  remainingDataGb?: number | null;
  daysLeft?: number | null;
  supportTopUpType?: number;
  activationCode?: string | null;
  qrCodeUrl?: string | null;
  installUrl?: string | null;
  appleInstallUrl?: string | null;
  smdpAddress?: string | null;
  matchingId?: string | null;
  manualEntry?: ManualEntry | null;
  customFields?: Record<string, any>;
};

export type ProfileListResult = {
  profiles: EsimProfile[];
  limit: number;
  offset: number;
  total: number;
  sync?: Record<string, number>;
};

export type FeaturedLocation = {
  code: string;
  name: string;
  serviceType: string;
  locationType: string;
  isPopular: boolean;
  enabled: boolean;
  sortOrder: number;
};

export type ManagedOrderResult = {
  success: boolean;
  providerOrderNo?: string | null;
  orderNo?: string | null;
  data?: any;
};

export type FibPayment = {
  paymentId: string;
  status: string;
  redirectUrl?: string | null;
  qrCode?: string | null;
  readableCode?: string | null;
  raw?: any;
};
