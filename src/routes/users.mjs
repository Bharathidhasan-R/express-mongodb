import { Router } from "express";
import mongoose from "mongoose";
import { checkSchema, matchedData, validationResult } from "express-validator";
import { createUserValidationSchema } from "../utils/validationSchemas.mjs";
import { User } from "../mongoose/schema/user.mjs";
import { hashPassword } from "../utils/helper.mjs";

const router = Router();

// Fields that can be used in ?filter=...&value=...
const FILTERABLE_FIELDS = ["user_name", "email"];
// Fields allowed in PATCH
const PATCHABLE_FIELDS = ["user_name", "email", "password"];

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Runs automatically for every route that has :id
router.param("id", (req, res, next, id) => {
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).send({ msg: "Invalid user id" });
    }
    next();
});

// GET all users (admin cookie required), optional filter
router.get("/api/users", async (req, res) => {
    // if (req.signedCookies.user !== "Admin") {
    //     return res.status(403).send({ msg: "You are not an Admin / you don't have the right cookie" });
    // }

    try {
        const { filter, value } = req.query;
        const query = {};

        if (filter && value) {
            if (!FILTERABLE_FIELDS.includes(filter)) {
                return res.status(400).send({ msg: `Cannot filter by "${filter}"` });
            }
            query[filter] = { $regex: escapeRegex(String(value)), $options: "i" };
        }

        const users = await User.find(query).select("-password");
        return res.send(users);
    } catch (err) {
        console.log(err);
        return res.status(500).send({ msg: "Server error" });
    }
});

// GET one user
router.get("/api/users/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).send({ msg: "User Not Found" });
        }
        return res.send(user);
    } catch (err) {
        console.log(err);
        return res.status(500).send({ msg: "Server error" });
    }
});

// CREATE user
router.post("/api/users",
    checkSchema(createUserValidationSchema),
    async (req, res) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).send({ error: result.array() });
        }

        const body = matchedData(req);
        body.password = hashPassword(body.password);

        try {
            const savedUser = await new User(body).save();
            const userData = savedUser.toObject();
            delete userData.password;
            return res.status(201).send(userData);
        } catch (err) {
            console.log(err);
            if (err.code === 11000) {
                return res.status(409).send({ msg: "User already exists" });
            }
            return res.status(400).send({ msg: "User not Saved" });
        }
    }
);

// PUT: replace the whole user (all fields required)
router.put("/api/users/:id",
    checkSchema(createUserValidationSchema),
    async (req, res) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).send({ error: result.array() });
        }

        const body = matchedData(req);
        body.password = hashPassword(body.password);

        try {
            const updatedUser = await User.findOneAndReplace(
                { _id: req.params.id },
                body,
                { new: true, runValidators: true }
            ).select("-password");

            if (!updatedUser) {
                return res.status(404).send({ msg: "User Not Found" });
            }
            return res.status(200).send({ msg: "User Updated", user: updatedUser });
        } catch (err) {
            console.log(err);
            if (err.code === 11000) {
                return res.status(409).send({ msg: "Username or email already in use" });
            }
            return res.status(400).send({ msg: "User not Updated" });
        }
    }
);

// PATCH: update only the fields sent
router.patch("/api/users/:id", async (req, res) => {
    const updates = {};
    for (const field of PATCHABLE_FIELDS) {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).send({ msg: "No valid fields to update" });
    }

    if (updates.password) {
        updates.password = hashPassword(updates.password);
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).send({ msg: "User Not Found" });
        }
        return res.status(200).send({ msg: "User Updated", user: updatedUser });
    } catch (err) {
        console.log(err);
        if (err.code === 11000) {
            return res.status(409).send({ msg: "Username or email already in use" });
        }
        return res.status(400).send({ msg: "User not Updated" });
    }
});

// DELETE user
router.delete("/api/users/:id", async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).send({ msg: "User Not Found" });
        }
        return res.status(200).send({ msg: "User Deleted" });
    } catch (err) {
        console.log(err);
        return res.status(500).send({ msg: "Server error" });
    }
});

export default router;