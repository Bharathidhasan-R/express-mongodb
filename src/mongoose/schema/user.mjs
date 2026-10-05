import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        user_name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        password: {
            type: String,
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },
        email: {
            type: String,
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true,
        },
    },
    { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);