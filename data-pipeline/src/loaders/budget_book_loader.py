import os
from typing import Dict, Any, List
from supabase import Client
from src.supabase_client import get_supabase_client

class BudgetBookLoader:
    """
    予算書・決算書データベースからパースされたデータを Supabase DB に保存するローダー
    """
    def __init__(self, client: Client = None):
        self.client = client or get_supabase_client()
        self._org_id = None
        self._category_cache = {}  # キャッシュ用: (name, parent_id, level) -> uuid

    def get_org_id(self) -> str:
        """日本国の組織ID (lg_code='000000') を取得して返します。"""
        if self._org_id:
            return self._org_id
        res = self.client.table("organizations").select("id").eq("lg_code", "000000").execute()
        if not res.data:
            raise ValueError("組織 '日本国' (lg_code='000000') がデータベース内に見つかりません。")
        self._org_id = res.data[0]["id"]
        return self._org_id

    def get_or_create_category(self, name: str, level: int, parent_id: str = None, dry_run: bool = False) -> str:
        """
        指定された費目カテゴリが存在すれば取得し、無ければ作成してIDを返します。
        """
        if dry_run:
            print(f"[DRY-RUN] Get or create category: name='{name}', level={level}, parent_id={parent_id}")
            return "00000000-0000-0000-0000-000000000000"

        cache_key = (name, parent_id, level)
        if cache_key in self._category_cache:
            return self._category_cache[cache_key]

        # 検索クエリ構築
        query = self.client.table("tax_categories").select("id").eq("name", name).eq("level", level)
        if parent_id:
            query = query.eq("parent_id", parent_id)
        else:
            query = query.is_("parent_id", "null")
        
        res = query.execute()
        if res.data:
            cat_id = res.data[0]["id"]
            self._category_cache[cache_key] = cat_id
            return cat_id

        # 作成
        insert_data = {
            "name": name,
            "level": level
        }
        if parent_id:
            insert_data["parent_id"] = parent_id
        
        res = self.client.table("tax_categories").insert(insert_data).execute()
        if not res.data:
            raise RuntimeError(f"カテゴリ作成に失敗しました: {insert_data}")
        
        cat_id = res.data[0]["id"]
        self._category_cache[cache_key] = cat_id
        return cat_id

    def load(self, data: dict, year: int, account_type: str, budget_revision: int = None, data_type: str = "budget", entry_type: str = "budget", source_url: str = None, dry_run: bool = False):
        """
        パース済みの歳入・歳出データをロードします。
        """
        org_id = self.get_org_id()
        
        # 金額単位の判定
        amount_unit = data.get("amount_unit", "千円")
        multiplier = 1000 if amount_unit == "千円" else 1

        # 1. 歳入合計の保存 (fiscal_revenue)
        revenue_total_yen = int(data["revenue_total"]) * multiplier
        if revenue_total_yen > 0:
            if dry_run:
                print(f"[DRY-RUN] Insert fiscal_revenue: year={year}, amount={revenue_total_yen}, account_type='{account_type}', data_type='{data_type}', entry_type='{entry_type}', revision={budget_revision}")
            else:
                # 歳入データの有無を確認
                exist_query = self.client.table("fiscal_revenue")\
                    .select("id")\
                    .eq("org_id", org_id)\
                    .eq("year", year)\
                    .eq("data_type", data_type)\
                    .eq("account_type", account_type)
                
                if budget_revision is not None:
                    exist_query = exist_query.eq("budget_revision", budget_revision)
                else:
                    exist_query = exist_query.is_("budget_revision", "null")
                    
                exist_res = exist_query.execute()
                
                payload = {
                    "org_id": org_id,
                    "year": year,
                    "amount": revenue_total_yen,
                    "data_type": data_type,
                    "account_type": account_type,
                    "budget_revision": budget_revision,
                    "source_url": source_url
                }
                
                if exist_res.data:
                    # 更新
                    self.client.table("fiscal_revenue").update(payload).eq("id", exist_res.data[0]["id"]).execute()
                    print(f"Updated fiscal_revenue: {revenue_total_yen:,} yen")
                else:
                    # 新規挿入
                    self.client.table("fiscal_revenue").insert(payload).execute()
                    print(f"Inserted fiscal_revenue: {revenue_total_yen:,} yen")

        # 2. 歳出項目の保存 (tax_expenditures)
        # is_subtotal == False (最下層) のもののみを登録
        load_count = 0
        for item in data["expenditure_items"]:
            if item.get("is_subtotal", False):
                continue
                
            shokan = item.get("shokan")
            soshiki = item.get("soshiki")
            name = item.get("name")
            amount_yen = int(item["amount"]) * multiplier
            
            # 所管 (level=1)
            shokan_id = None
            if shokan:
                shokan_id = self.get_or_create_category(shokan, 1, dry_run=dry_run)
                
            # 組織 (level=2)
            parent_id = shokan_id
            if soshiki:
                parent_id = self.get_or_create_category(soshiki, 2, parent_id=shokan_id, dry_run=dry_run)
                
            # 項 (level=3)
            category_id = self.get_or_create_category(name, 3, parent_id=parent_id, dry_run=dry_run)
            
            if dry_run:
                print(f"[DRY-RUN] Insert tax_expenditures: name='{name}', amount={amount_yen}, category_id={category_id}")
            else:
                self.client.table("tax_expenditures").upsert({
                    "org_id": org_id,
                    "category_id": category_id,
                    "year": year,
                    "amount": amount_yen,
                    "entry_type": entry_type,
                    "data_type": data_type,
                    "account_type": account_type,
                    "budget_revision": budget_revision,
                    "source_url": source_url,
                    "source_details": {"page": item["page"]}
                }, on_conflict="org_id, category_id, year, entry_type").execute()
                load_count += 1
                
        print(f"Finished loading expenditures: {load_count} items stored (dry_run={dry_run}).")
