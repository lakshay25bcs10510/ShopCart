import Order from "../models/order.model.js";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";
import razorpay from "../config/razorpay.js";
import crypto from "crypto";

export const createOrder = async (req, res) => {
    try {
        const customerId = req.customer._id;
        const { shippingAddress } = req.body;

        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.pincode) {
            return res.status(400).json({ success: false, message: "Invalid shipping address details." });
        }

        const customer = await Customer.findById(customerId).populate("cart.product");

        if (!customer.cart || customer.cart.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty." });
        }

        let calculatedTotal = 0;
        const orderItems = [];

        for (const item of customer.cart) {
            const product = await Product.findById(item.product._id);
            if (!product) {
                return res.status(404).json({ success: false, message: `Product with ID ${item.product._id} not found.` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for product ${product.name}. Available: ${product.stock}` });
            }

            calculatedTotal += product.price * item.quantity;
            orderItems.push({
                product: product._id,
                name: product.name,
                quantity: item.quantity,
                price: product.price,
                image: product.image
            });
        }

        const shopCartOrder = await Order.create({
            customer: customerId,
            items: orderItems,
            shippingAddress,
            totalAmount: calculatedTotal,
            paymentStatus: "PENDING",
            status: "PENDING_PAYMENT"
        });

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(calculatedTotal * 100),
            currency: "INR",
            receipt: shopCartOrder._id.toString()
        })

        shopCartOrder.razorpayOrderId = razorpayOrder.id;
        await shopCartOrder.save();

        return res.status(200).json({
            success: true,
            shopCartOrderId: shopCartOrder._id,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const verifyPayment = async (req, res) => {
    try {
        const { shopCartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const order = await Order.findById(shopCartOrderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        const body = order.razorpayOrderId + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body).digest("hex");

        if (expectedSignature !== razorpay_signature) {
            order.paymentStatus = "FAILED";
            await order.save();
            return res.status(400).json({ success: false, message: "Invalid payment signature." });
        }

        order.paymentStatus = "PAID";
        order.status = "PLACED";
        order.razorpayPaymentId = razorpay_payment_id;
        await order.save();

        const customer = await Customer.findById(order.customer);

        if (customer) {
            customer.cart = [];
            await customer.save();
        }

        return res.status(200).json({ success: true, message: "Payment verified and order placed successfully.", orderId: order._id });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const getOrders = async (req, res) => {
    try {
        const orders = await Order.find({customer: req.customer._id}).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, orders });
    }catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}


export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (order.customer.toString() !== req.customer._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    return res.status(200).json({ success: true, order: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch order details." });
  }
};