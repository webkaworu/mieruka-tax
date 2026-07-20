"""
決算書データベース（bb.mof.go.jp）の決算PDFから
歳入・歳出データを抽出するパーサー
"""
import pdfplumber
import re
from typing import Optional, List, Dict, Any


class SettlementBookParser:
    """決算書データベースのPDFパーサー（pdfplumber テーブル抽出ベース）"""

    # 歳入テーブルのカラムインデックス
    REVENUE_COL_NAME = 0       # 主管・部・款・項
    REVENUE_COL_AMOUNT = 3     # 収納済歳入額(円)

    # 歳出テーブルのカラムインデックス
    EXPENDITURE_COL_NAME = 0   # 所管・組織・項
    EXPENDITURE_COL_AMOUNT = 6 # 支出済歳出額(円)

    # 歳入テーブルの列数
    REVENUE_NUM_COLS = 6
    # 歳出テーブルの列数
    EXPENDITURE_NUM_COLS = 9

    def __init__(self):
        # 所管名のリスト
        self.shokan_names = [
            '皇室費', '国会', '裁判所', '会計検査院', '内閣',
            '内閣府', 'デジタル庁', '防災庁', '総務省', '法務省',
            '外務省', '財務省', '文部科学省', '厚生労働省',
            '農林水産省', '経済産業省', '国土交通省', '環境省', '防衛省',
        ]

    def parse(self, file_path: str) -> dict:
        """
        PDFを解析して歳入・歳出データを返す

        Returns:
            {
                "revenue_total": int,       # 歳入合計（円）
                "expenditure_total": int,   # 歳出合計（円）
                "revenue_items": [...],     # 歳入項目リスト
                "expenditure_items": [...], # 歳出項目リスト
                "amount_unit": "円",        # 金額単位
            }
        """
        result = {
            "revenue_total": 0,
            "expenditure_total": 0,
            "revenue_items": [],
            "expenditure_items": [],
            "amount_unit": "円",
        }

        with pdfplumber.open(file_path) as pdf:
            section = None  # 現在のセクション: 'revenue' or 'expenditure'
            current_shokan = ""    # 歳出: 現在の所管
            current_soshiki = ""   # 歳出: 現在の組織
            current_shukan = ""    # 歳入: 現在の主管

            for page_idx, page in enumerate(pdf.pages):
                tables = page.extract_tables()
                if not tables:
                    continue

                for table in tables:
                    if not table or len(table) < 2:
                        continue

                    num_cols = len(table[0])

                    # 1行目または2行目のテキストを取得してヘッダー判定
                    row0_text = ' '.join([str(c) for c in table[0] if c]).replace(' ', '')
                    row1_text = ' '.join([str(c) for c in table[1] if c]).replace(' ', '') if len(table) > 1 else ''
                    
                    # セクション判定
                    if num_cols == self.REVENUE_NUM_COLS and ('歳入予算額' in row1_text or '歳入' in row0_text):
                        section = 'revenue'
                    elif num_cols == self.EXPENDITURE_NUM_COLS and ('歳出予算額' in row1_text or '歳出' in row0_text):
                        section = 'expenditure'
                    else:
                        # 決算の目次や他の表はスキップ
                        continue

                    # データ行の解析（ヘッダーを除く）
                    start_row_idx = 2 if len(table) > 2 else 1
                    for row_idx in range(start_row_idx, len(table)):
                        row = table[row_idx]
                        if not row:
                            continue

                        # セクションに応じたカラムインデックス設定
                        col_name = self.REVENUE_COL_NAME if section == 'revenue' else self.EXPENDITURE_COL_NAME
                        col_amount = self.REVENUE_COL_AMOUNT if section == 'revenue' else self.EXPENDITURE_COL_AMOUNT

                        name_raw = row[col_name]
                        if not name_raw:
                            continue

                        # 複数行の改行を削除し、空白を詰める
                        name = name_raw.replace('\n', '').replace(' ', '').strip()
                        if not name:
                            continue

                        amount_raw = row[col_amount]

                        # 金額セルが空またはNone -> 所管名/組織名/主管名のヘッダー行
                        if not amount_raw or str(amount_raw).strip() == '':
                            detected_shokan = self._detect_shokan(name)
                            if detected_shokan:
                                if section == 'expenditure':
                                    current_shokan = detected_shokan
                                    current_soshiki = ""
                                else:
                                    current_shukan = detected_shokan
                            continue

                        # 金額のパース
                        amount_str = str(amount_raw).replace(',', '').replace(' ', '').strip()
                        if amount_str.startswith('△') or amount_str.startswith('-'):
                            amount_str = '-' + amount_str.replace('△', '').replace('-', '')
                        
                        try:
                            amount = int(amount_str)
                        except ValueError:
                            # 数値変換できない場合はスキップ
                            continue

                        # 特殊な行（歳入・歳出の合計行）の判定
                        if '歳入合計' in name:
                            result["revenue_total"] = amount
                            continue
                        elif '歳出合計' in name:
                            result["expenditure_total"] = amount
                            continue

                        if section == 'revenue':
                            # 歳入の処理
                            if '主管計' in name:
                                result["revenue_items"].append({
                                    "name": name,
                                    "amount": amount,
                                    "amount_unit": "円",
                                    "shukan": current_shukan,
                                    "page": page_idx + 1,
                                    "is_subtotal": True,
                                })
                            else:
                                result["revenue_items"].append({
                                    "name": name,
                                    "amount": amount,
                                    "amount_unit": "円",
                                    "shukan": current_shukan,
                                    "page": page_idx + 1,
                                    "is_subtotal": False,
                                })

                        elif section == 'expenditure':
                            # 歳出の処理
                            if '所管合計' in name:
                                result["expenditure_items"].append({
                                    "name": name,
                                    "amount": amount,
                                    "amount_unit": "円",
                                    "level": 1,
                                    "shokan": current_shokan,
                                    "soshiki": "",
                                    "page": page_idx + 1,
                                    "is_subtotal": True,
                                })
                                current_soshiki = ""
                            elif name == '計':
                                result["expenditure_items"].append({
                                    "name": f"{current_soshiki or current_shokan} 計",
                                    "amount": amount,
                                    "amount_unit": "円",
                                    "level": 2,
                                    "shokan": current_shokan,
                                    "soshiki": current_soshiki,
                                    "page": page_idx + 1,
                                    "is_subtotal": True,
                                })
                                current_soshiki = ""
                            else:
                                # 組織名判定（ルックアヘッド）
                                is_soshiki_start = False
                                if current_soshiki == "":
                                    # 次の行を取得して組織名か判定
                                    next_row_idx = row_idx + 1
                                    if next_row_idx < len(table):
                                        next_row = table[next_row_idx]
                                        if next_row and next_row[col_name]:
                                            next_name = next_row[col_name].replace('\n', '').replace(' ', '').strip()
                                            # 次の行が同じ名前、もしくは現在の名前で始まる場合、これは組織名とみなす
                                            if next_name == name or next_name.startswith(name):
                                                is_soshiki_start = True

                                if is_soshiki_start:
                                    current_soshiki = name
                                    result["expenditure_items"].append({
                                        "name": name,
                                        "amount": amount,
                                        "amount_unit": "円",
                                        "level": 2,
                                        "shokan": current_shokan,
                                        "soshiki": current_soshiki,
                                        "page": page_idx + 1,
                                        "is_subtotal": True,
                                    })
                                else:
                                    result["expenditure_items"].append({
                                        "name": name,
                                        "amount": amount,
                                        "amount_unit": "円",
                                        "level": 3,
                                        "shokan": current_shokan,
                                        "soshiki": current_soshiki,
                                        "page": page_idx + 1,
                                        "is_subtotal": False,
                                    })

        return result

    def _detect_shokan(self, name: str) -> Optional[str]:
        """所管名を検出。'内閣府所管' -> '内閣府' のように正規化"""
        clean = name.replace('所管', '').replace('主管', '')
        for shokan in self.shokan_names:
            if clean.startswith(shokan):
                return shokan
        return None


if __name__ == "__main__":
    import sys
    import json

    path = sys.argv[1] if len(sys.argv) > 1 else "data/DL202472001.pdf"
    parser = SettlementBookParser()
    data = parser.parse(path)

    print(f"\n=== 解析結果 ===")
    print(f"歳入総計: {data['revenue_total']:,} 円")
    print(f"歳出総計: {data['expenditure_total']:,} 円")
    print(f"歳入項目数: {len(data['revenue_items'])}")
    print(f"歳出項目数: {len(data['expenditure_items'])}")

    print(f"\n--- 歳出 所管別合計 ---")
    for item in data["expenditure_items"]:
        if item.get("is_subtotal") and "所管合計" in item["name"]:
            oku = item["amount"] / 100_000_000
            print(f"  {item['name']}: {item['amount']:,} 円 ({oku:,.1f} 億円)")
