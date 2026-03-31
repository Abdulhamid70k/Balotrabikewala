import express from "express";
import {
  getBikes, getBike, createBike, updateBike,
  deleteBike, deleteImage, getStats,
} from "../controllers/BIkeController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get("/stats", getStats);

router
  .route("/")
  .get(getBikes)
  .post(upload.array("images", 5), createBike);

router
  .route("/:id")
  .get(getBike)
  .put(upload.array("images", 5), updateBike)
  .delete(authorize("admin"), deleteBike);

router.delete("/:id/images/:imageId", deleteImage);

export default router;