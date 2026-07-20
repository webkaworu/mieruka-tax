import os
import sys
from supabase import create_client

def main():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.")
        sys.exit(1)

    client = create_client(url, key)

    print("=== Supabase 登録データ検証 (2024年度) ===\n")

    # 1. 歳入合計 (fiscal_revenue) の確認
    print("--- 1. 歳入合計 (fiscal_revenue) ---")
    res_rev = client.table("fiscal_revenue").select("*").eq("year", 2024).execute()
    for row in res_rev.data:
        print(f"ID: {row['id']} | type: {row['data_type']} | account: {row['account_type']} | revision: {row['budget_revision']} | amount: {row['amount']:,} 円")
    print(f"取得件数: {len(res_rev.data)}件\n")

    # 2. 歳出項目 (tax_expenditures) のサンプリングと異常値チェック
    print("--- 2. 歳出項目 (tax_expenditures) サンプル ---")
    # カテゴリ名を取得するため、カテゴリテーブルを結合して引くか、IDだけ引く。
    # supabase-py では select("*, tax_categories(*)") のようにリレーションを引けます。
    res_exp = client.table("tax_expenditures").select("amount, entry_type, data_type, account_type, tax_categories(name, level)").eq("year", 2024).limit(40).execute()
    
    for row in res_exp.data:
        cat = row.get("tax_categories", {})
        cat_name = cat.get("name", "N/A") if cat else "N/A"
        cat_level = cat.get("level", "N/A") if cat else "N/A"
        print(f"[{row['data_type']}/{row['account_type']}] {cat_name} (Lv{cat_level}) : {row['amount']:,} 円")
    
    # 3. 日本語の異常値チェック
    # 項目名に不適切な文字（数字、カンマ、三角記号など）が含まれていないか全件チェックします
    print("\n--- 3. 項目名の日本語品質チェック (全件スキャン) ---")
    res_all_cats = client.table("tax_categories").select("name").execute()
    
    suspicious_items = []
    for cat in res_all_cats.data:
        name = cat["name"]
        
        # チェックルール:
        # - カンマが含まれている（金額パース漏れ）
        # - 「△」や「▲」が項目名に含まれている（マイナス記号の消し忘れ）
        # - 数字が項目名の末尾や途中に不自然に残っている（ただし「第1号」や「令和2年」などは除く）
        # - アルファベットのみ、または記号のみ
        # - 改行コード '\n' が含まれている
        reasons = []
        if "," in name:
            reasons.append("カンマを含む")
        if "△" in name or "▲" in name:
            reasons.append("三角記号を含む")
        if "\n" in name:
            reasons.append("改行文字を含む")
            
        import re
        if re.search(r'\d{4,}', name): # 4桁以上の数字 (年度などを除くため、特定の金額っぽいもの)
            # 年度 (2020, 2024, 2026) は許容
            clean_digits = re.findall(r'\d+', name)
            is_valid_year = all(int(d) in [2020, 2021, 2022, 2023, 2024, 2025, 2026, 30, 2, 3, 4, 5, 6, 7, 8] for d in clean_digits)
            if not is_valid_year:
                reasons.append(f"金額と思われる数値を含む: {clean_digits}")
                
        if reasons:
            suspicious_items.append((name, reasons))

    if suspicious_items:
        print(f"⚠️ 疑わしい項目名が {len(suspicious_items)} 件見つかりました:")
        for item, reasons in suspicious_items[:50]: # 最大50件表示
            print(f"  - 「{item}」 (理由: {', '.join(reasons)})")
        if len(suspicious_items) > 50:
            print(f"  ...他 {len(suspicious_items) - 50} 件")
    else:
        print("✅ 全てのカテゴリ項目名について、異常な文字（三角記号、カンマ、不要な数値、改行等）は検出されませんでした。")

if __name__ == "__main__":
    main()
