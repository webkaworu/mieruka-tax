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

export interface TaxExpenditure {
  id: string;
  org_id: string;
  category_id: string;
  year: number;
  amount: number;
  entry_type: 'budget' | 'actual';
  source_url?: string;
  source_details?: any;
}

export interface ConversionUnit {
  id: string;
  name: string;
  unit_price: number;
  icon_key?: string;
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
