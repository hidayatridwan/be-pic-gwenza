-- DropIndex
DROP INDEX `orders_start_date_end_date_delivery_date_status_idx` ON `orders`;

-- CreateIndex
CREATE INDEX `orders_order_number_product_name_variant_name_product_id_var_idx` ON `orders`(`order_number`, `product_name`, `variant_name`, `product_id`, `variant_id`, `start_date`, `end_date`, `delivery_date`, `status`);
