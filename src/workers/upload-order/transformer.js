import constants from "../../utils/constants.js";
import {
    standardizeDate,
    addDays,
    normalizeTiktokVariantToShopeeStyle,
} from "../../utils/format.js";

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

function transformShopee(item, created_by) {
    const createdDate = standardizeDate(item[10]);
    if (!createdDate || !item[14]) return null;

    return [
        item[0],
        item[14]?.trim(),
        item[16]?.trim(),
        item[19],
        createdDate,
        addDays(createdDate),
        constants.SHOPEE,
        created_by,
    ];
}

export function transformRows(rows, channel, created_by) {
    const result = [];

    for (const item of rows) {
        const transformed =
            channel === constants.TIKTOK
                ? transformTiktok(item, created_by)
                : transformShopee(item, created_by);

        if (transformed) {
            result.push(transformed);
        }
    }

    return result;
}
