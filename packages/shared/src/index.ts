export interface Organization {
  id: string;
  name: string;
  lg_code: string;
  type: 'national' | 'prefecture' | 'city';
}

export interface TaxCategory {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
}

// 財政データの種別 (予算 / 決算)
export type DataType = 'budget' | 'settlement';

// 会計区分 (一般会計 / 特別会計 / 政府関係機関)
export type AccountType = 'general' | 'special' | 'government_related';

export interface TaxExpenditure {
  id: string;
  org_id: string;
  category_id: string;
  year: number;
  amount: number;
  entry_type: 'budget' | 'actual';
  data_type?: DataType;
  account_type?: AccountType;
  budget_revision?: number | null;
  source_url?: string;
  source_details?: any;
}

export interface ConversionUnit {
  id: string;
  name: string;
  unit_price: number;
  icon_key?: string;
}

export interface FiscalRevenue {
  id: string;
  org_id: string;
  year: number;
  amount: number;
  data_type: DataType;
  account_type: AccountType;
  budget_revision?: number | null;
  source_url?: string;
}

export interface FiscalAvailability {
  id?: string;
  year: number;
  account_type: AccountType;
  is_published: boolean;
}

// API Response types
export interface ExpenditureSummary {
  category_id: string;
  category_name: string;
  amount: number;
  percentage: number;
  has_children: boolean;
  source_url?: string;
  source_details?: any;
}

