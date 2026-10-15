import mongoose from 'mongoose';
import Customer from '../models/customer.model.js';
import Product from '../models/product.model.js';

export const addToCart = async(req, res) => {
    try {
        const {productId} = req.params;
        const customerId = req.customer._id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
           return res.status(400).json({ message: 'Invalid product id' });
        }
        const product = await Product.findById(productId)
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const customer = await Customer.findById(customerId);

        const cartItem = customer.cart.find(p => p.product.toString() === productId);

        const currentQuantity = cartItem ? cartItem.quantity : 0;
        const requestedQuantity = currentQuantity + 1;
        
        if (product.stock < requestedQuantity) {
            return res.status(400).json({ message: "Product is out of stock or insufficient stock is available" });
        }

        if (cartItem) {
            cartItem.quantity += 1;
        } else {
            customer.cart.push({product: productId, quantity: 1});
        }


        await customer.save();
        return res.status(200).json({message: "Product added to cart"})
    }catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export const getCart = async (req, res) => {
    try {
        const customerId = req.customer._id;
        const customer = await Customer.findById(customerId).populate({
            path: 'cart.product',
            select: 'name description price category image stock'
        });
        return res.status(200).json({ cart: customer.cart });
    }catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export const updateCartItemQuantity = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;
        const customerId = req.customer._id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product id' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const customer = await Customer.findById(customerId);

        const cartItem = customer.cart.find(item => item.product.toString() === productId);
        if (!cartItem) {
            return res.status(404).json({ message: 'Product not in cart' });
        }

        if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
            return res.status(400).json({ message: 'Quantity must be an integer' });
        }
        if (quantity < 1) {
            return res.status(400).json({ message: 'Quantity must be at least 1' });
        }
        if (product.stock < quantity) {
            return res.status(400).json({ message: "Product is out of stock or insufficient stock is available" });
        }

        cartItem.quantity = quantity;
        await customer.save();
        return res.status(200).json({ message: 'Cart item quantity updated successfully' });
    }catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        const customerId = req.customer._id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product id' });
        }

        const customer = await Customer.findById(customerId);

        const cartIndex = customer.cart.findIndex(item => item.product.toString() === productId);

        if (cartIndex === -1) {
            return res.status(404).json({ message: 'Product not found in cart' });
        }
        customer.cart.splice(cartIndex, 1);
        await customer.save();
        return res.status(200).json({ message: 'Product removed from cart', cart: customer.cart });
    }catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}