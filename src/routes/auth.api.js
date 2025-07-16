import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { uploadMiddleware } from "../middlewares/upload.middleware.js";
import tailorController from "../controllers/tailor.controller.js";
import orderController from "../controllers/order.controller.js";
import projectController from "../controllers/project.controller.js";
import productController from "../controllers/product.controller.js";
import variantController from "../controllers/variant.controller.js";
import importController from "../controllers/import.controller.js";
import userController from "../controllers/user.controller.js";
import inboundController from "../controllers/inbound.controller.js";
import reportController from "../controllers/report.controller.js";
import fashionDesignController from "../controllers/fashion.design.controller.js";
import merchandiseController from "../controllers/merchandise.controller.js";
import merchandiseInboundController from "../controllers/merchandise.inbound.controller.js";
import merchandiseOutboundController from "../controllers/merchandise.outbound.controller.js";
import supplierController from "../controllers/supplier.controller.js";
import colorController from "../controllers/color.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/users", userController.search);

router.post("/tailors", tailorController.create);
router.get("/tailors", tailorController.search);
router.get("/tailors/{:tailorId}", tailorController.get);
router.put("/tailors/{:tailorId}", tailorController.update);
router.delete("/tailors/{:tailorId}", tailorController.remove);

router.post("/products", productController.create);
router.get("/products", productController.search);
router.get("/products/{:productId}", productController.get);
router.put("/products/{:productId}", productController.update);

router.get("/variants", variantController.search);

router.post(
  "/imports",
  uploadMiddleware("orders").single("file"),
  importController.create
);
router.get("/imports", importController.search);

router.get("/orders", orderController.search);
router.get("/orders/summary", orderController.summary);
router.get("/orders/{:productId}/{:variantId}", orderController.get);

router.post("/projects", projectController.create);
router.delete("/projects/{:projectId}", projectController.cancel);
router.get("/projects", projectController.searchProject);
router.get(
  "/projects/{:projectId}/items",
  projectController.getItemByProjectId
);
router.get("/projects/batch", projectController.getBatchProject);

router.post("/inbounds", inboundController.create);
router.delete("/inbounds/{:inboundId}", inboundController.reject);
router.get("/inbounds", inboundController.search);

router.get("/reports/products", reportController.byProducts);
router.get("/reports/pic", reportController.byPIC);
router.get("/reports/tailors", reportController.byTailors);
router.get("/reports/date", reportController.byExpiredDate);
router.get("/reports/merchandise-summary", reportController.byMerchandiseSummary);
router.get("/reports/merchandise-date", reportController.byMerchandiseDate);

router.post(
  "/fashion-designs",
  uploadMiddleware("fashion-designs").fields([
    { name: "sample_file", maxCount: 1 },
    { name: "revision_file", maxCount: 1 },
  ]),
  fashionDesignController.create
);
router.get("/fashion-designs", fashionDesignController.search);
router.put(
  "/fashion-designs/{:fashionDesignId}",
  uploadMiddleware("fashion-designs").fields([
    { name: "sample_file", maxCount: 1 },
    { name: "revision_file", maxCount: 1 },
  ]),
  fashionDesignController.update
);
router.delete(
  "/fashion-designs/{:fashionDesignId}",
  fashionDesignController.remove
);

router.post("/merchandises", merchandiseController.create);
router.get("/merchandises", merchandiseController.search);
router.get("/merchandises/{:merchandiseId}", merchandiseController.get);
router.put("/merchandises/{:merchandiseId}", merchandiseController.update);

router.post("/colors", colorController.create);
router.get("/colors", colorController.search);
router.get("/colors/{:colorId}", colorController.get);
router.put("/colors/{:colorId}", colorController.update);

router.post("/suppliers", supplierController.create);
router.get("/suppliers", supplierController.search);
router.get("/suppliers/{:supplierId}", supplierController.get);
router.put("/suppliers/{:supplierId}", supplierController.update);

router.post("/merchandise-inbounds", merchandiseInboundController.create);
router.get("/merchandise-inbounds", merchandiseInboundController.search);
router.get("/merchandise-inbounds/{:merchandiseId}/inbound-codes", merchandiseInboundController.inboundCodes);

router.post("/merchandise-outbounds", merchandiseOutboundController.create);
router.get("/merchandise-outbounds", merchandiseOutboundController.search);

export { router };
