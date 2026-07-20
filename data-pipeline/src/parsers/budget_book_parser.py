"""
予算書・決算書データベース（bb.mof.go.jp）のPDFから
歳入・歳出データを抽出するパーサー

対応形式:
- 甲号 歳入歳出予算（一般会計予算書PDF）
- 歳入: 主管 → 部 → 款 → 項 → 金額（千円）
- 歳出: 所管 → 組織 → 項 → 金額（千円）
"""
import pdfplumber
import re
from typing import Optional


class BudgetBookParser:
    """予算書・決算書データベースのPDFパーサー"""

    def __init__(self):
        # 所管名のリスト（歳出セクションで所管を識別するために使用）
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
                "revenue_total": int,       # 歳入総計（千円）
                "expenditure_total": int,   # 歳出総計（千円）
                "revenue_items": [...],     # 歳入項目リスト
                "expenditure_items": [...], # 歳出項目リスト
            }
        """
        result = {
            "revenue_total": 0,
            "expenditure_total": 0,
            "revenue_items": [],
            "expenditure_items": [],
        }

        with pdfplumber.open(file_path) as pdf:
            section = None  # 現在のセクション: 'revenue' or 'expenditure'
            current_shokan = ""    # 歳出: 現在の所管
            current_soshiki = ""   # 歳出: 現在の組織
            current_shukan = ""    # 歳入: 現在の主管

            for page_idx, page in enumerate(pdf.pages):
                text = page.extract_text()
                if not text:
                    continue

                lines = text.strip().split('\n')

                # セクション判定（ヘッダー行で判定）
                # 形式: "甲号 歳入歳出予算 歳入 27" or "42 甲号 歳入歳出予算 歳出"
                first_line = lines[0] if lines else ""
                first_clean = first_line.replace(' ', '')
                if '甲号歳入歳出予算' in first_clean:
                    header_content = first_clean.replace('甲号歳入歳出予算', '')
                    if '歳出' in header_content:
                        section = 'expenditure'
                    elif '歳入' in header_content:
                        section = 'revenue'

                # 甲号セクション外はスキップ
                if section is None:
                    continue

                # 甲号セクション終了の判定（乙号に到達）
                clean_text = text.replace(' ', '')
                if '乙号' in clean_text and '継続費' in clean_text:
                    break

                for line in lines:
                    # ヘッダー行やページ番号行をスキップ
                    stripped = line.strip()
                    if not stripped:
                        continue
                    if stripped.startswith('甲号') or stripped.startswith('所 管') or stripped.startswith('主 管'):
                        continue
                    if stripped == '(千円)' or stripped == '歳 出' or stripped == '歳 入':
                        continue
                    if re.match(r'^\d+ 甲号', stripped):
                        continue

                    # 歳入総計 / 歳出総計
                    total_match = re.search(r'歳\s*入\s*総\s*計\s+([\d,]+)', stripped)
                    if total_match:
                        result["revenue_total"] = int(total_match.group(1).replace(',', ''))
                        continue

                    total_match = re.search(r'歳\s*出\s*総\s*計\s+([\d,]+)', stripped)
                    if total_match:
                        result["expenditure_total"] = int(total_match.group(1).replace(',', ''))
                        continue

                    if section == 'expenditure':
                        self._parse_expenditure_line(
                            stripped, page_idx + 1, result,
                            current_shokan, current_soshiki,
                        )
                        # 所管の更新
                        new_shokan = self._detect_shokan(stripped)
                        if new_shokan:
                            current_shokan = new_shokan
                            current_soshiki = ""

                    elif section == 'revenue':
                        self._parse_revenue_line(
                            stripped, page_idx + 1, result,
                            current_shukan,
                        )
                        # 主管の更新
                        new_shukan = self._detect_shukan(stripped)
                        if new_shukan:
                            current_shukan = new_shukan

        return result

    def _parse_amount_str(self, amount_str: str) -> int:
        clean = amount_str.replace(',', '').replace(' ', '').strip()
        if clean in ['△', '▲', '-', '']:
            return 0
        if '△' in clean or '▲' in clean:
            clean = '-' + clean.replace('△', '').replace('▲', '')
        try:
            return int(clean)
        except ValueError:
            return 0

    def _parse_expenditure_line(
        self, line: str, page: int, result: dict,
        current_shokan: str, current_soshiki: str,
    ):
        """歳出行をパースして項目を抽出する"""
        # 「所管合計」行
        shokan_total = re.search(
            r'(.+?)\s*所\s*管\s*合\s*計\s+(.+)$', line
        )
        if shokan_total:
            shokan_name = shokan_total.group(1).replace(' ', '').strip()
            amount_part = shokan_total.group(2).strip()
            amounts = re.findall(r'(?:△\s*)?[\d,]+', amount_part)
            if amounts:
                amount = self._parse_amount_str(amounts[-1])
                result["expenditure_items"].append({
                    "name": f"{shokan_name} 所管合計",
                    "amount": amount,
                    "amount_unit": "千円",
                    "level": 1,  # 所管レベル
                    "shokan": shokan_name,
                    "soshiki": "",
                    "page": page,
                    "is_subtotal": True,
                })
                return

        # 「計」行（組織小計）
        keisan_match = re.match(r'^計\s+(.+)$', line)
        if keisan_match:
            amount_part = keisan_match.group(1).strip()
            amounts = re.findall(r'(?:△\s*)?[\d,]+', amount_part)
            if amounts:
                amount = self._parse_amount_str(amounts[-1])
                result["expenditure_items"].append({
                    "name": f"{current_soshiki or current_shokan} 計",
                    "amount": amount,
                    "amount_unit": "千円",
                    "level": 2,  # 組織レベル小計
                    "shokan": current_shokan,
                    "soshiki": current_soshiki,
                    "page": page,
                    "is_subtotal": True,
                })
                return

        # 通常の項目行: 「項名 金額」
        # △や▲が数字と分離して抽出されるケース（例: "△ 4,296"）に対応するため、スペースを詰める
        line = re.sub(r'([△▲])\s+(\d)', r'\1\2', line)

        # 右側から数値トークンをすべて剥ぎ取ることで、列数に依存せず確実に項目名と金額を分離する
        tokens = line.strip().split()
        if len(tokens) < 2:
            return

        # 単体の△や▲、マイナス記号も数値トークンの一部として許容する
        num_pattern = re.compile(r'^(?:[△▲\-]?\s*[\d,]+|0|[△▲\-]+)$')
        amounts = []
        name_tokens = []

        # 右側から数値トークンをスキャン
        for token in reversed(tokens):
            if not name_tokens and num_pattern.match(token):
                amounts.append(token)
            else:
                name_tokens.append(token)

        name_tokens.reverse()
        amounts.reverse()

        if not name_tokens or not amounts:
            return

        name = " ".join(name_tokens)

        # 項目名の末尾にスペースなしでくっついたゴミ数値をさらに剥ぎ取る
        while True:
            match = re.search(r'^(.*?)([△▲\-]?\s*[\d,]+)$', name)
            if match:
                potential_name = match.group(1).strip()
                # 組織や項の番号（例: "088" や "95"）が残った場合はそれ以上剥ぎ取らない
                if potential_name and not re.match(r'^\d+$', potential_name):
                    potential_amount_str = match.group(2)
                    amounts.insert(0, potential_amount_str)
                    name = potential_name
                    continue
            break

        # 先頭の分類コード（例: "088 " や "95 " などの2〜4桁の数値）を除去
        name = re.sub(r'^\d{2,4}\s+', '', name)

        # 補正予算の場合はもっとも右側の数値（差引額）を使用
        amount_str = amounts[-1]
        amount = self._parse_amount_str(amount_str)

        # 数値が有効かチェック（ページ番号などの誤検知を防ぐ）
        if abs(amount) < 100:
            return  # 100千円未満は項目としてありえないのでスキップ

        # 所管名・組織名が含まれる行は組織名更新のみ
        clean_name = name.replace(' ', '')

        result["expenditure_items"].append({
            "name": clean_name,
            "amount": amount,
            "amount_unit": "千円",
            "level": 3,  # 項レベル
            "shokan": current_shokan,
            "soshiki": current_soshiki,
            "page": page,
            "is_subtotal": False,
        })

    def _parse_revenue_line(
        self, line: str, page: int, result: dict,
        current_shukan: str,
    ):
        """歳入行をパースして項目を抽出する"""
        # 「計」行
        keisan_match = re.match(r'^計\s+(.+)$', line)
        if keisan_match:
            amount_part = keisan_match.group(1).strip()
            amounts = re.findall(r'(?:△\s*)?[\d,]+', amount_part)
            if amounts:
                amount = self._parse_amount_str(amounts[-1])
                result["revenue_items"].append({
                    "name": f"{current_shukan} 計",
                    "amount": amount,
                    "amount_unit": "千円",
                    "shukan": current_shukan,
                    "page": page,
                    "is_subtotal": True,
                })
                return

        # 通常の歳入項目行
        # △や▲が数字と分離して抽出されるケース（例: "△ 4,296"）に対応するため、スペースを詰める
        line = re.sub(r'([△▲])\s+(\d)', r'\1\2', line)

        # 右側から数値トークンをすべて剥ぎ取ることで、列数に依存せず確実に項目名と金額を分離する
        tokens = line.strip().split()
        if len(tokens) < 2:
            return

        # 単体の△や▲、マイナス記号も数値トークンの一部として許容する
        num_pattern = re.compile(r'^(?:[△▲\-]?\s*[\d,]+|0|[△▲\-]+)$')
        amounts = []
        name_tokens = []

        # 右側から数値トークンをスキャン
        for token in reversed(tokens):
            if not name_tokens and num_pattern.match(token):
                amounts.append(token)
            else:
                name_tokens.append(token)

        name_tokens.reverse()
        amounts.reverse()

        if not name_tokens or not amounts:
            return

        name = " ".join(name_tokens)

        # 項目名の末尾にスペースなしでくっついたゴミ数値をさらに剥ぎ取る
        while True:
            match = re.search(r'^(.*?)([△▲\-]?\s*[\d,]+)$', name)
            if match:
                potential_name = match.group(1).strip()
                # 組織や項の番号（例: "088" や "95"）が残った場合はそれ以上剥ぎ取らない
                if potential_name and not re.match(r'^\d+$', potential_name):
                    potential_amount_str = match.group(2)
                    amounts.insert(0, potential_amount_str)
                    name = potential_name
                    continue
            break

        # 先頭の分類コード（例: "088 " や "95 " などの2〜4桁の数値）を除去
        name = re.sub(r'^\d{2,4}\s+', '', name)

        # 補正予算の場合はもっとも右側の数値（差引額）を使用
        amount_str = amounts[-1]
        amount = self._parse_amount_str(amount_str)

        if abs(amount) < 100:
            return

        result["revenue_items"].append({
            "name": name,
            "amount": amount,
            "amount_unit": "千円",
            "shukan": current_shukan,
            "page": page,
            "is_subtotal": False,
        })

    def _detect_shokan(self, line: str) -> Optional[str]:
        """行から所管名を検出する"""
        clean = line.replace(' ', '')
        for name in self.shokan_names:
            if clean.startswith(name):
                return name
        return None

    def _detect_shukan(self, line: str) -> Optional[str]:
        """行から主管名を検出する"""
        clean = line.replace(' ', '')
        for name in self.shokan_names:
            if clean.startswith(name):
                return name
        return None


if __name__ == "__main__":
    import sys
    import json

    path = sys.argv[1] if len(sys.argv) > 1 else "data/DL202611001.pdf"
    parser = BudgetBookParser()
    data = parser.parse(path)

    print(f"\n=== 解析結果 ===")
    print(f"歳入総計: {data['revenue_total']:,} 千円 ({data['revenue_total'] * 1000:,} 円)")
    print(f"歳出総計: {data['expenditure_total']:,} 千円 ({data['expenditure_total'] * 1000:,} 円)")
    print(f"歳入項目数: {len(data['revenue_items'])}")
    print(f"歳出項目数: {len(data['expenditure_items'])}")

    # 歳出の所管合計のみ表示
    print(f"\n--- 歳出 所管別合計 ---")
    for item in data["expenditure_items"]:
        if item.get("is_subtotal") and "所管合計" in item["name"]:
            oku = item["amount"] * 1000 / 100_000_000
            print(f"  {item['name']}: {item['amount']:,} 千円 ({oku:,.1f} 億円)")

    # 特定項目の確認
    print(f"\n--- 検証: 特定項目 ---")
    for item in data["expenditure_items"]:
        if 'こども政策推進費' in item["name"]:
            print(f"  こども政策推進費: {item['amount']:,} 千円 (期待値: 10,976,401)")
        if 'デジタル庁共通費' in item["name"]:
            print(f"  デジタル庁共通費: {item['amount']:,} 千円 (期待値: 19,334,986)")
