import mongoose from "mongoose";
import Product from "../models/product.model.js";
import Customer from "../models/customer.model.js";

export const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const customerId = req.customer._id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product id' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const customer = await Customer.findById(customerId);

        const isAlreadyWishlisted = customer.wishlist.some(item => item.toString() === productId);

        if (isAlreadyWishlisted) {
            return res.status(409).json({ message: 'Product already in wishlist' });
        }

        customer.wishlist.push(productId);
        await customer.save();

        return res.status(200).json({ message: 'Product added to wishlist' });
    }catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}


export const getWishlist = async (req, res) => {
    try {
        const customerId = req.customer._id;
        const customer = await Customer.findById(customerId).populate({
            path: 'wishlist',
            select: 'name description price category image stock'
        });
        return res.status(200).json({ wishlist: customer.wishlist });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const customerId = req.customer._id;
        
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product id' });
        }

        const customer = await Customer.findById(customerId);

        const wishlistIndex = customer.wishlist.findIndex(item => item.toString() === productId);

        if (wishlistIndex === -1) {
            return res.status(404).json({ message: 'Product not found in wishlist' });
        }

        customer.wishlist.splice(wishlistIndex, 1);
        await customer.save();

        return res.status(200).json({ message: 'Product removed from wishlist' });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}