import express from 'express';
import { addProduct, getAllProducts, getProductById } from '../controllers/product.controller.js';

const productRoutes = express.Router();

productRoutes.post("/", addProduct)
productRoutes.get("/", getAllProducts)
productRoutes.get("/:id", getProductById)

export default productRoutes;