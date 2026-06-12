import pdfplumber
import pandas as pd
import re

class PDFParser:
    def __init__(self):
        pass

    def extract_tables(self, file_path):
        """
        PDFから全ての表を抽出する
        """
        tables_data = []
        with pdfplumber.open(file_path) as pdf:
            for i, page in enumerate(pdf.pages):
                tables = page.extract_tables()
                for j, table in enumerate(tables):
                    if table:
                        df = pd.DataFrame(table)
                        tables_data.append({
                            "page": i + 1,
                            "table_index": j,
                            "df": df
                        })
        return tables_data

    def parse_budget_points(self, file_path):
        """
        「一般会計予算（ポイント）」形式のPDFから主要な支出データを抽出する
        """
        raw_tables = self.extract_tables(file_path)
        all_data = []

        for item in raw_tables:
            df = item["df"]
            # 金額（兆円、億円）が含まれていそうな行を探す
            for _, row in df.iterrows():
                row_str = " ".join([str(val) for val in row.values if val])
                
                # 費目と金額のパターンを探す (例: "社会保障 377,193 億円")
                # 正規表現で「カテゴリ名」と「数字（カンマ・小数点含む）」を抽出
                match = re.search(r'([^\d\s]+)\s+([\d,.]+)\s*億円', row_str)
                if match:
                    category_name = match.group(1).strip()
                    amount_str = match.group(2).replace(',', '')
                    try:
                        amount_oku = float(amount_str)
                        # 円単位に変換 (1億円 = 100,000,000円)
                        amount_yen = int(amount_oku * 100000000)
                        all_data.append({
                            "category": category_name,
                            "amount": amount_yen,
                            "page": item["page"]
                        })
                    except ValueError:
                        continue
        
        return all_data

if __name__ == "__main__":
    parser = PDFParser()
    # tables = parser.extract_tables("downloads/latest_budget.pdf")
    # print(f"Found {len(tables)} tables.")
