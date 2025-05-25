import { prismaClient } from "../apps/database.js";

const search = async (req) => {
  const expiredOrders = await prismaClient.$queryRaw`SELECT
	product_id,
	variant_id,
	sum(quantity) AS quantity
FROM
	orders
WHERE
	date (start_date) < date (${req.date_filter})
	AND product_id IN (1,2)
GROUP BY
	product_id,
	variant_id`;

  const currentOrders = await prismaClient.$queryRaw`SELECT
	product_id,
	product_name,
	variant_id,
	variant_name,
	sum(quantity) AS quantity
FROM
	orders
WHERE
	date (start_date) >= date (${req.date_filter})
	AND product_id IN (1,2)
GROUP BY
	product_id,
	variant_id`;

  const projects = await prismaClient.$queryRaw`SELECT
	product_id,
	variant_id,
	sum(quantity) AS quantity
FROM
	projectitems
WHERE
	product_id IN (1,2)
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
	product_id IN (1,2)
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

  const expiredOrderMap = toMap(expiredOrders);
  const projectMap = toMap(projects);
  const inboundMap = toMap(inbounds);

  const items = currentOrders.map((order) => {
    const key = `${order.product_id}-${order.variant_id}`;
    return {
      product_id: order.product_id,
      variant_id: order.variant_id,
      product_name: order.product_name,
      variant_name: order.variant_name,
      past_due_orders: expiredOrderMap[key] || 0,
      open_orders: parseInt(order.quantity, 10),
      assigned_to_project: projectMap[key] || 0,
      inbound_received: inboundMap[key] || 0,
    };
  });

  const data = items.map((item) => {
    const actual_stock =
      item.inbound_received - (item.past_due_orders + item.open_orders);

    const work_in_progress = item.assigned_to_project - item.inbound_received;

    let fulfillment_status = "fulfilled";
    if (actual_stock < 0 && work_in_progress > 0) {
      fulfillment_status = "in_progress";
    } else if (actual_stock < 0 && work_in_progress <= 0) {
      fulfillment_status = "critical";
    }

    return {
      ...item,
      actual_stock,
      work_in_progress,
      fulfillment_status,
    };
  });

  const total = data.length;

  return { data, total };
};

export default { search };
