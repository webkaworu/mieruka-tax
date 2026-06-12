-- 1. 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. organizations (組織・自治体) テーブルの作成
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    lg_code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('national', 'prefecture', 'city')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. tax_categories (費目マスタ) テーブルの作成
CREATE TABLE tax_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES tax_categories(id),
    level INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. tax_expenditures (支出データ) テーブルの作成
CREATE TABLE tax_expenditures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    category_id UUID REFERENCES tax_categories(id) NOT NULL,
    year INTEGER NOT NULL,
    amount BIGINT NOT NULL,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('budget', 'actual')),
    source_url TEXT,
    source_details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. conversion_units (換算単位マスタ) テーブルの作成
CREATE TABLE conversion_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    unit_price INTEGER NOT NULL,
    icon_key TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. インデックスの作成
CREATE INDEX idx_tax_expenditures_org_year ON tax_expenditures(org_id, year);
CREATE INDEX idx_tax_categories_parent ON tax_categories(parent_id);

-- 7. 行レベルセキュリティ (RLS) の設定
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_expenditures ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_units ENABLE ROW LEVEL SECURITY;

-- 8. ポリシーの設定 (参照のみ全ユーザーに許可)
CREATE POLICY "Allow public read access for organizations" ON organizations FOR SELECT USING (true);
CREATE POLICY "Allow public read access for tax_categories" ON tax_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access for tax_expenditures" ON tax_expenditures FOR SELECT USING (true);
CREATE POLICY "Allow public read access for conversion_units" ON conversion_units FOR SELECT USING (true);

-- 9. (任意) 初期データの投入 (日本国のみ)
INSERT INTO organizations (name, lg_code, type) VALUES ('日本国', '000000', 'national');
