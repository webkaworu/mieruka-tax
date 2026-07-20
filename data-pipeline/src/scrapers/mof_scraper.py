import requests
from bs4 import BeautifulSoup
import os

class MOFScraper:
    # ユーザーから提供された確実なURL (令和6年度 予算のポイント)
    DEFAULT_PDF_URL = "https://www.mof.go.jp/policy/budget/budger_workflow/budget/fy2024/seifuan2024/45.pdf"
    
    def __init__(self, download_dir="data"):
        self.download_dir = download_dir
        if not os.path.exists(self.download_dir):
            os.makedirs(self.download_dir)

    def get_latest_budget_pdf_url(self):
        """
        最新の予算PDFリンクを取得する。
        現在は、確実に存在するURLを優先して返す。
        """
        # サイト構造の変化に強いため、まずはデフォルトURLを返す
        return self.DEFAULT_PDF_URL

    def build_budget_book_url(self, year: int, budget_type: str, account_type: str) -> str:
        """
        予算書・決算書データベース（bb.mof.go.jp）のURLを組み立てる。
        
        Args:
            year: 西暦年 (例: 2026)
            budget_type: 'initial' (当初), 'revision_X' (補正第X号, 例: revision_1, revision_2), 'provisional' (暫定)
            account_type: 'general' (一般), 'special' (特別), 'government_related' (政府関係)
        """
        # 予算種別コードと末尾コード
        budget_code = "1"
        suffix = "001"
        
        if budget_type == "initial":
            budget_code = "1"
            suffix = "001"
        elif budget_type.startswith("revision"):
            budget_code = "2"
            # revision_X から番号を抽出 (例: revision_2 -> 2)
            import re
            match = re.search(r'revision_(\d+)', budget_type)
            if match:
                rev_num = int(match.group(1))
            else:
                rev_num = 1  # デフォルトは1
            suffix = f"{rev_num:03d}"
        elif budget_type == "provisional":
            budget_code = "3"
            suffix = "001"
            
        # 会計区分コード
        account_code = "1"
        if account_type == "general":
            account_code = "1"
        elif account_type == "special":
            account_code = "2"
        elif account_type == "government_related":
            account_code = "3"
            
        url = f"https://www.bb.mof.go.jp/server/{year}/dlpdf/DL{year}{budget_code}{account_code}{suffix}.pdf"
        return url

    def download_pdf(self, url, filename):
        file_path = os.path.join(self.download_dir, filename)
        print(f"Downloading {url} to {file_path}...")
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        with open(file_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return file_path

    def download_budget_book(self, year: int, budget_type: str, account_type: str) -> str:
        """指定された予算書PDFをダウンロードし、そのローカルパスを返す"""
        url = self.build_budget_book_url(year, budget_type, account_type)
        filename = f"DL{year}_{budget_type}_{account_type}.pdf"
        return self.download_pdf(url, filename)

    def build_settlement_book_url(self, year: int, account_type: str) -> str:
        """
        決算書データベース（bb.mof.go.jp）の決算PDFのURLを組み立てる。
        
        Args:
            year: 西暦年 (例: 2024)
            account_type: 'general' (一般), 'special' (特別), 'government_related' (政府関係)
        """
        # 決算の場合、type_codeは会計区分ごとに固定の2桁コード
        settlement_codes = {
            "general": "72",            # 一般会計 歳入歳出決算
            "special": "75",            # 特別会計 歳入歳出決算
            "government_related": "76", # 政府関係機関 決算
        }
        type_code = settlement_codes.get(account_type, "72")
        suffix = "001"
        
        url = f"https://www.bb.mof.go.jp/server/{year}/dlpdf/DL{year}{type_code}{suffix}.pdf"
        return url

    def download_settlement_book(self, year: int, account_type: str) -> str:
        """指定された決算書PDFをダウンロードし、そのローカルパスを返す"""
        url = self.build_settlement_book_url(year, account_type)
        filename = f"DL{year}_settlement_{account_type}.pdf"
        return self.download_pdf(url, filename)



if __name__ == "__main__":
    scraper = MOFScraper()
    url = scraper.build_budget_book_url(2026, "initial", "general")
    print(f"Generated URL: {url}")
    # 期待値: https://www.bb.mof.go.jp/server/2026/dlpdf/DL202611001.pdf

