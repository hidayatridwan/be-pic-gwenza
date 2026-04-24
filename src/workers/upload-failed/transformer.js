import constants from "../../utils/constants.js";

function transformTiktok(item, created_by) {
    if (item[4] !== "Pre-order") return null;


    return [
        item[0],
        constants.TIKTOK,
        created_by,
    ];
}

function transformShopee(item, created_by) {

    return [
        item[0],
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
