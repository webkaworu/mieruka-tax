import { getSupabaseClient } from "./supabase.ts";
import { ExpenditureSummary, TaxCategory } from "@shared/index.ts";

export class TaxRepository {
  private client = getSupabaseClient();

  async getExpenditureSummary(
    year: number,
    lgCode: string,
    parentId: string | null = null,
    entryType: string = 'budget'
  ): Promise<ExpenditureSummary[]> {
        // 1. 組織IDの取得
    const { data: orgData } = await this.client
      .from("organizations")
      .select("id")
      .eq("lg_code", lgCode)
      .single();

    if (!orgData) return [];

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
      .eq("entry_type", entryType);

    if (parentId) {
      query = query.eq("tax_categories.parent_id", parentId);
    } else {
      query = query.eq("tax_categories.level", 1);
    }

    const { data, error } = await query;
    if (error) throw error;

    const totalAmount = data.reduce((sum, item) => sum + Number(item.amount), 0);

    // 3. 子カテゴリの有無を確認
    const { data: allCategories } = await this.client
      .from("tax_categories")
      .select("parent_id");
    
    const parentIds = new Set(allCategories?.map(c => c.parent_id).filter(id => id !== null));

    return data.map((item: any) => ({
      category_id: item.tax_categories.id,
      category_name: item.tax_categories.name,
      amount: Number(item.amount),
      percentage: totalAmount > 0 ? (Number(item.amount) / totalAmount) * 100 : 0,
      has_children: parentIds.has(item.tax_categories.id),
      source_url: item.source_url,
      source_details: item.source_details
    }));
  }

  async getTimeSeriesData(categoryId: string, lgCode: string) {
    const { data: orgData } = await this.client
      .from("organizations")
      .select("id")
      .eq("lg_code", lgCode)
      .single();

    if (!orgData) return [];

    const { data, error } = await this.client
      .from("tax_expenditures")
      .select("year, amount, entry_type")
      .eq("org_id", orgData.id)
      .eq("category_id", categoryId)
      .order("year", { ascending: true });

    if (error) throw error;
    return data;
  }

  async getConversionUnits() {
    const { data, error } = await this.client
      .from("conversion_units")
      .select("*");
    
    if (error) throw error;
    return data;
  }

  async getOrganizations(type?: string) {
    let query = this.client.from("organizations").select("*");
    if (type) {
      query = query.eq("type", type);
    }
    const { data, error } = await query.order("name");
    if (error) throw error;
    return data;
  }

  async getOrganizationByCode(lgCode: string) {
    const { data, error } = await this.client
      .from("organizations")
      .select("*")
      .eq("lg_code", lgCode)
      .single();
    if (error) throw error;
    return data;
  }

  async getYears() {
    const { data, error } = await this.client
      .from("tax_expenditures")
      .select("year")
      .order("year", { ascending: false });
    
    if (error) throw error;
    return [...new Set(data.map(d => d.year))];
  }
}
