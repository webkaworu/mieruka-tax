import subprocess
import sys
import os

import argparse

def run_cmd(args):
    cmd = [sys.executable, "main.py"] + args
    print(f"--- 実行中: {' '.join(cmd)} ---")
    res = subprocess.run(cmd, capture_output=True, text=True)
    return res

def main():
    parser = argparse.ArgumentParser(description="国家財政データ一括収集バッチ処理")
    parser.add_argument("--year", type=int, default=None, help="対象西暦年度。指定しない場合は2020年〜2026年が対象となります。")
    args_parsed = parser.parse_args()

    if args_parsed.year:
        years = [args_parsed.year]
    else:
        years = range(2020, 2027)

    accounts = ["general", "special", "government_related"]

    print("==================================================")
    print("国家財政データ一括収集バッチ処理を開始します")
    print(f"対象年度: {', '.join(map(str, years))}")
    print("==================================================")

    for year in years:
        print(f"\n===== 【年度: {year}】の処理を開始します =====")

        # 1. 予算 - 当初予算 (initial)
        print(f"--- [予算] {year}年度 当初予算の処理 ---")
        for acc in accounts:
            res = run_cmd(["--year", str(year), "--data-type", "budget", "--budget-type", "initial", "--account-type", acc])
            if res.returncode != 0:
                if "404" in res.stderr or "Not Found" in res.stderr:
                    print(f"[スキップ] 当初予算 {year} ({acc}): ファイルがありません (404)")
                else:
                    print(f"[エラー] 致命的なエラーが発生しました: {res.stderr}")
                    sys.exit(1)
            else:
                print(f"[完了] 当初予算 {year} ({acc}) の登録成功")

        # 2. 予算 - 暫定予算 (provisional)
        print(f"--- [予算] {year}年度 暫定予算の処理 ---")
        for acc in accounts:
            res = run_cmd(["--year", str(year), "--data-type", "budget", "--budget-type", "provisional", "--account-type", acc])
            if res.returncode != 0:
                if "404" in res.stderr or "Not Found" in res.stderr:
                    # 暫定予算は無い年度が多いため、404は無視します
                    pass
                else:
                    print(f"[エラー] 致命的なエラーが発生しました: {res.stderr}")
                    sys.exit(1)
            else:
                print(f"[完了] 暫定予算 {year} ({acc}) の登録成功")

        # 3. 予算 - 補正予算 (revision_X)
        print(f"--- [予算] {year}年度 補正予算の処理 ---")
        for acc in ["general", "special"]:
            rev = 1
            while True:
                res = run_cmd(["--year", str(year), "--data-type", "budget", "--budget-type", f"revision_{rev}", "--account-type", acc])
                if res.returncode != 0:
                    if "404" in res.stderr or "Not Found" in res.stderr:
                        # 404が出たらこれ以上のリビジョンは無いのでループ終了
                        print(f"[終了] 補正予算 {year} ({acc}): 第 {rev} 号はありませんでした (404終了)")
                        break
                    else:
                        print(f"[エラー] 致命的なエラーが発生しました: {res.stderr}")
                        sys.exit(1)
                else:
                    print(f"[完了] 補正予算 {year} ({acc}) 第 {rev} 号の登録成功")
                    rev += 1

        # 4. 決算 (settlement)
        print(f"--- [決算] {year}年度 決算の処理 ---")
        for acc in accounts:
            res = run_cmd(["--year", str(year), "--data-type", "settlement", "--account-type", acc])
            if res.returncode != 0:
                if "404" in res.stderr or "Not Found" in res.stderr:
                    print(f"[スキップ] 決算 {year} ({acc}): ファイルがありません (404)")
                else:
                    print(f"[エラー] 致命的なエラーが発生しました: {res.stderr}")
                    sys.exit(1)
            else:
                print(f"[完了] 決算 {year} ({acc}) の登録成功")

    print("\n==================================================")
    print("すべてのバッチ処理が完了しました")
    print("==================================================")

if __name__ == "__main__":
    main()
