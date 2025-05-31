import { prismaClient } from "../apps/database.js";
import { getExpiredProductsValidation } from "../validations/report.validation.js";
import { validate } from "../validations/validation.js";

const byProducts = async (req) => {
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
	date (end_date) < date (${req.start_date})
--	AND product_id IN (1,2)
GROUP BY
	product_id,
	variant_id`;

  const openOrders = await prismaClient.$queryRaw`SELECT
	product_id,
	product_name,
	variant_id,
	variant_name,
	sum(quantity) AS quantity
FROM
	orders
WHERE
	date (end_date) BETWEEN date (${req.start_date}) AND date (${row.max_due_date})
--	AND product_id IN (1,2)
GROUP BY
	product_id,
	variant_id`;

  const projects = await prismaClient.$queryRaw`SELECT
	product_id,
	variant_id,
	sum(quantity) AS quantity
FROM
	projectitems
-- WHERE
--	product_id IN (1,2)
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
--	AND product_id IN (1, 2)
GROUP BY
	product_id,
	variant_id`;

  // Helper: map (product_id, variant_id) => quantity
  function toMap(data) {
    return data.reduce((map, item) => {
      const key = `${item.product_id}-${item.variant_id}`;
      map[key] = parseInt(item.quantity, 10);
      return map;
    }, {});
  }

  const expiredOrderMap = toMap(pastOrders);
  const projectMap = toMap(projects);
  const inboundMap = toMap(inbounds);

  const items = openOrders.map((order) => {
    const key = `${order.product_id}-${order.variant_id}`;
    return {
      product_name: order.product_name,
      variant_name: order.variant_name,
      past_due_orders: expiredOrderMap[key] || 0,
      open_orders: parseInt(order.quantity, 10),
      assigned_to_project: projectMap[key] || 0,
      inbound_received: inboundMap[key] || 0,
    };
  });

  const data = items.map((item) => {
    const fulfillment_stock =
      item.inbound_received - (item.past_due_orders + item.open_orders);

    const work_in_progress = item.assigned_to_project - item.inbound_received;

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

  const total = data.length;

  return { data, total };
};

const byPIC = async (req) => {
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
GROUP BY
	projectitems.projectitem_id
ORDER BY
	projectitems.projectitem_id DESC`;

  const data = result.map((item) => {
    const received = item.received ? parseInt(item.received) : 0;
    return {
      ...item,
      received: received,
      gap: item.quantity - received,
    };
  });

  const total = data.length;

  return { data, total };
};

const byTailors = async (req) => {
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
GROUP BY
	projectitems.projectitem_id
ORDER BY
	projectitems.projectitem_id DESC`;

  const data = result.map((item) => {
    const received = item.received ? parseInt(item.received) : 0;
    return {
      ...item,
      received: received,
      gap: item.quantity - received,
    };
  });

  const total = data.length;

  return { data, total };
};

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
  --  AND product_id IN (1, 2)
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
    DATE(end_date) BETWEEN ${reportStartDate} AND ${reportEndDate}
  --  AND product_id IN (1, 2)
  GROUP BY
    product_id,
    variant_id,
    DATE(end_date)
  ORDER BY
    product_id,
    variant_id,
    end_date`;

  // Get inventory data
  const inventory = await prismaClient.$queryRaw`SELECT
    product_id,
    variant_id,
    SUM(quantity) AS quantity
  FROM
    inbounds
  WHERE
    status = 'OK'
  --  AND product_id IN (1, 2)
  GROUP BY
    product_id,
    variant_id`;

  // Get work-in-progress data
  const workInProgress = await prismaClient.$queryRaw`SELECT
    product_id,
    variant_id,
    SUM(quantity) AS quantity
  FROM
    projectitems
  WHERE
    status = 'OK'
  --  AND product_id IN (1, 2)
  GROUP BY
    product_id,
    variant_id`;

  // Create lookup maps
  const inventoryMap = {};
  const wipMap = {};
  const expiredStockMap = {};

  inventory.forEach((item) => {
    const key = `${item.product_id}|${item.variant_id}`;
    inventoryMap[key] = parseInt(item.quantity) || 0;
  });

  workInProgress.forEach((item) => {
    const key = `${item.product_id}|${item.variant_id}`;
    wipMap[key] = parseInt(item.quantity) || 0;
  });

  expiredOrders.forEach((item) => {
    const key = `${item.product_id}|${item.variant_id}`;
    expiredStockMap[key] = parseInt(item.quantity) || 0;
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
        inventory: inventoryMap[compositeKey] || 0,
        work_in_progress: wipMap[compositeKey] || 0,
        expired_stock: expiredStockMap[compositeKey] || 0,
      };

      // Initialize daily order quantities
      dateColumns.forEach((date) => {
        reportData[compositeKey][date] = 0;
      });
    }

    // Set daily quantities
    const dateStr = new Date(item.end_date).toISOString().split("T")[0];
    reportData[compositeKey][dateStr] = parseInt(item.quantity);
    reportData[compositeKey].current_period_orders += parseInt(item.quantity);
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
    // inventory: item.inventory, // di ambil dari keseluruhan inbounds
    // expired_stock: item.expired_stock, // di ambil dari periode tgl awal order yg dipilih
    current_period_orders: item.current_period_orders, // di ambil dari periode order yg berjalan
    available_stock: item.inventory - item.expired_stock, // di ambil dari inventory di kurangi expired stock
    gap: item.inventory - item.expired_stock - item.current_period_orders, // di ambil dari available stock di kurangi current period orders
    work_in_progress: item.work_in_progress - item.inventory, // di ambil dari keseluruhan work in progress di kurangi inventory
  }));

  return {
    data,
    total: data.length,
    date_columns: dateColumns,
  };
};

export default { byProducts, byPIC, byTailors, byExpiredDate };
