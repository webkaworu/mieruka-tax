import os
from src.scrapers.mof_scraper import MOFScraper
from src.parsers.pdf_parser import PDFParser
from src.supabase_client import get_supabase_client

def main():
    print("Starting data pipeline...")
    
    # 1. Scrape
    scraper = MOFScraper(download_dir="/tmp/mieruka-tax-downloads")
    pdf_url = scraper.get_latest_budget_pdf_url()
    
    if not pdf_url:
        print("No budget PDF found.")
        return

    print(f"Found latest budget PDF: {pdf_url}")
    pdf_path = scraper.download_pdf(pdf_url, "latest_budget.pdf")
    
    # 2. Parse
    parser = PDFParser()
    extracted_data = parser.parse_budget_points(pdf_path)
    print(f"Extracted {len(extracted_data)} data points.")
    
    # 3. Load to Supabase
    client = get_supabase_client()
    
    # 日本国の組織IDを取得
    org_res = client.table("organizations").select("id").eq("lg_code", "000000").execute()
    if not org_res.data:
        print("Organization 'Japan (national)' not found in database.")
        return
    org_id = org_res.data[0]["id"]
    
    # 年度をURLや内容から推測する (例: "r6" -> 2024, "2024" -> 2024)
    import re
    year_match = re.search(r'([r\d]+)年度', pdf_url)
    current_year = 2024 # デフォルト
    if year_match:
        year_str = year_match.group(1)
        if year_str.startswith('r'): # 令和
            current_year = 2018 + int(year_str[1:])
        elif year_str.isdigit():
            current_year = int(year_str)
    
    print(f"Target Fiscal Year: {current_year}")
    
    for item in extracted_data:
        cat_name = item["category"]
        amount = item["amount"]
        
        # カテゴリの取得または作成
        cat_res = client.table("tax_categories").select("id").eq("name", cat_name).execute()
        if cat_res.data:
            cat_id = cat_res.data[0]["id"]
        else:
            new_cat = client.table("tax_categories").insert({
                "name": cat_name,
                "level": 1
            }).execute()
            cat_id = new_cat.data[0]["id"]
        
        # 支出データのアップサート
        client.table("tax_expenditures").upsert({
            "org_id": org_id,
            "category_id": cat_id,
            "year": current_year,
            "amount": amount,
            "entry_type": "budget",
            "source_url": pdf_url,
            "source_details": {"page": item["page"]}
        }, on_conflict="org_id, category_id, year, entry_type").execute()
        
        print(f"Loaded: {cat_name} -> {amount} yen")
    
    print("Pipeline finished successfully.")

if __name__ == "__main__":
    main()
