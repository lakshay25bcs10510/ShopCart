import express from "express";
import {createOrder, verifyPayment, getOrders, getOrderById} from "../controllers/order.controllers.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const orderRoutes = express.Router();

orderRoutes.post("/create-payment-order", isAuthenticated, createOrder);
orderRoutes.post("/verify-payment", isAuthenticated, verifyPayment);
orderRoutes.get("/", isAuthenticated, getOrders);
orderRoutes.get("/:id", isAuthenticated, getOrderById);

export default orderRoutes;