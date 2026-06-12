-- tax_expenditures テーブルに一意制約を追加
ALTER TABLE tax_expenditures
ADD CONSTRAINT unique_tax_expenditure UNIQUE (org_id, category_id, year, entry_type);
