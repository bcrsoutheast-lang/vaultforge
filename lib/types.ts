export const launchStates = ['GA', 'TN', 'FL'] as const;

export type LaunchStateCode = (typeof launchStates)[number];

export const memberRoles = [
  'buyer',
  'lender',
  'landlord',
  'flipper',
  'developer',
  'wholesaler',
  'operator',
  'broker',
  'partner'
] as const;

export type MemberRole = (typeof memberRoles)[number];

export const assetTypes = [
  'residential',
  'commercial',
  'multifamily',
  'land',
  'mixed_use'
] as const;

export type AssetType = (typeof assetTypes)[number];

export const exitStrategies = [
  'flip',
  'rental',
  'owner_finance',
  'wholetail',
  'wholesale',
  'buy_and_hold',
  'bridge',
  'ground_up',
  'seller_finance',
  'subto',
  'commercial_reposition',
  'land_flip'
] as const;

export type ExitStrategy = (typeof exitStrategies)[number];

export const submissionKinds = [
  'deal',
  'need_buyer',
  'need_lender',
  'need_equity',
  'need_jv_partner',
  'need_operator',
  'need_wholesale_buyer',
  'need_land_buyer',
  'need_rescue'
] as const;

export type SubmissionKind = (typeof submissionKinds)[number];

export const occupancyTypes = [
  'vacant',
  'owner_occupied',
  'tenant_occupied',
  'partial',
  'unknown'
] as const;

export type OccupancyType = (typeof occupancyTypes)[number];

export const conditionTypes = [
  'turnkey',
  'light_rehab',
  'moderate_rehab',
  'heavy_rehab',
  'shell',
  'tear_down',
  'unknown'
] as const;

export type ConditionType = (typeof conditionTypes)[number];

export const urgencyLevels = [
  'immediate',
  '7_days',
  '14_days',
  '30_days',
  'flexible'
] as const;

export type UrgencyLevel = (typeof urgencyLevels)[number];

export const dealLanes = [
  'flip',
  'rental',
  'lending_needed',
  'equity_needed',
  'land',
  'commercial',
  'multifamily',
  'wholesale',
  'rescue'
] as const;

export type DealLane = (typeof dealLanes)[number];

export type CurrencyNumber = number | null;

export interface MemberProfile {
  id: string;
  email?: string | null;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  city: string | null;
  state: LaunchStateCode | null;
  role: MemberRole | null;
  roles: MemberRole[];
  active: boolean;
  avatar_url: string | null;

  asset_types: AssetType[];
  strategies: ExitStrategy[];
  target_states: LaunchStateCode[];

  buy_box_min: CurrencyNumber;
  buy_box_max: CurrencyNumber;
  min_units: number | null;
  max_units: number | null;

  lender_active: boolean;
  landlord_active: boolean;
  flipper_active: boolean;
  developer_active: boolean;
  wholesaler_active: boolean;

  bio: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BuyerBucket {
  id: string;
  profile_id: string;
  state: LaunchStateCode;
  asset_type: AssetType;
  strategy: ExitStrategy;
  price_min: CurrencyNumber;
  price_max: CurrencyNumber;
  arv_min: CurrencyNumber;
  arv_max: CurrencyNumber;
  rehab_max: CurrencyNumber;
  min_units: number | null;
  max_units: number | null;
  occupancy: OccupancyType | null;
  notes: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SubmissionFormValues {
  kind: SubmissionKind;
  title: string;
  state: LaunchStateCode;
  city: string;
  address: string;

  asset_type: AssetType;
  exit_strategy: ExitStrategy;
  occupancy: OccupancyType;
  condition: ConditionType;
  urgency: UrgencyLevel;

  asking_price: CurrencyNumber;
  arv: CurrencyNumber;
  rehab: CurrencyNumber;
  capital_needed: CurrencyNumber;
  loan_amount_needed: CurrencyNumber;
  equity_percent: number | null;

  monthly_rent: CurrencyNumber;
  noi: CurrencyNumber;
  cash_flow: CurrencyNumber;
  cap_rate: number | null;
  roi: number | null;

  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  building_size: number | null;
  lot_size_acres: number | null;
  frontage: number | null;

  zoning: string;
  utilities: string[];
  seller_motivation: string;
  timeline_notes: string;
  notes: string;

  lender_needed: boolean;
  equity_needed: boolean;

  photos: File[];
}

export interface SubmissionRecord {
  id: string;
  member_id: string | null;
  kind: SubmissionKind;

  title: string | null;
  state: LaunchStateCode | null;
  city: string | null;
  address: string | null;

  asset_type: AssetType | null;
  exit_strategy: ExitStrategy | null;
  occupancy: OccupancyType | null;
  condition: ConditionType | null;
  urgency: UrgencyLevel | null;

  asking_price: CurrencyNumber;
  arv: CurrencyNumber;
  rehab: CurrencyNumber;
  capital_needed: CurrencyNumber;
  loan_amount_needed: CurrencyNumber;
  equity_percent: number | null;

  monthly_rent: CurrencyNumber;
  noi: CurrencyNumber;
  cash_flow: CurrencyNumber;
  cap_rate: number | null;
  roi: number | null;

  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  building_size: number | null;
  lot_size_acres: number | null;
  frontage: number | null;

  zoning: string | null;
  utilities: string[] | null;
  seller_motivation: string | null;
  timeline_notes: string | null;
  notes: string | null;

  lender_needed: boolean;
  equity_needed: boolean;

  route_status: 'pending' | 'routed' | 'matched' | 'closed';
  created_at?: string;
  updated_at?: string;
}

export interface SubmissionPhoto {
  id: string;
  submission_id: string;
  file_path: string;
  file_name: string | null;
  sort_order: number;
  created_at?: string;
}

export interface RouteTarget {
  id: string;
  submission_id: string;
  profile_id: string;
  state: LaunchStateCode;
  lane: DealLane;
  reason: string;
  confidence: number;
  created_at?: string;
}

export interface StateProfileStats {
  state: LaunchStateCode;
  total_profiles: number;
  buyers: number;
  lenders: number;
  landlords: number;
  flippers: number;
  developers: number;
  wholesalers: number;
  operators: number;
  brokers: number;
  partners: number;
}

export interface StateDealStats {
  state: LaunchStateCode;
  total_open: number;
  flips: number;
  rentals: number;
  lending_needed: number;
  equity_needed: number;
  land: number;
  commercial: number;
  multifamily: number;
  wholesale: number;
  rescue: number;
}

export interface DirectoryFilterValues {
  state: LaunchStateCode | 'ALL';
  role: MemberRole | 'ALL';
  asset_type: AssetType | 'ALL';
  strategy: ExitStrategy | 'ALL';
}

export interface SmartRouteInput {
  kind: SubmissionKind;
  state: LaunchStateCode;
  asset_type: AssetType;
  exit_strategy: ExitStrategy;
  lender_needed: boolean;
  equity_needed: boolean;
  asking_price: CurrencyNumber;
  arv: CurrencyNumber;
  rehab: CurrencyNumber;
}

export interface SmartRoutePreview {
  lane: DealLane;
  target_label: string;
  reason: string;
  confidence: number;
}
