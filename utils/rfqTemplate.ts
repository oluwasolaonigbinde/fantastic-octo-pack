import * as XLSX from "xlsx";

import type { CreateRfqItem } from "@/types/rfq";

/**
 * Client-side reader for the RFQ items workbook the backend serves at
 * `GET /rfqs/template`. The buyer fills the visible columns (A-H) offline; the
 * category and sub-category are picked by *name* from Excel dropdowns, but the
 * RFQ API wants ObjectIds. The workbook carries a hidden name-to-id map in
 * columns K:N for exactly this — we resolve the buyer's picks against it here and
 * hand back the `items[]` shape `POST /rfqs` expects.
 *
 * Mirrors `baiy-server/src/features/rfq/template.service.ts`; keep the sheet name
 * and column layout in sync with it.
 */

const ITEMS_SHEET = "RFQ Items";

// 0-based column indices for the visible input block (A-H).
const COL_PRODUCT = 0;
const COL_QUANTITY = 1;
const COL_CATEGORY = 2;
const COL_SUBCATEGORY = 3;
const COL_BRAND = 4;
const COL_MODEL = 5;
const COL_DESCRIPTION = 6;
const COL_NOTES = 7;

// 0-based column indices for the hidden K:N lookup block.
const LOOKUP_CATEGORY = 10; // K
const LOOKUP_CATEGORY_ID = 11; // L
const LOOKUP_SUBCATEGORY = 12; // M
const LOOKUP_SUBCATEGORY_ID = 13; // N

const MAX_QUANTITY = 1_000_000_000;

export interface ParsedTemplateResult {
  /**
   * Every filled-in row from the sheet, resolved as far as possible.
   * `category` / `subCategory` hold the resolved ObjectId, or "" when the buyer
   * named one the file's lookup block doesn't contain — the review table then
   * flags that row so the buyer can fix it inline before sending.
   */
  items: CreateRfqItem[];
  /** Set only for whole-file problems (wrong sheet, unreadable file). */
  fileError?: string;
}

type Cell = string | number | boolean | null | undefined;
type SheetRow = Cell[];

const text = (value: Cell): string =>
  value === null || value === undefined ? "" : String(value).trim();

const normalizeKey = (value: string): string => value.trim().toLowerCase();

const subKey = (categoryName: string, subName: string): string =>
  `${normalizeKey(categoryName)}|||${normalizeKey(subName)}`;

/** Reads the hidden K:N block into name-to-id maps. */
const buildLookup = (rows: SheetRow[]) => {
  const categoryIdByName = new Map<string, string>();
  const subIdByCatSub = new Map<string, string>();

  // Row 0 is the header; lookup data starts at row 1, same as the input block.
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    const categoryName = text(row[LOOKUP_CATEGORY]);
    const categoryId = text(row[LOOKUP_CATEGORY_ID]);
    if (!categoryName || !categoryId) continue;

    if (!categoryIdByName.has(normalizeKey(categoryName))) {
      categoryIdByName.set(normalizeKey(categoryName), categoryId);
    }

    const subName = text(row[LOOKUP_SUBCATEGORY]);
    const subId = text(row[LOOKUP_SUBCATEGORY_ID]);
    if (subName && subId) {
      subIdByCatSub.set(subKey(categoryName, subName), subId);
    }
  }

  return { categoryIdByName, subIdByCatSub };
};

/** A row counts as filled if any of the required-ish input cells has content. */
const rowHasInput = (row: SheetRow): boolean =>
  Boolean(
    text(row[COL_PRODUCT]) ||
      text(row[COL_QUANTITY]) ||
      text(row[COL_CATEGORY]),
  );

/**
 * Parses a filled RFQ template into the API item shape.
 *
 * Every filled row is returned so the review table can show and fix it: the
 * category/sub-category names the buyer picked are resolved to ObjectIds where
 * the file's lookup block allows, and left blank (for the buyer to correct
 * inline) where it doesn't. A quantity that isn't a valid whole number comes
 * back as 0, which the review table flags as needing attention.
 */
export const parseRfqTemplate = async (
  file: File,
): Promise<ParsedTemplateResult> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const sheet = workbook.Sheets[ITEMS_SHEET];
  if (!sheet) {
    return {
      items: [],
      fileError:
        'This file has no "RFQ Items" sheet. Please upload the template downloaded from Baiy without renaming its sheet.',
    };
  }

  const rows = XLSX.utils.sheet_to_json<SheetRow>(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
  });

  const { categoryIdByName, subIdByCatSub } = buildLookup(rows);

  const items: CreateRfqItem[] = [];

  // Row 0 is the header row; buyer input starts at row 1 (Excel row 2).
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    if (!rowHasInput(row)) continue;

    const categoryName = text(row[COL_CATEGORY]);
    const subName = text(row[COL_SUBCATEGORY]);
    const categoryId = categoryName
      ? categoryIdByName.get(normalizeKey(categoryName)) ?? ""
      : "";
    const subCategoryId =
      subName && categoryId
        ? subIdByCatSub.get(subKey(categoryName, subName)) ?? ""
        : "";

    const quantity = Number(text(row[COL_QUANTITY]));
    const validQuantity =
      Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_QUANTITY;

    items.push({
      productName: text(row[COL_PRODUCT]),
      quantity: validQuantity ? quantity : 0,
      category: categoryId,
      subCategory: subCategoryId || "",
      brand: text(row[COL_BRAND]) || "",
      model: text(row[COL_MODEL]) || "",
      description: text(row[COL_DESCRIPTION]) || "",
      notes: text(row[COL_NOTES]) || "",
    });
  }

  return { items };
};
