import express from "express";
import { getItems, createItem, updateItem, deleteItem } from "../controllers/ItemController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.route("/").get(getItems).post(createItem);
router.route("/:id").put(updateItem).delete(deleteItem);

export default router;