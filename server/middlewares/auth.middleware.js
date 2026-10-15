import jwt from 'jsonwebtoken';
import Customer from '../models/customer.model.js';

export const isAuthenticated = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const customer = await Customer.findById(decoded.customerId);
    if (!customer) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    req.customer = customer;
    next();
}