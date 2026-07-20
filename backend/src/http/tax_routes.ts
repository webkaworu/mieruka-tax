import { Hono } from "hono";
import { TaxRepository } from "../repositories/tax_repository.ts";

const taxRoutes = new Hono();
const repo = new TaxRepository();

// 支出概要の取得 (ドーナツチャート・トレマップ・詳細可視化用)
taxRoutes.get("/expenditures", async (c) => {
  const year = Number(c.req.query("year") || new Date().getFullYear());
  const lgCode = c.req.query("lg_code") || "000000";
  const parentId = c.req.query("parent_id") || null;
  const entryType = c.req.query("entry_type") || "budget";
  const dataType = c.req.query("data_type") as any;
  const accountType = c.req.query("account_type") as any;
  const budgetRevision = c.req.query("budget_revision") !== undefined ? Number(c.req.query("budget_revision")) : undefined;

  try {
    const summary = await repo.getExpenditureSummary(
      year, 
      lgCode, 
      parentId, 
      entryType, 
      dataType, 
      accountType, 
      budgetRevision
    );
    return c.json(summary);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// 歳入合計の取得
taxRoutes.get("/fiscal-revenue", async (c) => {
  const year = Number(c.req.query("year") || new Date().getFullYear());
  const lgCode = c.req.query("lg_code") || "000000";
  const dataType = c.req.query("data_type") as any || 'budget';
  const accountType = c.req.query("account_type") as any || 'general';
  const budgetRevision = c.req.query("budget_revision") !== undefined && c.req.query("budget_revision") !== ""
    ? Number(c.req.query("budget_revision")) 
    : 0;

  try {
    const revenue = await repo.getFiscalRevenue(year, lgCode, dataType, accountType, budgetRevision);
    return c.json({ revenue });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// 決算公開状況の取得
taxRoutes.get("/fiscal-availability", async (c) => {
  const yearStr = c.req.query("year");
  const year = yearStr ? Number(yearStr) : undefined;
  try {
    const availability = await repo.getFiscalAvailability(year);
    return c.json(availability);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// 時系列データの取得
taxRoutes.get("/expenditures/:categoryId/timeseries", async (c) => {
  const categoryId = c.req.param("categoryId");
  const lgCode = c.req.query("lg_code") || "000000";

  try {
    const timeseries = await repo.getTimeSeriesData(categoryId, lgCode);
    return c.json(timeseries);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// 換算単位の取得
taxRoutes.get("/conversion-units", async (c) => {
  try {
    const units = await repo.getConversionUnits();
    return c.json(units);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// 組織一覧の取得
taxRoutes.get("/organizations", async (c) => {
  const type = c.req.query("type");
  try {
    const orgs = await repo.getOrganizations(type);
    return c.json(orgs);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// 特定組織の取得
taxRoutes.get("/organizations/:lgCode", async (c) => {
  const lgCode = c.req.param("lgCode");
  try {
    const org = await repo.getOrganizationByCode(lgCode);
    return c.json(org);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// 利用可能な年度一覧の取得
taxRoutes.get("/years", async (c) => {
  try {
    const years = await repo.getYears();
    return c.json(years);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

export default taxRoutes;
