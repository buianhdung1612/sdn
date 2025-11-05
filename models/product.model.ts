import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        name: String,
        version: String,
        slug: String,
        position: Number,
        category: [String],
        images: [String],
        basePrice: Number,
        rangeKm: Number,
        batteryKWh: Number,
        maxPowerHP: Number,
        attributes: Array,
        variants: Array,
        content: String,
        status: {
            type: String,
            enum: ["draft", "active", "inactive"],
            default: "draft"
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
