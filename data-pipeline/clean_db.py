import os
import sys
import argparse
import re
from supabase import create_client

def main():
    parser = argparse.ArgumentParser(description="指定年度の登録データ削除と汚いカテゴリ名のクレンジング")
    parser.add_argument("--year", type=int, required=True,
                        help="クリーンアップ対象の西暦年度（例: 2024）")
    args = parser.parse_args()
    year = args.year

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.")
        sys.exit(1)

    client = create_client(url, key)

    print(f"=== {year}年度 登録データ削除とクレンジング開始 ===")

    # 1. 指定年度の歳出データの削除
    print(f"1. tax_expenditures から {year}年度のデータを削除します...")
    res_exp = client.table("tax_expenditures").delete().eq("year", year).execute()
    print(f"   -> 削除件数: {len(res_exp.data)} 件")

    # 2. 指定年度の歳入データの削除
    print(f"2. fiscal_revenue から {year}年度のデータを削除します...")
    res_rev = client.table("fiscal_revenue").delete().eq("year", year).execute()
    print(f"   -> 削除件数: {len(res_rev.data)} 件")

    # 3. 汚いカテゴリ名の削除 (tax_categories)
    # まず、数字やカンマ、△を含むような汚いカテゴリ名を全取得
    print("3. tax_categories の不要な汚いカテゴリ名をクリーンアップします...")
    res_cats = client.table("tax_categories").select("id, name").execute()
    
    dirty_cat_ids = []
    for cat in res_cats.data:
        name = cat["name"]
        is_dirty = False
        
        # 汚い条件
        if any(char in name for char in [',', '△', '▲', '\n']):
            is_dirty = True
        elif re.search(r'\d{4,}', name): # 4桁以上の数字 (年度などを除く)
            clean_digits = re.findall(r'\d+', name)
            is_valid_year = all(int(d) in [2020, 2021, 2022, 2023, 2024, 2025, 2026] for d in clean_digits)
            if not is_valid_year:
                is_dirty = True
                
        if is_dirty:
            dirty_cat_ids.append(cat["id"])

    if dirty_cat_ids:
        print(f"   -> 検出された汚いカテゴリ数: {len(dirty_cat_ids)} 件")
        # 削除実行
        # 制約上、下層のレベル3から順に削除する必要があります
        # 簡易的に、IDリストを指定して削除します（参照がない限り削除可能です）
        delete_count = 0
        
        # 何度かループさせて親子関係の制約をクリアしながら削除 (最大3回ループ)
        for loop in range(3):
            sub_count = 0
            for i in range(0, len(dirty_cat_ids), 100):
                chunk = dirty_cat_ids[i:i+100]
                try:
                    res_del = client.table("tax_categories").delete().in_("id", chunk).execute()
                    sub_count += len(res_del.data)
                except Exception as e:
                    # 親子制約でまだ消せないものは次のループで消す
                    pass
            delete_count += sub_count
            if sub_count == 0:
                break
                
        print(f"   -> 削除成功したカテゴリ数: {delete_count} 件")
    else:
        print("   -> 汚いカテゴリ名は検出されませんでした。")

    print(f"\n=== {year}年度 クレンジング完了 ===")

if __name__ == "__main__":
    main()
