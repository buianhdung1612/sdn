import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        name: String,
        slug: String,
        parent: String,
        description: String,
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        },
        deleted: {
            type: Boolean,
            default: false
        },
        search: String,
        deletedAt: Date
    },
    {
        timestamps: true, // Tự động sinh ra trường createdAt và updatedAt
    }
);

const CategoryProduct = mongoose.model("CategoryProduct", schema, "categories-product");

export default CategoryProduct;