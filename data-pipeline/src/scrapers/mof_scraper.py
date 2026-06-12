import requests
from bs4 import BeautifulSoup
import os

class MOFScraper:
    # ユーザーから提供された確実なURL (令和6年度 予算のポイント)
    DEFAULT_PDF_URL = "https://www.mof.go.jp/policy/budget/budger_workflow/budget/fy2024/seifuan2024/45.pdf"
    
    def __init__(self, download_dir="/tmp/mieruka-tax-downloads"):
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

    def download_pdf(self, url, filename):
        file_path = os.path.join(self.download_dir, filename)
        print(f"Downloading {url} to {file_path}...")
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        with open(file_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return file_path

if __name__ == "__main__":
    scraper = MOFScraper()
    url = scraper.get_latest_budget_pdf_url()
    if url:
        print(f"Target PDF URL: {url}")
    else:
        print("No PDF found.")
