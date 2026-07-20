"""
予算書PDFの歳入歳出セクションを解析するスクリプト
甲号 歳入歳出予算（ページ27～86付近）を解析
"""
import pdfplumber
import sys

PDF_PATH = "data/DL202611001.pdf"

def analyze_section(path: str, start_page: int, end_page: int):
    """特定ページ範囲を詳細解析する"""
    with pdfplumber.open(path) as pdf:
        for i in range(start_page - 1, min(end_page, len(pdf.pages))):
            page = pdf.pages[i]
            print(f"\n=== ページ {i + 1} ===")
            
            text = page.extract_text()
            if text:
                for line in text.strip().split('\n'):
                    print(f"  TEXT: {line}")
            
            tables = page.extract_tables()
            if tables:
                for j, table in enumerate(tables):
                    print(f"  TABLE[{j}]: {len(table)} rows x {len(table[0]) if table else 0} cols")
                    for k, row in enumerate(table):
                        print(f"    ROW[{k}]: {row}")

if __name__ == "__main__":
    start = int(sys.argv[1]) if len(sys.argv) > 1 else 27
    end = int(sys.argv[2]) if len(sys.argv) > 2 else 35
    analyze_section(PDF_PATH, start, end)
