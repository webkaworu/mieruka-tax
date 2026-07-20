import os
import argparse
import sys
from src.scrapers.mof_scraper import MOFScraper
from src.parsers.budget_book_parser import BudgetBookParser
from src.loaders.budget_book_loader import BudgetBookLoader

def main():
    parser = argparse.ArgumentParser(description="国家財政データ収集パイプライン")
    parser.add_argument("--source", choices=["bb", "local"], default="bb",
                        help="データソース。'bb'は財務省データベースからダウンロード、'local'はローカルファイルを指定。")
    parser.add_argument("--file", default=None,
                        help="ローカルのPDFファイルパス。(--source=localの場合のみ有効)")
    parser.add_argument("--year", type=int, default=2026,
                        help="対象西暦年度。 (デフォルト: 2026)")
    parser.add_argument("--data-type", choices=["budget", "settlement"], default="budget",
                        help="データ種別。 (budget: 予算, settlement: 決算。デフォルト: budget)")
    parser.add_argument("--budget-type", default="initial",
                        help="予算種別。 (initial: 当初, provisional: 暫定, revision_N: 補正第N号。デフォルト: initial。※決算では無視されます)")
    parser.add_argument("--account-type", choices=["general", "special", "government_related"], default="general",
                        help="会計区分。 (デフォルト: general)")
    parser.add_argument("--dry-run", action="store_true",
                        help="データベースにデータを書き込まず、動作ログのみ出力します。")

    args = parser.parse_args()

    # budget_typeの簡易形式バリデーション (予算の場合のみ)
    if args.data_type == "budget":
        if args.budget_type not in ["initial", "provisional"] and not args.budget_type.startswith("revision_"):
            print("エラー: --budget-type は 'initial', 'provisional', または 'revision_N' (例: revision_1, revision_2) の形式で指定してください。", file=sys.stderr)
            sys.exit(1)
    else:
        if args.budget_type != "initial":
            print("警告: 決算データ(--data-type=settlement)では --budget-type は無視されます。", file=sys.stderr)

    print("=== データパイプライン開始 ===")
    print(f"パラメータ: source={args.source}, year={args.year}, data_type={args.data_type}, budget_type={args.budget_type if args.data_type == 'budget' else 'N/A'}, account_type={args.account_type}, dry_run={args.dry_run}")

    # 1. データ収集 (ダウンロード)
    pdf_path = ""
    pdf_url = ""

    scraper = MOFScraper(download_dir="data")

    if args.source == "bb":
        if args.data_type == "settlement":
            pdf_url = scraper.build_settlement_book_url(args.year, args.account_type)
            print(f"自動ダウンロード対象URL (決算): {pdf_url}")
            try:
                pdf_path = scraper.download_settlement_book(args.year, args.account_type)
            except Exception as e:
                print(f"エラー: 決算PDFのダウンロードに失敗しました。URL: {pdf_url}", file=sys.stderr)
                print(e, file=sys.stderr)
                sys.exit(1)
        else:
            pdf_url = scraper.build_budget_book_url(args.year, args.budget_type, args.account_type)
            print(f"自動ダウンロード対象URL (予算): {pdf_url}")
            try:
                pdf_path = scraper.download_budget_book(args.year, args.budget_type, args.account_type)
            except Exception as e:
                print(f"エラー: 予算PDFのダウンロードに失敗しました。URL: {pdf_url}", file=sys.stderr)
                print(e, file=sys.stderr)
                sys.exit(1)
    else:
        if not args.file:
            print("エラー: --source=local の場合は --file 引数でPDFファイルパスを指定してください。", file=sys.stderr)
            sys.exit(1)
        pdf_path = args.file
        pdf_url = f"local://{os.path.basename(pdf_path)}"
        if not os.path.exists(pdf_path):
            print(f"エラー: 指定されたファイルが見つかりません。 {pdf_path}", file=sys.stderr)
            sys.exit(1)

    print(f"解析対象ファイル: {pdf_path}")

    # 2. PDFのパース
    if args.data_type == "settlement":
        from src.parsers.settlement_book_parser import SettlementBookParser
        pdf_parser = SettlementBookParser()
    else:
        pdf_parser = BudgetBookParser()

    try:
        extracted_data = pdf_parser.parse(pdf_path)
    except Exception as e:
        print(f"エラー: PDFの解析に失敗しました。 {pdf_path}", file=sys.stderr)
        print(e, file=sys.stderr)
        sys.exit(1)

    # 単位表示切り替え
    unit_str = extracted_data.get("amount_unit", "千円")
    print(f"解析成功: 歳入項目数={len(extracted_data['revenue_items'])}, 歳出項目数={len(extracted_data['expenditure_items'])}")
    print(f"歳入総計: {extracted_data['revenue_total']:,} {unit_str}")
    print(f"歳出総計: {extracted_data['expenditure_total']:,} {unit_str}")
    # 3. Supabaseへロード
    loader = BudgetBookLoader()

    if args.data_type == "settlement":
        budget_revision = None
        data_type = "settlement"
        entry_type = "actual"
    else:
        # 補正予算のリビジョン番号マッピング (当初=0, 暫定=0, 補正N=Nとする)
        budget_revision = 0
        if args.budget_type.startswith("revision_"):
            import re
            match = re.search(r'revision_(\d+)', args.budget_type)
            if match:
                budget_revision = int(match.group(1))
            else:
                budget_revision = 1
        data_type = "budget"
        entry_type = "budget"

    try:
        loader.load(
            data=extracted_data,
            year=args.year,
            account_type=args.account_type,
            budget_revision=budget_revision,
            data_type=data_type,
            entry_type=entry_type,
            source_url=pdf_url,
            dry_run=args.dry_run
        )
    except Exception as e:
        print("エラー: データベースへの登録に失敗しました。", file=sys.stderr)
        print(e, file=sys.stderr)
        sys.exit(1)

    print("=== データパイプライン正常終了 ===")

if __name__ == "__main__":
    main()

