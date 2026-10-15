import Product from "../models/product.model.js";
import mongoose from "mongoose";

export const addProduct = async (req, res) => {
    try {
        const { name, description, price, category, image, stock } = req.body;

        if (price <= 0) {
            return res.status(400).json({ message: 'Invalid Price' })
        }

        if (!name || !description || !price || !category || !image || !stock) {
            return res.status(400).json({ message: 'Missing required field' })
        }


        if (stock < 0) {
            return res.status(400).json({ message: 'Invalid Stock' })
        }

        const newProduct = await Product.create({ name, description, price, category, image, stock })

        return res.status(201).json({ message: 'Product Created Successfully', product: newProduct })
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const getAllProducts = async (req, res) => {
    try {
        const {search, category} = req.query;
        const filter = {};

        if (search) {
            filter.name = { $regex: search, $options: 'i' }
        }

        if (category) {
            filter.category = category
        }

        const products = await Product.find(filter)
        return res.status(200).json({ products: products })
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const getProductById = async (req, res) => {
    try {
        const {id} = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid id' })
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' })
        }

        return res.status(200).json({ product: product });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}