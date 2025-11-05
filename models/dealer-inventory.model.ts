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
            required: true
        }, // Index của variant trong mảng variants của product
        variantHash: {
            type: String,
            required: true
        }, // Hash để identify variant (từ attributeValue)
        stock: {
            type: Number,
            required: true,
            default: 0,
            min: 0
        }, // Số lượng tồn kho của đại lý cho variant này
        reservedStock: {
            type: Number,
            default: 0,
            min: 0
        }, // Số lượng đã được đặt hàng nhưng chưa xuất kho
        lastUpdatedAt: Date, // Thời gian cập nhật tồn kho gần nhất
        notes: String, // Ghi chú
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
schema.index({ dealerId: 1, productId: 1, variantIndex: 1 }, { unique: true });
schema.index({ dealerId: 1, productId: 1 });
schema.index({ variantHash: 1 });

const DealerInventory = mongoose.model('DealerInventory', schema, "dealer-inventories");

export default DealerInventory;

