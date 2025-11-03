import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        name: String,
        slug: String,
        version: String, // Phiên bản xe (Standard, Premium, Luxury, etc.)
        position: Number,
        category: [String],
        images: [String],
        colors: [
            {
                label: String, // Tên màu tiếng Việt (Đỏ, Trắng, Đen, etc.)
                value: String // Mã màu tiếng Anh (red, white, black, etc.)
            }
        ],
        priceOld: Number,
        priceNew: Number,
        description: String,
        content: String,
        status: {
            type: String,
            enum: ["draft", "active", "inactive"],
            default: "draft"
        },
        view: {
            type: Number,
            default: 0
        },
        search: String,
        deleted: {
            type: Boolean,
            default: false
        },
        deletedAt: Date
    },
    {
        timestamps: true, // Tự động sinh ra trường createdAt và updatedAt
    }
);

const Product = mongoose.model('Product', schema, "products");

export default Product;
