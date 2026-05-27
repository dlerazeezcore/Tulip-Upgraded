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
  isLoyalty?: boolean;
  createdAt?: string | null;
};

export type AuthMe = {
  subjectType: SubjectType;
  id: string;
  phone: string;
  name: string;
  email?: string | null;
  status: string;
  isLoyalty?: boolean;
  createdAt?: string | null;
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
  location?: string; // comma-separated ISO list, e.g. "CN" or "JP,KR,CN"
  locationCode?: string;
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

export type Traveler = {
  id: number;
  name: string;
  relation?: string | null;
  dob?: string | null;
  createdAt?: string | null;
};

export type AdminUserRow = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  status: string;
  isLoyalty?: boolean;
  isBlocked?: boolean;
  createdAt?: string | null;
};

export type FeaturedLocationAdmin = {
  id: number;
  code: string;
  name: string;
  service_type?: string;
  location_type?: string;
  sort_order?: number;
  is_popular?: boolean;
  enabled?: boolean;
};

export type OrderItemSummary = {
  id: number;
  serviceType: string;
  status: string;
  providerOrderNo?: string | null;
  countryCode?: string | null;
  countryName?: string | null;
  packageCode?: string | null;
  packageName?: string | null;
  quantity?: number;
  salePriceMinor?: number | null;
};

export type OrderSummary = {
  id: number;
  orderNumber: string;
  status: string;
  currencyCode?: string | null;
  totalMinor?: number | null;
  paymentMethod?: string | null;
  paymentProvider?: string | null;
  bookedAt?: string | null;
  createdAt?: string | null;
  items: OrderItemSummary[];
};

export type AdminOrder = OrderSummary & {
  user?: { id: string; name: string; phone: string } | null;
  esimStatus: 'installed' | 'not_installed' | 'expired' | 'used' | 'pending';
  esim?: { status: string; installed: boolean; remainingDataMb?: number | null; totalDataMb?: number | null } | null;
};
