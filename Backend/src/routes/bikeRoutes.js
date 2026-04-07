import express from "express";
import { getBikes, getBike, createBike, updateBike, deleteBike, getStats, getReport } from "../controllers/bikeController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.get("/stats",  getStats);
router.get("/report", getReport);

router.route("/").get(getBikes).post(createBike);
router.route("/:id")
  .get(getBike)
  .put(updateBike)
  .delete(authorize("admin"), deleteBike);

export default router;