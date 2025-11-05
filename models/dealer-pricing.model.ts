import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        dealerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Dealer",
            required: true
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        variantIndex: {
            type: Number,
            default: null // null = áp dụng cho tất cả variants của product
        }, // Index của variant trong mảng variants của product (null = tất cả variants)
        wholesalePrice: {
            type: Number,
            required: true,
            min: 0
        }, // Giá sỉ cho đại lý này
        effectiveDate: {
            type: Date,
            required: true,
            default: Date.now
        }, // Ngày hiệu lực
        expiryDate: {
            type: Date,
            default: null
        }, // Ngày hết hạn (null = không có hạn)
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        },
        notes: String, // Ghi chú
        createdBy: String, // ID người tạo
        updatedBy: String, // ID người cập nhật
        deleted: {
            type: Boolean,
            default: false
        },
        deletedAt: Date
    },
    {
        timestamps: true,
    }
);

// Index để truy vấn nhanh
schema.index({ dealerId: 1, productId: 1, variantIndex: 1, status: 1 });
schema.index({ dealerId: 1, status: 1 });
schema.index({ effectiveDate: 1, expiryDate: 1 });

const DealerPricing = mongoose.model('DealerPricing', schema, "dealer-pricings");

export default DealerPricing;

