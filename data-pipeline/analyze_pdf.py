"""
予算書PDFの構造を解析するスクリプト
DL202611001.pdf（令和8年度予算 一般会計）の中身を確認する
"""
import pdfplumber
import sys
import json

PDF_PATH = "data/DL202611001.pdf"

def analyze_pdf(path: str, max_pages: int = 10):
    """PDFの各ページからテーブルとテキストを抽出して構造を表示する"""
    with pdfplumber.open(path) as pdf:
        total_pages = len(pdf.pages)
        print(f"=== PDF解析: {path} ===")
        print(f"総ページ数: {total_pages}")
        print()

        for i, page in enumerate(pdf.pages[:max_pages]):
            print(f"--- ページ {i + 1}/{total_pages} ---")
            
            # テキスト抽出
            text = page.extract_text()
            if text:
                lines = text.strip().split('\n')
                print(f"テキスト行数: {len(lines)}")
                for line in lines[:30]:  # 最初の30行を表示
                    print(f"  TEXT: {line}")
                if len(lines) > 30:
                    print(f"  ... (残り {len(lines) - 30} 行)")
            else:
                print("  テキストなし")
            
            # テーブル抽出
            tables = page.extract_tables()
            if tables:
                print(f"テーブル数: {len(tables)}")
                for j, table in enumerate(tables):
                    print(f"  テーブル {j}: {len(table)} 行 x {len(table[0]) if table else 0} 列")
                    for k, row in enumerate(table[:10]):  # 最初の10行
                        print(f"    ROW[{k}]: {row}")
                    if len(table) > 10:
                        print(f"    ... (残り {len(table) - 10} 行)")
            else:
                print("  テーブルなし")
            
            print()

if __name__ == "__main__":
    pages = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    analyze_pdf(PDF_PATH, max_pages=pages)
