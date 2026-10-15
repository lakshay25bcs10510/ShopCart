import express from "express";
import { registerCustomer } from "../controllers/customer.controllers.js";
import { loginCustomer } from "../controllers/customer.controllers.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { getCustomer } from "../controllers/customer.controllers.js";
import { logoutCustomer } from "../controllers/customer.controllers.js";

const customerRoutes = express.Router();

customerRoutes.post("/register", registerCustomer);
customerRoutes.post("/login", loginCustomer);
customerRoutes.get("/me", isAuthenticated, getCustomer);
customerRoutes.get("/logout", isAuthenticated, logoutCustomer);

export default customerRoutes;