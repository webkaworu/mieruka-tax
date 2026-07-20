-- tax_expenditures テーブルに新カラムを追加
ALTER TABLE tax_expenditures
ADD COLUMN IF NOT EXISTS data_type TEXT CHECK (data_type IN ('budget', 'settlement')),
ADD COLUMN IF NOT EXISTS account_type TEXT CHECK (account_type IN ('general', 'special', 'government_related')),
ADD COLUMN IF NOT EXISTS budget_revision INTEGER;

-- 既存の entry_type から data_type への移行 (初期データ用)
UPDATE tax_expenditures
SET data_type = CASE
    WHEN entry_type = 'actual' THEN 'settlement'
    ELSE 'budget'
END
WHERE data_type IS NULL;

-- 既存データのデフォルト会計区分を general (一般会計) に設定
UPDATE tax_expenditures
SET account_type = 'general'
WHERE account_type IS NULL;

-- 既存データのデフォルト補正予算区分を 0 (当初予算) に設定
UPDATE tax_expenditures
SET budget_revision = 0
WHERE budget_revision IS NULL AND entry_type = 'budget';

-- fiscal_revenue (歳入データ) テーブルの新規作成
CREATE TABLE IF NOT EXISTS fiscal_revenue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    year INTEGER NOT NULL,
    amount BIGINT NOT NULL,
    data_type TEXT NOT NULL CHECK (data_type IN ('budget', 'settlement')),
    account_type TEXT NOT NULL CHECK (account_type IN ('general', 'special', 'government_related')),
    budget_revision INTEGER, -- 決算の場合はNULL
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- fiscal_availability (決算公開状況) テーブルの新規作成
CREATE TABLE IF NOT EXISTS fiscal_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('general', 'special', 'government_related')),
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (year, account_type)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_tax_expenditures_filters
ON tax_expenditures(org_id, year, data_type, account_type, budget_revision);

CREATE INDEX IF NOT EXISTS idx_fiscal_revenue_filters
ON fiscal_revenue(org_id, year, data_type, account_type, budget_revision);

CREATE INDEX IF NOT EXISTS idx_fiscal_availability_year
ON fiscal_availability(year);

-- 行レベルセキュリティ (RLS) の設定
ALTER TABLE fiscal_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_availability ENABLE ROW LEVEL SECURITY;

-- 参照ポリシーの設定 (公開読み取り許可)
CREATE POLICY "Allow public read access for fiscal_revenue" ON fiscal_revenue FOR SELECT USING (true);
CREATE POLICY "Allow public read access for fiscal_availability" ON fiscal_availability FOR SELECT USING (true);
