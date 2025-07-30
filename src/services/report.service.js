import { prismaClient } from "../apps/database.js";
import { MerchandiseInboundStatus, MerchandiseOutboundStatus, Prisma } from "../generated/prisma/index.js";
import {
  getExpiredProductsValidation,
  getOrderProductsValidation,
  searchByPicValidation,
  searchByTailorValidation,
  searchMerchandiseDateValidation,
  searchMerchandiseSummaryValidation,
} from "../validations/report.validation.js";
import { validate } from "../validations/validation.js";

const byExpiredDate = async (req) => {
  const input_date = validate(getExpiredProductsValidation, req.input_date);
  const reportStartDate = new Date(input_date);
  const reportEndDate = new Date(reportStartDate);
  reportEndDate.setDate(reportEndDate.getDate() + 7);

  // Get expired orders (orders completed before report period)
  const expiredOrders = await prismaClient.$queryRaw`SELECT
    product_id,
    variant_id,
    SUM(quantity) AS quantity
  FROM
    orders
  WHERE
    DATE(end_date) < DATE(${reportStartDate})
  GROUP BY
    product_id,
    variant_id`;

  // Get current period orders
  const currentOrders = await prismaClient.$queryRaw`SELECT
    product_id,
    product_name,
    variant_id,
    variant_name,
    DATE(end_date) AS end_date,
    SUM(quantity) AS quantity
  FROM
    orders
  WHERE
    DATE(end_date) BETWEEN DATE(${reportStartDate}) AND DATE(${reportEndDate})
  GROUP BY
    product_id,
    variant_id,
    DATE(end_date)
  ORDER BY
    product_name,
    variant_name,
    end_date`;

  // Get inbounds data
  const inbounds = await prismaClient.$queryRaw`SELECT
    product_id,
    variant_id,
    SUM(quantity) AS quantity
  FROM
    inbounds
  WHERE
    status = 'OK'
  GROUP BY
    product_id,
    variant_id`;

  // Get returns data
  const returns = await prismaClient.$queryRaw`SELECT
    product_id,
    variant_id,
    SUM(quantity) AS quantity
  FROM
    returns
  WHERE
    status = 'OK'
  GROUP BY
    product_id,
    variant_id`;

  // Get project items data
  const projectItems = await prismaClient.$queryRaw`SELECT
    product_id,
    variant_id,
    SUM(quantity) AS quantity
  FROM
    projectitems
  WHERE
    status != 'CANCEL'
  GROUP BY
    product_id,
    variant_id`;

  // Get outbounds data
  const outbounds = await prismaClient.$queryRaw`SELECT
    product_id,
    variant_id,
    SUM(quantity) AS quantity
  FROM
    outbounds
  WHERE
    status = 'OK'
  GROUP BY
    product_id,
    variant_id`;

  // Create lookup maps
  const inboundMap = {};
  const returnMap = {};
  const outboundMap = {};
  const projectItemMap = {};
  const expiredOrderMap = {};

  inbounds.forEach((item) => {
    const key = `${item.product_id}|${item.variant_id}`;
    inboundMap[key] = Number(item.quantity) || 0;
  });

  returns.forEach((item) => {
    const key = `${item.product_id}|${item.variant_id}`;
    returnMap[key] = Number(item.quantity) || 0;
  });

  outbounds.forEach((item) => {
    const key = `${item.product_id}|${item.variant_id}`;
    outboundMap[key] = Number(item.quantity) || 0;
  });

  projectItems.forEach((item) => {
    const key = `${item.product_id}|${item.variant_id}`;
    projectItemMap[key] = Number(item.quantity) || 0;
  });

  expiredOrders.forEach((item) => {
    const key = `${item.product_id}|${item.variant_id}`;
    expiredOrderMap[key] = Number(item.quantity) || 0;
  });

  // Generate date columns for report period
  const dateColumns = [];
  const currentDate = new Date(reportStartDate);

  while (currentDate <= reportEndDate) {
    dateColumns.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Transform data for reporting
  const reportData = {};

  currentOrders.forEach((item) => {
    const compositeKey = `${item.product_id}|${item.variant_id}`;

    if (!reportData[compositeKey]) {
      reportData[compositeKey] = {
        product_id: item.product_id,
        product_name: item.product_name,
        variant_id: item.variant_id,
        variant_name: item.variant_name,
        current_period_orders: 0,
        inbounds: inboundMap[compositeKey] || 0,
        returns: returnMap[compositeKey] || 0,
        outbounds: outboundMap[compositeKey] || 0,
        project_items: projectItemMap[compositeKey] || 0,
        expired_order: expiredOrderMap[compositeKey] || 0,
      };

      // Initialize daily order quantities
      dateColumns.forEach((date) => {
        reportData[compositeKey][date] = 0;
      });
    }

    // Set daily quantities
    const dateStr = new Date(item.end_date).toISOString().split("T")[0];
    reportData[compositeKey][dateStr] = Number(item.quantity);
    reportData[compositeKey].current_period_orders += Number(item.quantity);
  });

  // Prepare final output
  const data = Object.values(reportData).map((item) => ({
    product_id: item.product_id,
    product_name: item.product_name,
    variant_id: item.variant_id,
    variant_name: item.variant_name,
    ...dateColumns.reduce((acc, date) => {
      acc[date] = item[date];
      return acc;
    }, {}),
    project_items: item.project_items, // di ambil dari keseluruhan project items
    inbounds: item.inbounds, // di ambil dari keseluruhan inbounds
    returns: item.returns, // di ambil dari keseluruhan returns
    expired_order: item.expired_order, // di ambil dari periode tgl awal order yg dipilih
    current_period_orders: item.current_period_orders, // di ambil dari periode order yg berjalan
    outbounds: item.outbounds, // di ambil dari keseluruhan outbounds
    available_stock: (item.inbounds + item.inbounds) - item.expired_order - item.outbounds, // di ambil dari inbounds di kurangi expired stock
    fulfillment_gap: (item.inbounds + item.inbounds) - item.expired_order - item.outbounds - item.current_period_orders, // di ambil dari available stock di kurangi current period orders
    work_in_progress: item.project_items - item.inbounds, // di ambil dari keseluruhan project items di kurangi inbounds
  }));

  return {
    data,
    total: data.length,
    date_columns: dateColumns,
  };
};

const byProducts = async (req) => {
  const searchRequest = validate(getOrderProductsValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  const search = `%${searchRequest.search ?? ""}%`;

  const [row] = await prismaClient.$queryRaw`SELECT
	date (max(end_date)) AS max_due_date
FROM
	orders`;

  const pastOrders = await prismaClient.$queryRaw`SELECT
	product_id,
	variant_id,
	sum(quantity) AS quantity
FROM
	orders
WHERE
	date (end_date) < date (${searchRequest.start_date})
GROUP BY
	product_id,
	variant_id`;

  const openOrders = await prismaClient.$queryRaw`select * from (
    SELECT
	product_id,
	product_name,
	variant_id,
	variant_name,
	sum(quantity) AS quantity
FROM
	orders
WHERE
	date (end_date) BETWEEN date (${searchRequest.start_date}) AND date (${row.max_due_date})
    AND orders.product_name LIKE ${search} OR orders.variant_name LIKE ${search}
GROUP BY
	product_id,
	variant_id

union all

SELECT
	products.product_id,
	products.product_name,
	variants.variant_id,
	variants.variant_name,
	0 AS quantity
FROM
	products
	JOIN productvariants ON products.product_id = productvariants.product_id
	JOIN variants ON productvariants.variant_id = variants.variant_id
WHERE
	products.product_id NOT IN (
		SELECT
			product_id
		FROM
			orders
	)
  AND products.product_name LIKE ${search} OR variants.variant_name LIKE ${search}
  ) as t1
ORDER BY
  product_name,
  variant_name
LIMIT ${searchRequest.size}
OFFSET ${skip}`;

  const projects = await prismaClient.$queryRaw`SELECT
	product_id,
	variant_id,
	sum(quantity) AS quantity
FROM
	projectitems
WHERE
  status != 'CANCEL'
GROUP BY
	product_id,
	variant_id`;

  const inbounds = await prismaClient.$queryRaw`SELECT
	product_id,
	variant_id,
	sum(quantity) AS quantity
FROM
	inbounds
WHERE
	status = 'OK'
GROUP BY
	product_id,
	variant_id`;

  const returns = await prismaClient.$queryRaw`SELECT
	product_id,
	variant_id,
	sum(quantity) AS quantity
FROM
	returns
WHERE
	status = 'OK'
GROUP BY
	product_id,
	variant_id`;

  const outbounds = await prismaClient.$queryRaw`SELECT
	product_id,
	variant_id,
	sum(quantity) AS quantity
FROM
	outbounds
WHERE
	status = 'OK'
GROUP BY
	product_id,
	variant_id`;

  // Count total matching rows without re-running the full query
  const countResult = await prismaClient.$queryRaw`
    SELECT COUNT(*) as total FROM (
      SELECT
	1
FROM
	orders
WHERE
	date (end_date) BETWEEN date (${searchRequest.start_date}) AND date (${row.max_due_date})
    AND orders.product_name LIKE ${search} OR orders.variant_name LIKE ${search}
GROUP BY
	product_id,
	variant_id

union all

SELECT
	1
FROM
	products
	JOIN productvariants ON products.product_id = productvariants.product_id
	JOIN variants ON productvariants.variant_id = variants.variant_id
WHERE
	products.product_id NOT IN (
		SELECT
			product_id
		FROM
			orders
	)
  AND products.product_name LIKE ${search} OR variants.variant_name LIKE ${search}
    ) AS grouped`;

  const total = Number(countResult[0]?.total ?? 0);

  // Helper: map (product_id, variant_id) => quantity
  function toMap(data) {
    return data.reduce((map, item) => {
      const key = `${item.product_id}-${item.variant_id}`;
      map[key] = Number(item.quantity, 10);
      return map;
    }, {});
  }

  const expiredOrderMap = toMap(pastOrders);
  const projectMap = toMap(projects);
  const inboundMap = toMap(inbounds);
  const returnMap = toMap(returns);
  const outboundMap = toMap(outbounds);

  const items = openOrders.map((order) => {
    const key = `${order.product_id}-${order.variant_id}`;
    return {
      product_name: order.product_name,
      variant_name: order.variant_name,
      expired_orders: expiredOrderMap[key] || 0,
      open_orders: Number(order.quantity, 10),
      project_items: projectMap[key] || 0,
      inbounds: inboundMap[key] || 0,
      returns: returnMap[key] || 0,
      outbounds: outboundMap[key] || 0,
    };
  });

  const data = items.map((item) => {
    const fulfillment_stock =
      (item.inbounds + item.returns) - item.outbounds - (item.expired_orders + item.open_orders);

    const work_in_progress = item.project_items - item.inbounds;

    let fulfillment_status = "FULFILLED";
    if (fulfillment_stock < 0 && work_in_progress > 0) {
      fulfillment_status = "IN_PROGRESS";
    } else if (fulfillment_stock < 0 && work_in_progress <= 0) {
      fulfillment_status = "CRITICAL";
    }

    return {
      ...item,
      fulfillment_stock,
      work_in_progress,
      fulfillment_status,
    };
  });

  return { data, total };
};

const byPIC = async (req) => {
  const searchRequest = validate(searchByPicValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  const search = `%${searchRequest.search ?? ""}%`;

  // Get paginated result
  const result = await prismaClient.$queryRaw`SELECT
	projects.batch_id,
	users.full_name AS pic_name,
	products.product_name,
	variants.variant_name,
	projectitems.quantity,
	projectitems.assign_date,
	DATEDIFF(CURDATE(), projectitems.assign_date) AS assign_age,
	sum(inbounds.quantity) AS received
FROM
	projectitems
	JOIN projects ON projects.project_id = projectitems.project_id
	JOIN users ON users.user_id = projectitems.pic_id
	JOIN products ON products.product_id = projectitems.product_id
	JOIN variants ON variants.variant_id = projectitems.variant_id
	LEFT JOIN inbounds ON inbounds.projectitem_id = projectitems.projectitem_id
WHERE
  products.product_name LIKE ${search}
  OR variants.variant_name LIKE ${search}
  OR projects.batch_id LIKE ${search}
	OR users.full_name LIKE ${search}
GROUP BY
	projectitems.projectitem_id
ORDER BY
	projectitems.projectitem_id DESC
LIMIT ${searchRequest.size}
OFFSET ${skip}`;

  // Count total matching rows without re-running the full query
  const countResult = await prismaClient.$queryRaw`
    SELECT COUNT(*) as total FROM (
      SELECT 1
FROM
	projectitems
	JOIN projects ON projects.project_id = projectitems.project_id
	JOIN users ON users.user_id = projectitems.pic_id
	JOIN products ON products.product_id = projectitems.product_id
	JOIN variants ON variants.variant_id = projectitems.variant_id
	LEFT JOIN inbounds ON inbounds.projectitem_id = projectitems.projectitem_id
WHERE
  products.product_name LIKE ${search}
  OR variants.variant_name LIKE ${search}
  OR projects.batch_id LIKE ${search}
	OR users.full_name LIKE ${search}
GROUP BY
	projectitems.projectitem_id
    ) AS grouped`;

  const total = Number(countResult[0]?.total ?? 0);

  const data = result.map((item) => {
    const quantity = item.quantity ? Number(item.quantity) : 0;
    const received = item.received ? Number(item.received) : 0;
    return {
      ...item,
      assign_age: item.assign_age ? Number(item.assign_age) : 0,
      quantity,
      received,
      gap: quantity - received,
    };
  });

  return { data, total };
};

const byTailors = async (req) => {
  const searchRequest = validate(searchByTailorValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  const search = `%${searchRequest.search ?? ""}%`;

  // Get paginated result
  const result = await prismaClient.$queryRaw`SELECT
	projects.batch_id,
	tailors.tailor_name,
	products.product_name,
	variants.variant_name,
	projectitems.quantity,
	projectitems.assign_date,
	DATEDIFF(CURDATE(), projectitems.assign_date) AS assign_age,
	sum(inbounds.quantity) AS received
FROM
	projectitems
	JOIN projects ON projects.project_id = projectitems.project_id
	JOIN tailors ON tailors.tailor_id = projectitems.tailor_id
	JOIN products ON products.product_id = projectitems.product_id
	JOIN variants ON variants.variant_id = projectitems.variant_id
	LEFT JOIN inbounds ON inbounds.projectitem_id = projectitems.projectitem_id
WHERE
  products.product_name LIKE ${search}
  OR variants.variant_name LIKE ${search}
  OR projects.batch_id LIKE ${search}
	OR tailors.tailor_name LIKE ${search}
GROUP BY
	projectitems.projectitem_id
ORDER BY
	projectitems.projectitem_id DESC
LIMIT ${searchRequest.size}
OFFSET ${skip}`;

  // Count total matching rows without re-running the full query
  const countResult = await prismaClient.$queryRaw`
    SELECT COUNT(*) as total FROM (
      SELECT 1
FROM
	projectitems
	JOIN projects ON projects.project_id = projectitems.project_id
	JOIN tailors ON tailors.tailor_id = projectitems.tailor_id
	JOIN products ON products.product_id = projectitems.product_id
	JOIN variants ON variants.variant_id = projectitems.variant_id
	LEFT JOIN inbounds ON inbounds.projectitem_id = projectitems.projectitem_id
WHERE
  products.product_name LIKE ${search}
  OR variants.variant_name LIKE ${search}
  OR projects.batch_id LIKE ${search}
	OR tailors.tailor_name LIKE ${search}
GROUP BY
	projectitems.projectitem_id
    ) AS grouped`;

  const total = Number(countResult[0]?.total ?? 0);

  const data = result.map((item) => {
    const quantity = item.quantity ? Number(item.quantity) : 0;
    const received = item.received ? Number(item.received) : 0;
    return {
      ...item,
      assign_age: item.assign_age ? Number(item.assign_age) : 0,
      quantity,
      received,
      gap: quantity - received,
    };
  });

  return { data, total };
};

const byMerchandiseSummary = async (req) => {
  const searchRequest = validate(searchMerchandiseSummaryValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  const search = `%${searchRequest.search ?? ""}%`;

  const products = await prismaClient.$queryRaw`SELECT
	merchandises.category,
	merchandises.merchandise_id,
	merchandises.product_name,
	colors.color_id,
	colors.color_name
FROM
	merchandises
	LEFT JOIN merchandiseinbounds ON merchandises.merchandise_id = merchandiseinbounds.merchandise_id
	LEFT JOIN colors ON merchandiseinbounds.color_id = colors.color_id
WHERE
  merchandises.product_name LIKE ${search}
  OR colors.color_name LIKE ${search}
GROUP BY
	merchandises.merchandise_id,
	merchandiseinbounds.color_id
ORDER BY
	product_name
LIMIT ${searchRequest.size}
OFFSET ${skip}`;

  const inbounds = await prismaClient.merchandiseInbound.groupBy({
    where: {
      merchandise_id: {
        in: products.map(item => item.merchandise_id)
      },
      status: {
        not: MerchandiseInboundStatus.CANCEL,
      },
    },
    by: ['merchandise_id', 'color_id'],
    _sum: {
      quantity: true,
    },
  });

  const outbounds = await prismaClient.merchandiseOutbound.groupBy({
    where: {
      merchandise_id: {
        in: products.map(item => item.merchandise_id)
      },
      status: {
        not: MerchandiseOutboundStatus.CANCEL,
      },
    },
    by: ['merchandise_id', 'color_id'],
    _sum: {
      quantity: true,
    },
  });

  const data = products.map(product => {
    const inboundData = inbounds.find(item => item.merchandise_id === product.merchandise_id && item.color_id === product.color_id);
    const inboundQty = inboundData ? inboundData._sum.quantity : 0;

    const outboundData = outbounds.find(item => item.merchandise_id === product.merchandise_id && item.color_id === product.color_id);
    const outboundQty = outboundData ? outboundData._sum.quantity : 0;

    const availableQty = inboundQty - outboundQty;

    return {
      category: product.category,
      product_name: product.product_name,
      color_name: product.color_name,
      inbound: inboundQty,
      outbound: outboundQty,
      available: availableQty
    };
  });

  // Count total matching rows without re-running the full query
  const countResult = await prismaClient.$queryRaw`
    SELECT COUNT(*) as total FROM (
      SELECT 1
FROM
	merchandises
	LEFT JOIN merchandiseinbounds ON merchandises.merchandise_id = merchandiseinbounds.merchandise_id
	LEFT JOIN colors ON merchandiseinbounds.color_id = colors.color_id
WHERE
  merchandises.product_name LIKE ${search}
  OR colors.color_name LIKE ${search}
GROUP BY
	merchandises.merchandise_id,
	merchandiseinbounds.color_id
    ) AS grouped`;

  const total = Number(countResult[0]?.total ?? 0);

  return { data, total };
};

const byMerchandiseDate = async (req) => {
  const searchRequest = validate(searchMerchandiseDateValidation, req);
  const skip = (searchRequest.page - 1) * searchRequest.size;
  const search = `%${searchRequest.search ?? ""}%`;

  const products = await prismaClient.$queryRaw`SELECT
	merchandise_id,
  product_name
FROM
	merchandises
WHERE
	merchandise_id IN (
		SELECT DISTINCT
			merchandise_id
		FROM
			merchandiseinbounds
	)
AND product_name LIKE ${search}
ORDER BY
  product_name
LIMIT ${searchRequest.size}
OFFSET ${skip}`;

  const merchandiseIds = products.map(item => item.merchandise_id);
  if (merchandiseIds.length === 0) {
    return { data: [], total: 0 };
  }

  const transactions = await prismaClient.$queryRaw`SELECT
	merchandiseinbounds.merchandise_id,
	merchandiseinbounds.inbound_date AS tx_date,
	merchandiseinbounds.inbound_code AS tx_code,
	merchandiseinbounds.quantity AS qty_in,
	0 AS qty_out,
	concat('[Supplier: ', suppliers.supplier_name, '] [Warna: ', colors.color_name, '] [Keterangan: ', merchandiseinbounds.notes, ']') AS notes
FROM
	merchandiseinbounds
JOIN colors ON merchandiseinbounds.color_id = colors.color_id
JOIN suppliers ON merchandiseinbounds.supplier_id = suppliers.supplier_id
WHERE
	merchandiseinbounds.merchandise_id IN (${Prisma.join(merchandiseIds)})
UNION ALL
SELECT
	merchandiseoutbounds.merchandise_id,
	merchandiseoutbounds.outbound_date AS tx_date,
	merchandiseoutbounds.outbound_code AS tx_code,
	0 AS qty_in,
	merchandiseoutbounds.quantity AS qty_out,
	concat('[Konveksi: ', tailors.tailor_name, '] [Produk: ', COALESCE(fashiondesigns.sample_code, products.product_name), '] [Warna: ', colors.color_name, '] [Keterangan: ', merchandiseoutbounds.notes, ']') AS notes
FROM
	merchandiseoutbounds
	JOIN tailors ON merchandiseoutbounds.tailor_id = tailors.tailor_id
	JOIN merchandiseinbounds ON merchandiseoutbounds.outbound_code = merchandiseinbounds.inbound_code
	JOIN colors ON merchandiseinbounds.color_id = colors.color_id
	LEFT JOIN fashiondesigns ON merchandiseoutbounds.fashiondesign_id = fashiondesigns.fashiondesign_id
	LEFT JOIN products ON merchandiseoutbounds.product_id = products.product_id
WHERE
	merchandiseoutbounds.merchandise_id IN (${Prisma.join(merchandiseIds)})
ORDER BY
	tx_date`;

  const result = transactions.map(transaction => {
    // Find the corresponding product
    const product = products.find(p => p.merchandise_id === transaction.merchandise_id);

    // Return merged object
    return {
      ...transaction,
      product_name: product ? product.product_name : 'Unknown Product',
      qty_in: Number(transaction.qty_in),
      qty_out: Number(transaction.qty_out)
    };
  });

  const countResult = await prismaClient.$queryRaw`
    SELECT COUNT(*) as total FROM (
      SELECT 1
FROM
	merchandises
WHERE
	merchandise_id IN (
		SELECT DISTINCT
			merchandise_id
		FROM
			merchandiseinbounds
	)
AND product_name LIKE ${search}
    ) AS grouped`;

  const total = Number(countResult[0]?.total ?? 0);

  return { data: result, total };
};

export default { byProducts, byPIC, byTailors, byExpiredDate, byMerchandiseSummary, byMerchandiseDate };
