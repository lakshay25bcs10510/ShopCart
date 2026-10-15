import express from "express";
import {addToCart, getCart, updateCartItemQuantity, removeFromCart} from "../controllers/cart.controllers.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const cartRoutes = express.Router();

cartRoutes.post("/:productId", isAuthenticated, addToCart)
cartRoutes.get("/", isAuthenticated, getCart)
cartRoutes.patch("/:productId", isAuthenticated, updateCartItemQuantity)
cartRoutes.delete("/:productId", isAuthenticated, removeFromCart)

export default cartRoutes;