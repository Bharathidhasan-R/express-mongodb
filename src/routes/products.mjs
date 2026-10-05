import { Router } from "express";
import mongoose from "mongoose";
import { Product } from "../mongoose/schema/product.mjs";

const router = Router();

const FILTERABLE_FIELDS = ["name", "category"];

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

router.param("id", (req, res, next, id) => {
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).send({ msg: "Invalid product id" });
    }
    next();
});

// GET all products, optional filter
router.get("/api/products", async (req, res) => {
    req.session.visited = true;

    try {
        const { filter, value } = req.query;
        const query = {};

        if (filter && value) {
            if (!FILTERABLE_FIELDS.includes(filter)) {
                return res.status(400).send({ msg: `Cannot filter by "${filter}"` });
            }
            query[filter] = { $regex: escapeRegex(String(value)), $options: "i" };
        }

        const products = await Product.find(query);
        return res.send(products);
    } catch (err) {
        console.log(err);
        return res.status(500).send({ msg: "Server error" });
    }
});

// GET one product
router.get("/api/products/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send({ msg: "Product Not Found" });
        }
        return res.send(product);
    } catch (err) {
        console.log(err);
        return res.status(500).send({ msg: "Server error" });
    }
});

// CREATE product
router.post("/api/products", async (req, res) => {
    try {
        const { name, price, category } = req.body;
        const savedProduct = await new Product({ name, price, category }).save();
        return res.status(201).send(savedProduct);
    } catch (err) {
        console.log(err);
        if (err.name === "ValidationError") {
            return res.status(400).send({ msg: err.message });
        }
        return res.status(500).send({ msg: "Server error" });
    }
});

// UPDATE product (only the fields sent)
router.patch("/api/products/:id", async (req, res) => {
    const { name, price, category } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (price !== undefined) updates.price = price;
    if (category !== undefined) updates.category = category;

    if (Object.keys(updates).length === 0) {
        return res.status(400).send({ msg: "No valid fields to update" });
    }

    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        );
        if (!product) {
            return res.status(404).send({ msg: "Product Not Found" });
        }
        return res.send(product);
    } catch (err) {
        console.log(err);
        return res.status(400).send({ msg: "Product not Updated" });
    }
});

// DELETE product
router.delete("/api/products/:id", async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).send({ msg: "Product Not Found" });
        }
        return res.send({ msg: "Product Deleted" });
    } catch (err) {
        console.log(err);
        return res.status(500).send({ msg: "Server error" });
    }
});

export default router;