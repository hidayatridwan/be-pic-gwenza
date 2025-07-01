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

const router = express.Router();

router.use(authMiddleware);

router.get("/users", userController.search);

router.post("/tailors", tailorController.create);
router.get("/tailors", tailorController.search);
router.get("/tailors/{:tailorId}", tailorController.get);
router.put("/tailors/{:tailorId}", tailorController.update);
router.delete("/tailors/{:tailorId}", tailorController.remove);

router.get("/products", productController.search);

router.get("/variants", variantController.search);

router.post(
  "/imports",
  uploadMiddleware("orders").single("file"),
  importController.create
);
router.get("/imports", importController.search);

router.get("/orders", orderController.search);
router.get("/orders/summary", orderController.summary);
router.post("/orders/checklist", orderController.checkList);

router.post("/projects", projectController.create);
router.delete("/projects/{:projectId}", projectController.cancel);
router.get("/projects", projectController.searchProject);
router.get(
  "/projects/{:projectId}/items",
  projectController.getItemByProjectId
);

router.post("/inbounds", inboundController.create);
router.delete("/inbounds/{:inboundId}", inboundController.reject);
router.get("/inbounds", inboundController.search);

router.get("/reports/products", reportController.byProducts);
router.get("/reports/pic", reportController.byPIC);
router.get("/reports/tailors", reportController.byTailors);
router.get("/reports/date", reportController.byExpiredDate);
router.get("/reports/summary", reportController.bySummary);

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

export { router };
