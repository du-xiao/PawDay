ALTER TABLE "Expense" ADD COLUMN "itemName" TEXT;

UPDATE "Expense"
SET "itemName" = SUBSTR(TRIM("notes"), 1, 40)
WHERE "notes" IS NOT NULL
  AND TRIM("notes") <> ''
  AND (
    ("itemName" IS NULL OR TRIM("itemName") = '')
    OR ("merchant" IS NOT NULL AND TRIM("itemName") = TRIM("merchant"))
  );
