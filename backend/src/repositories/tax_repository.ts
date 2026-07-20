import { getSupabaseClient } from "./supabase.ts";
import { ExpenditureSummary, TaxCategory, DataType, AccountType, FiscalAvailability } from "@shared/index.ts";

// ダミーデータ定義
const DUMMY_CATEGORIES = {
  // 大項目
  social: { id: "dummy-cat-social", name: "社会保障費", level: 1, parent_id: null },
  debt: { id: "dummy-cat-debt", name: "国債費", level: 1, parent_id: null },
  local: { id: "dummy-cat-local", name: "地方交付税交付金等", level: 1, parent_id: null },
  education: { id: "dummy-cat-education", name: "文教及び科学振興費", level: 1, parent_id: null },
  defense: { id: "dummy-cat-defense", name: "防衛関係費", level: 1, parent_id: null },
  public_works: { id: "dummy-cat-public", name: "公共事業関係費", level: 1, parent_id: null },
  others: { id: "dummy-cat-others", name: "その他経費", level: 1, parent_id: null },

  // 中項目 (省庁別内訳)
  social_mhlw: { id: "dummy-sub-mhlw", name: "厚生労働省", level: 2, parent_id: "dummy-cat-social" },
  social_cfa: { id: "dummy-sub-cfa", name: "こども家庭庁", level: 2, parent_id: "dummy-cat-social" },
  
  education_mext: { id: "dummy-sub-mext", name: "文部科学省", level: 2, parent_id: "dummy-cat-education" },
  education_cao: { id: "dummy-sub-cao", name: "内閣府", level: 2, parent_id: "dummy-cat-education" },

  defense_mod: { id: "dummy-sub-mod", name: "防衛省", level: 2, parent_id: "dummy-cat-defense" },

  public_mlit: { id: "dummy-sub-mlit", name: "国土交通省", level: 2, parent_id: "dummy-cat-public" },
  public_maff: { id: "dummy-sub-maff", name: "農林水産省", level: 2, parent_id: "dummy-cat-public" },

  others: { id: "dummy-sub-mof", name: "財務省・その他", level: 2, parent_id: "dummy-cat-others" }
};

export class TaxRepository {
  private client = getSupabaseClient();

  // ダミーの歳出データを生成
  private getDummyExpenditures(
    year: number,
    dataType: DataType,
    accountType: AccountType,
    budgetRevision: number | null,
    parentId: string | null
  ): ExpenditureSummary[] {
    // 係数の調整 (決算や特別会計、補正予算に応じて金額を少し変動させる)
    let multiplier = 1.0;
    if (dataType === 'settlement') multiplier = 1.02; // 決算は予算より微増
    if (accountType === 'special') multiplier = 1.8;   // 特別会計は規模が大きい
    if (accountType === 'government_related') multiplier = 0.15; // 政府関係機関は小規模
    if (dataType === 'budget' && budgetRevision && budgetRevision > 0) {
      multiplier += 0.05 * budgetRevision; // 補正で増額
    }

    // 年度による微調整
    const yearDiff = (year - 2024) * 0.02;
    multiplier *= (1 + yearDiff);

    if (!parentId) {
      // 大カテゴリ一覧
      const list = [
        { id: DUMMY_CATEGORIES.social.id, name: DUMMY_CATEGORIES.social.name, amount: 35000000000000 },
        { id: DUMMY_CATEGORIES.debt.id, name: DUMMY_CATEGORIES.debt.name, amount: 25000000000000 },
        { id: DUMMY_CATEGORIES.local.id, name: DUMMY_CATEGORIES.local.name, amount: 15000000000000 },
        { id: DUMMY_CATEGORIES.education.id, name: DUMMY_CATEGORIES.education.name, amount: 5500000000000 },
        { id: DUMMY_CATEGORIES.defense.id, name: DUMMY_CATEGORIES.defense.name, amount: 6500000000000 },
        { id: DUMMY_CATEGORIES.public_works.id, name: DUMMY_CATEGORIES.public_works.name, amount: 6000000000000 },
        { id: DUMMY_CATEGORIES.others.id, name: DUMMY_CATEGORIES.others.name, amount: 8000000000000 }
      ];

      const total = list.reduce((sum, item) => sum + item.amount * multiplier, 0);

      return list.map(item => {
        const amt = Math.round(item.amount * multiplier);
        // 子カテゴリがある大項目を判定
        const hasChildren = [
          DUMMY_CATEGORIES.social.id, 
          DUMMY_CATEGORIES.education.id, 
          DUMMY_CATEGORIES.defense.id, 
          DUMMY_CATEGORIES.public_works.id,
          DUMMY_CATEGORIES.others.id
        ].includes(item.id);

        return {
          category_id: item.id,
          category_name: item.name,
          amount: amt,
          percentage: total > 0 ? (amt / total) * 100 : 0,
          has_children: hasChildren,
          source_url: "https://www.bb.mof.go.jp/",
          source_details: { page: 1 }
        };
      });
    } else {
      // 特定の大項目の配下（省庁別）
      let subItems: { id: string; name: string; amount: number }[] = [];

      if (parentId === DUMMY_CATEGORIES.social.id) {
        subItems = [
          { id: DUMMY_CATEGORIES.social_mhlw.id, name: DUMMY_CATEGORIES.social_mhlw.name, amount: 33000000000000 },
          { id: DUMMY_CATEGORIES.social_cfa.id, name: DUMMY_CATEGORIES.social_cfa.name, amount: 2000000000000 }
        ];
      } else if (parentId === DUMMY_CATEGORIES.education.id) {
        subItems = [
          { id: DUMMY_CATEGORIES.education_mext.id, name: DUMMY_CATEGORIES.education_mext.name, amount: 5000000000000 },
          { id: DUMMY_CATEGORIES.education_cao.id, name: DUMMY_CATEGORIES.education_cao.name, amount: 500000000000 }
        ];
      } else if (parentId === DUMMY_CATEGORIES.defense.id) {
        subItems = [
          { id: DUMMY_CATEGORIES.defense_mod.id, name: DUMMY_CATEGORIES.defense_mod.name, amount: 6500000000000 }
        ];
      } else if (parentId === DUMMY_CATEGORIES.public_works.id) {
        subItems = [
          { id: DUMMY_CATEGORIES.public_mlit.id, name: DUMMY_CATEGORIES.public_mlit.name, amount: 5500000000000 },
          { id: DUMMY_CATEGORIES.public_maff.id, name: DUMMY_CATEGORIES.public_maff.name, amount: 500000000000 }
        ];
      } else if (parentId === DUMMY_CATEGORIES.others.id) {
        subItems = [
          { id: DUMMY_CATEGORIES.others.id, name: DUMMY_CATEGORIES.others.name, amount: 8000000000000 }
        ];
      }

      const total = subItems.reduce((sum, item) => sum + item.amount * multiplier, 0);

      return subItems.map(item => {
        const amt = Math.round(item.amount * multiplier);
        return {
          category_id: item.id,
          category_name: item.name,
          amount: amt,
          percentage: total > 0 ? (amt / total) * 100 : 0,
          has_children: false,
          source_url: "https://www.bb.mof.go.jp/",
          source_details: { page: 1 }
        };
      });
    }
  }

  async getExpenditureSummary(
    year: number,
    lgCode: string,
    parentId: string | null = null,
    entryType: string = 'budget',
    dataType?: DataType,
    accountType?: AccountType,
    budgetRevision?: number | null
  ): Promise<ExpenditureSummary[]> {
    // パラメータの正規化 (未指定の場合はデフォルト値)
    const normalizedDataType: DataType = dataType || (entryType === 'actual' ? 'settlement' : 'budget');
    const normalizedAccountType: AccountType = accountType || 'general';
    const normalizedBudgetRevision = budgetRevision === undefined ? 0 : budgetRevision;

    try {
      // 1. 組織IDの取得
      const { data: orgData, error: orgError } = await this.client
        .from("organizations")
        .select("id")
        .eq("lg_code", lgCode)
        .single();

      if (orgError || !orgData) {
        return this.getDummyExpenditures(year, normalizedDataType, normalizedAccountType, normalizedBudgetRevision, parentId);
      }

      // 2. 支出データの取得
      let query = this.client
        .from("tax_expenditures")
        .select(`
          amount,
          source_url,
          source_details,
          tax_categories (
            id,
            name,
            parent_id,
            level
          )
        `)
        .eq("org_id", orgData.id)
        .eq("year", year)
        .eq("data_type", normalizedDataType)
        .eq("account_type", normalizedAccountType);

      if (normalizedDataType === 'budget' && normalizedBudgetRevision !== null) {
        query = query.eq("budget_revision", normalizedRevisionForQuery(normalizedBudgetRevision));
      }

      if (parentId) {
        // ダミーIDが指定された場合はダミーデータを返す
        if (parentId.startsWith("dummy-")) {
          return this.getDummyExpenditures(year, normalizedDataType, normalizedAccountType, normalizedBudgetRevision, parentId);
        }
        query = query.eq("tax_categories.parent_id", parentId);
      } else {
        query = query.eq("tax_categories.level", 1);
      }

      const { data, error } = await query;
      
      // テーブルが存在しない、またはデータが1件もない場合はダミーデータを返す
      if (error || !data || data.length === 0) {
        return this.getDummyExpenditures(year, normalizedDataType, normalizedAccountType, normalizedBudgetRevision, parentId);
      }

      const validData = data.filter((item: any) => item.tax_categories !== null);
      if (validData.length === 0) {
        return this.getDummyExpenditures(year, normalizedDataType, normalizedAccountType, normalizedBudgetRevision, parentId);
      }

      const totalAmount = validData.reduce((sum, item) => sum + Number(item.amount), 0);

      // 3. 子カテゴリの有無を確認
      const { data: allCategories } = await this.client
        .from("tax_categories")
        .select("parent_id");
      
      const parentIds = new Set(allCategories?.map(c => c.parent_id).filter(id => id !== null));

      return validData.map((item: any) => ({
        category_id: item.tax_categories.id,
        category_name: item.tax_categories.name,
        amount: Number(item.amount),
        percentage: totalAmount > 0 ? (Number(item.amount) / totalAmount) * 100 : 0,
        has_children: parentIds.has(item.tax_categories.id),
        source_url: item.source_url,
        source_details: item.source_details
      }));
    } catch {
      // エラー発生時はダミーにフォールバック
      return this.getDummyExpenditures(year, normalizedDataType, normalizedAccountType, normalizedBudgetRevision, parentId);
    }
  }

  // 歳入合計の取得
  async getFiscalRevenue(
    year: number,
    lgCode: string,
    dataType: DataType = 'budget',
    accountType: AccountType = 'general',
    budgetRevision: number | null = 0
  ): Promise<number> {
    try {
      const { data: orgData } = await this.client
        .from("organizations")
        .select("id")
        .eq("lg_code", lgCode)
        .single();

      if (!orgData) return this.getDummyRevenue(year, dataType, accountType, budgetRevision);

      let query = this.client
        .from("fiscal_revenue")
        .select("amount")
        .eq("org_id", orgData.id)
        .eq("year", year)
        .eq("data_type", dataType)
        .eq("account_type", accountType);

      if (dataType === 'budget' && budgetRevision !== null) {
        query = query.eq("budget_revision", budgetRevision);
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return this.getDummyRevenue(year, dataType, accountType, budgetRevision);
      }

      return Number(data[0].amount);
    } catch {
      return this.getDummyRevenue(year, dataType, accountType, budgetRevision);
    }
  }

  // ダミー歳入合計の算出
  private getDummyRevenue(
    year: number,
    dataType: DataType,
    accountType: AccountType,
    budgetRevision: number | null
  ): number {
    let base = 100000000000000; // 一般会計当初予算の歳入ベース: 約100兆円
    
    if (accountType === 'special') base = 200000000000000; // 特別会計: 約200兆円
    if (accountType === 'government_related') base = 15000000000000; // 政府関係機関: 約15兆円

    let multiplier = 1.0;
    if (dataType === 'settlement') multiplier = 1.03; // 決算はやや多め
    if (dataType === 'budget' && budgetRevision && budgetRevision > 0) {
      multiplier += 0.06 * budgetRevision; // 補正予算による増額
    }

    const yearDiff = (year - 2024) * 0.02;
    multiplier *= (1 + yearDiff);

    return Math.round(base * multiplier);
  }

  // 決算公開状況の取得
  async getFiscalAvailability(year?: number): Promise<FiscalAvailability[]> {
    try {
      let query = this.client.from("fiscal_availability").select("*");
      if (year) {
        query = query.eq("year", year);
      }
      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return this.getDummyAvailability(year);
      }
      return data;
    } catch {
      return this.getDummyAvailability(year);
    }
  }

  // ダミーの決算公開状況の生成
  private getDummyAvailability(year?: number): FiscalAvailability[] {
    const startYear = 2020;
    const endYear = 2027;
    const list: FiscalAvailability[] = [];

    const accounts: AccountType[] = ['general', 'special', 'government_related'];

    for (let y = startYear; y <= endYear; y++) {
      if (year && y !== year) continue;

      for (const acc of accounts) {
        // 2024年度以前は公開済み(is_published: true), 2025年以降は未公開(is_published: false)
        list.push({
          year: y,
          account_type: acc,
          is_published: y <= 2024
        });
      }
    }
    return list;
  }

  async getTimeSeriesData(categoryId: string, lgCode: string) {
    const { data: orgData } = await this.client
      .from("organizations")
      .select("id")
      .eq("lg_code", lgCode)
      .single();

    if (!orgData) return [];

    try {
      const { data, error } = await this.client
        .from("tax_expenditures")
        .select("year, amount, entry_type")
        .eq("org_id", orgData.id)
        .eq("category_id", categoryId)
        .order("year", { ascending: true });

      if (error || !data || data.length === 0) {
        return this.getDummyTimeSeries(categoryId);
      }
      return data;
    } catch {
      return this.getDummyTimeSeries(categoryId);
    }
  }

  private getDummyTimeSeries(categoryId: string) {
    const list = [];
    const baseAmount = categoryId.includes("social") ? 35000000000000 : 6000000000000;
    for (let y = 2020; y <= 2026; y++) {
      const scale = 1 + (y - 2024) * 0.03;
      list.push({
        year: y,
        amount: Math.round(baseAmount * scale),
        entry_type: 'budget'
      });
    }
    return list;
  }

  async getConversionUnits() {
    try {
      const { data, error } = await this.client
        .from("conversion_units")
        .select("*");
      
      if (error || !data || data.length === 0) {
        return this.getDummyConversionUnits();
      }
      return data;
    } catch {
      return this.getDummyConversionUnits();
    }
  }

  private getDummyConversionUnits() {
    return [
      { id: "dummy-unit-coffee", name: "コーヒー", unit_price: 400, icon_key: "coffee" },
      { id: "dummy-unit-lunch", name: "ランチ", unit_price: 1000, icon_key: "utensils" },
      { id: "dummy-unit-phone", name: "スマホ代月額", unit_price: 6000, icon_key: "smartphone" }
    ];
  }

  async getOrganizations(type?: string) {
    try {
      let query = this.client.from("organizations").select("*");
      if (type) {
        query = query.eq("type", type);
      }
      const { data, error } = await query.order("name");
      if (error || !data || data.length === 0) {
        return this.getDummyOrganizations(type);
      }
      return data;
    } catch {
      return this.getDummyOrganizations(type);
    }
  }

  private getDummyOrganizations(type?: string) {
    const list = [
      { id: "dummy-org-japan", name: "日本国", lg_code: "000000", type: "national" }
    ];
    if (type) return list.filter(o => o.type === type);
    return list;
  }

  async getOrganizationByCode(lgCode: string) {
    try {
      const { data, error } = await this.client
        .from("organizations")
        .select("*")
        .eq("lg_code", lgCode)
        .single();
      if (error || !data) {
        if (lgCode === "000000") {
          return { id: "dummy-org-japan", name: "日本国", lg_code: "000000", type: "national" };
        }
        throw new Error("Organization not found");
      }
      return data;
    } catch {
      if (lgCode === "000000") {
        return { id: "dummy-org-japan", name: "日本国", lg_code: "000000", type: "national" };
      }
      throw new Error("Organization not found");
    }
  }

  async getYears() {
    try {
      const { data, error } = await this.client
        .from("tax_expenditures")
        .select("year")
        .order("year", { ascending: false });
      
      if (error || !data || data.length === 0) {
        return [2026, 2025, 2024, 2023, 2022, 2021, 2020];
      }
      return [...new Set(data.map(d => d.year))];
    } catch {
      return [2026, 2025, 2024, 2023, 2022, 2021, 2020];
    }
  }
}

// 補正予算の型チェック用ヘルパー
function normalizedRevisionForQuery(rev: number | null): number {
  return rev === null ? 0 : rev;
}
