-- CreateTable
CREATE TABLE `users` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(20) NOT NULL,
    `password` VARCHAR(200) NOT NULL,
    `token` VARCHAR(500) NULL,
    `user_agent` VARCHAR(200) NULL,
    `ip_address` VARCHAR(100) NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `role` ENUM('ADMIN_SYSTEM', 'PPIC', 'RECEIPT', 'FD', 'MD', 'INBOUND_OPERATOR', 'OUTBOUND_OPERATOR', 'PRODUCT_ADMIN') NOT NULL DEFAULT 'PPIC',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tailors` (
    `tailor_id` INTEGER NOT NULL AUTO_INCREMENT,
    `tailor_name` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` INTEGER NULL,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_by` INTEGER NULL,

    UNIQUE INDEX `tailors_tailor_name_key`(`tailor_name`),
    PRIMARY KEY (`tailor_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `variants` (
    `variant_id` INTEGER NOT NULL AUTO_INCREMENT,
    `variant_name` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `variants_variant_name_key`(`variant_name`),
    PRIMARY KEY (`variant_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `product_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fashiondesign_code` VARCHAR(10) NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `cogs` INTEGER NULL,
    `selling_price` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` INTEGER NULL,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_by` INTEGER NULL,

    UNIQUE INDEX `products_product_name_key`(`product_name`),
    PRIMARY KEY (`product_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productvariants` (
    `product_variant_id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `variant_id` INTEGER NOT NULL,

    UNIQUE INDEX `productvariants_product_id_variant_id_key`(`product_id`, `variant_id`),
    PRIMARY KEY (`product_variant_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `imports` (
    `import_id` INTEGER NOT NULL AUTO_INCREMENT,
    `import_type` ENUM('ORDER', 'CANCEL') NULL DEFAULT 'ORDER',
    `file_name` VARCHAR(100) NOT NULL,
    `is_processed` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` INTEGER NULL,

    UNIQUE INDEX `imports_file_name_key`(`file_name`),
    PRIMARY KEY (`import_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `order_id` INTEGER NOT NULL AUTO_INCREMENT,
    `channel` VARCHAR(100) NOT NULL,
    `order_number` VARCHAR(100) NOT NULL,
    `status` ENUM('OPEN', 'CLOSED', 'CANCEL') NOT NULL DEFAULT 'OPEN',
    `product_id` INTEGER NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `variant_id` INTEGER NULL,
    `variant_name` VARCHAR(100) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `start_date` DATETIME(3) NULL,
    `end_date` DATETIME(3) NULL,
    `delivery_date` DATETIME(3) NULL,
    `waybill_number` VARCHAR(100) NULL,
    `project_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` INTEGER NULL,

    INDEX `orders_start_date_end_date_delivery_date_status_idx`(`start_date`, `end_date`, `delivery_date`, `status`),
    UNIQUE INDEX `orders_channel_order_number_product_name_variant_name_key`(`channel`, `order_number`, `product_name`, `variant_name`),
    PRIMARY KEY (`order_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `project_id` INTEGER NOT NULL AUTO_INCREMENT,
    `batch_id` CHAR(6) NOT NULL,
    `pic_id` INTEGER NOT NULL,
    `status` ENUM('OPEN', 'PARTIAL', 'FULFILLED', 'CANCEL') NOT NULL DEFAULT 'OPEN',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` INTEGER NULL,

    PRIMARY KEY (`project_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projectitems` (
    `projectitem_id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_id` INTEGER NOT NULL,
    `pic_id` INTEGER NOT NULL,
    `tailor_id` INTEGER NOT NULL,
    `assign_date` DATE NOT NULL,
    `product_id` INTEGER NOT NULL,
    `variant_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `status` ENUM('OPEN', 'PARTIAL', 'FULFILLED', 'CANCEL') NOT NULL DEFAULT 'OPEN',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` INTEGER NULL,

    PRIMARY KEY (`projectitem_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inbounds` (
    `inbound_id` INTEGER NOT NULL AUTO_INCREMENT,
    `inbound_date` DATE NOT NULL,
    `projectitem_id` INTEGER NOT NULL,
    `pic_id` INTEGER NOT NULL,
    `tailor_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `variant_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `notes` VARCHAR(255) NULL,
    `status` ENUM('OK', 'CANCEL') NOT NULL DEFAULT 'OK',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` INTEGER NULL,

    PRIMARY KEY (`inbound_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `returns` (
    `return_id` INTEGER NOT NULL AUTO_INCREMENT,
    `return_date` DATE NOT NULL,
    `product_id` INTEGER NOT NULL,
    `variant_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `notes` VARCHAR(255) NULL,
    `status` ENUM('OK', 'CANCEL') NOT NULL DEFAULT 'OK',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` INTEGER NULL,

    PRIMARY KEY (`return_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `outbounds` (
    `outbound_id` INTEGER NOT NULL AUTO_INCREMENT,
    `outbound_date` DATE NOT NULL,
    `product_id` INTEGER NOT NULL,
    `variant_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `notes` VARCHAR(255) NULL,
    `status` ENUM('OK', 'CANCEL') NOT NULL DEFAULT 'OK',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` INTEGER NULL,

    PRIMARY KEY (`outbound_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fashiondesigns` (
    `fashiondesign_id` INTEGER NOT NULL AUTO_INCREMENT,
    `sample_code` VARCHAR(10) NOT NULL,
    `sample_file` VARCHAR(255) NULL,
    `tailor_id` INTEGER NULL,
    `send_sample_date` DATE NULL,
    `receive_sample_date` DATE NULL,
    `revision_date` DATE NULL,
    `revision_file` VARCHAR(255) NULL,
    `on_production_date` DATE NULL,
    `fix_sample_date` DATE NULL,
    `obstacle` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` INTEGER NULL,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_by` INTEGER NULL,

    PRIMARY KEY (`fashiondesign_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `merchandises` (
    `merchandise_id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_name` VARCHAR(255) NOT NULL,
    `category` ENUM('MATERIAL', 'ACCESORIES') NOT NULL DEFAULT 'MATERIAL',
    `image` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` INTEGER NULL,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_by` INTEGER NULL,

    UNIQUE INDEX `merchandises_product_name_key`(`product_name`),
    PRIMARY KEY (`merchandise_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `suppliers` (
    `supplier_id` INTEGER NOT NULL AUTO_INCREMENT,
    `supplier_name` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` INTEGER NULL,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_by` INTEGER NULL,

    UNIQUE INDEX `suppliers_supplier_name_key`(`supplier_name`),
    PRIMARY KEY (`supplier_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `colors` (
    `color_id` INTEGER NOT NULL AUTO_INCREMENT,
    `color_name` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` INTEGER NULL,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_by` INTEGER NULL,

    UNIQUE INDEX `colors_color_name_key`(`color_name`),
    PRIMARY KEY (`color_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `merchandiseinbounds` (
    `merchandise_inbound_id` INTEGER NOT NULL AUTO_INCREMENT,
    `inbound_date` DATE NOT NULL,
    `inbound_code` VARCHAR(100) NOT NULL,
    `merchandise_id` INTEGER NOT NULL,
    `supplier_id` INTEGER NOT NULL,
    `color_id` INTEGER NOT NULL,
    `price` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `notes` VARCHAR(255) NULL,
    `status` ENUM('OPEN', 'CANCEL', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` INTEGER NULL,

    PRIMARY KEY (`merchandise_inbound_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `merchandiseoutbounds` (
    `merchandise_outbound_id` INTEGER NOT NULL AUTO_INCREMENT,
    `outbound_date` DATE NOT NULL,
    `outbound_code` VARCHAR(100) NOT NULL,
    `merchandise_id` INTEGER NOT NULL,
    `supplier_id` INTEGER NOT NULL,
    `color_id` INTEGER NOT NULL,
    `fashiondesign_id` INTEGER NULL,
    `product_id` INTEGER NULL,
    `tailor_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `notes` VARCHAR(255) NULL,
    `status` ENUM('OK', 'CANCEL') NOT NULL DEFAULT 'OK',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` INTEGER NULL,

    INDEX `merchandiseoutbounds_outbound_code_idx`(`outbound_code`),
    PRIMARY KEY (`merchandise_outbound_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tailors` ADD CONSTRAINT `tailors_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tailors` ADD CONSTRAINT `tailors_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productvariants` ADD CONSTRAINT `productvariants_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productvariants` ADD CONSTRAINT `productvariants_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `variants`(`variant_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `imports` ADD CONSTRAINT `imports_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `variants`(`variant_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_pic_id_fkey` FOREIGN KEY (`pic_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projectitems` ADD CONSTRAINT `projectitems_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projectitems` ADD CONSTRAINT `projectitems_pic_id_fkey` FOREIGN KEY (`pic_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projectitems` ADD CONSTRAINT `projectitems_tailor_id_fkey` FOREIGN KEY (`tailor_id`) REFERENCES `tailors`(`tailor_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projectitems` ADD CONSTRAINT `projectitems_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projectitems` ADD CONSTRAINT `projectitems_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `variants`(`variant_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inbounds` ADD CONSTRAINT `inbounds_projectitem_id_fkey` FOREIGN KEY (`projectitem_id`) REFERENCES `projectitems`(`projectitem_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inbounds` ADD CONSTRAINT `inbounds_pic_id_fkey` FOREIGN KEY (`pic_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inbounds` ADD CONSTRAINT `inbounds_tailor_id_fkey` FOREIGN KEY (`tailor_id`) REFERENCES `tailors`(`tailor_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inbounds` ADD CONSTRAINT `inbounds_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inbounds` ADD CONSTRAINT `inbounds_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `variants`(`variant_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `returns` ADD CONSTRAINT `returns_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `returns` ADD CONSTRAINT `returns_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `variants`(`variant_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `returns` ADD CONSTRAINT `returns_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `outbounds` ADD CONSTRAINT `outbounds_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `outbounds` ADD CONSTRAINT `outbounds_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `variants`(`variant_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `outbounds` ADD CONSTRAINT `outbounds_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fashiondesigns` ADD CONSTRAINT `fashiondesigns_tailor_id_fkey` FOREIGN KEY (`tailor_id`) REFERENCES `tailors`(`tailor_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fashiondesigns` ADD CONSTRAINT `fashiondesigns_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fashiondesigns` ADD CONSTRAINT `fashiondesigns_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `merchandises` ADD CONSTRAINT `merchandises_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `merchandises` ADD CONSTRAINT `merchandises_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `colors` ADD CONSTRAINT `colors_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `colors` ADD CONSTRAINT `colors_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `merchandiseinbounds` ADD CONSTRAINT `merchandiseinbounds_merchandise_id_fkey` FOREIGN KEY (`merchandise_id`) REFERENCES `merchandises`(`merchandise_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `merchandiseinbounds` ADD CONSTRAINT `merchandiseinbounds_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`supplier_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `merchandiseinbounds` ADD CONSTRAINT `merchandiseinbounds_color_id_fkey` FOREIGN KEY (`color_id`) REFERENCES `colors`(`color_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `merchandiseinbounds` ADD CONSTRAINT `merchandiseinbounds_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `merchandiseoutbounds` ADD CONSTRAINT `merchandiseoutbounds_merchandise_id_fkey` FOREIGN KEY (`merchandise_id`) REFERENCES `merchandises`(`merchandise_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `merchandiseoutbounds` ADD CONSTRAINT `merchandiseoutbounds_fashiondesign_id_fkey` FOREIGN KEY (`fashiondesign_id`) REFERENCES `fashiondesigns`(`fashiondesign_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `merchandiseoutbounds` ADD CONSTRAINT `merchandiseoutbounds_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `merchandiseoutbounds` ADD CONSTRAINT `merchandiseoutbounds_tailor_id_fkey` FOREIGN KEY (`tailor_id`) REFERENCES `tailors`(`tailor_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `merchandiseoutbounds` ADD CONSTRAINT `merchandiseoutbounds_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;
