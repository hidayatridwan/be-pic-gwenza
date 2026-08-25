import constants from "../../utils/constants.js";
import {
    standardizeDate,
    addDays,
    normalizeTiktokVariantToShopeeStyle,
} from "../../utils/format.js";

// Nama header Shopee (dinormalisasi: lowercase, spasi dirapikan).
const SHOPEE_HEADERS = {
    order_number: "no. pesanan",
    created_date: "waktu pesanan dibuat",
    product_name: "nama produk",
    variant_name: "nama variasi",
    quantity: "jumlah",
};

// Dipakai kalau header tidak ketemu (mis. file tanpa baris header).
const SHOPEE_FALLBACK_COLUMNS = {
    order_number: 0,
    created_date: 8,
    product_name: 13,
    variant_name: 15,
    quantity: 18,
};

const normalizeHeader = (value) =>
    String(value ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

function resolveShopeeColumns(headerRow) {
    const normalized = (headerRow ?? []).map(normalizeHeader);
    const columns = { ...SHOPEE_FALLBACK_COLUMNS };
    const missing = [];

    for (const [field, header] of Object.entries(SHOPEE_HEADERS)) {
        const index = normalized.indexOf(header);

        if (index === -1) {
            missing.push(header);
        } else {
            columns[field] = index;
        }
    }

    if (missing.length > 0) {
        console.warn(
            `⚠️ Header Shopee tidak ditemukan: ${missing.join(", ")} | pakai index default`
        );
    }

    return columns;
}

function transformTiktok(item, created_by) {
    if (item[4] !== "Pre-order") return null;

    const createdDate = standardizeDate(item[29]);
    if (!createdDate || !item[7]) return null;

    const variantName = normalizeTiktokVariantToShopeeStyle(item[8]);

    return [
        item[0],
        item[7]?.trim(),
        variantName,
        item[9],
        createdDate,
        addDays(createdDate),
        constants.TIKTOK,
        created_by,
    ];
}

function transformShopee(item, created_by, columns) {
    const createdDate = standardizeDate(item[columns.created_date]);
    if (!createdDate || !item[columns.product_name]) return null;

    return [
        item[columns.order_number],
        item[columns.product_name]?.trim(),
        item[columns.variant_name]?.trim(),
        item[columns.quantity],
        createdDate,
        addDays(createdDate),
        constants.SHOPEE,
        created_by,
    ];
}

export function transformRows(rows, channel, created_by, headerRow) {
    const result = [];

    const shopeeColumns =
        channel === constants.TIKTOK ? null : resolveShopeeColumns(headerRow);

    for (const item of rows) {
        const transformed =
            channel === constants.TIKTOK
                ? transformTiktok(item, created_by)
                : transformShopee(item, created_by, shopeeColumns);

        if (transformed) {
            result.push(transformed);
        }
    }

    return result;
}
