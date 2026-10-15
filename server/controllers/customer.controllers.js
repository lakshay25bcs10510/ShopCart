import Customer from "../models/customer.model.js";
import bcrypt from "bcrypt";
import {genToken} from "../utils/generateToken.js";

const cookieOptions = {
    httpOnly: true,
    secure: true
}

export const registerCustomer = async (req, res) => {
    try {
        const { fullName, email, password, phone } = req.body;
        if (!fullName || !email || !password || !phone) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        const emailExists = await Customer.findOne({ email });
        if (emailExists) {
            return res.status(409).json({ message: "Email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newCustomer = await Customer.create({
            fullName,
            email,
            password: hashedPassword,
            phone
        });

        const token = genToken(newCustomer._id);
        res.cookie("token", token, cookieOptions);

        const customerData = {
            _id: newCustomer._id,
            fullName: newCustomer.fullName,
            email: newCustomer.email,
            phone: newCustomer.phone
        };

        return res.status(201).json({ message: "Customer registered successfully", customer: customerData });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const loginCustomer = async (req, res) => {
    try {
        const { email, password } = req.body;

        const customer = await Customer.findOne({ email }).select('+password');
        if (!customer) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isPasswordValid = await bcrypt.compare(password, customer.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = genToken(customer._id);
        res.cookie("token", token, cookieOptions);

        return res.status(200).json({ message: "Login successful", customerData: customer});

    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getCustomer = async (req, res) => {
    const customer = req.customer;
    return res.status(200).json({ message: "Customer found", customerData: customer });
}

export const logoutCustomer = async (req, res) => {
    try {
        res.clearCookie("token", cookieOptions);
        return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

