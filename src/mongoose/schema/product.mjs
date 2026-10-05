import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        category: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);