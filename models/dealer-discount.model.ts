import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        dealerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Dealer",
            required: true
        },
        discountName: {
            type: String,
            required: true
        }, // Tên chính sách chiết khấu
        discountType: {
            type: String,
            enum: ["percentage", "fixed_amount"],
            required: true
        }, // "percentage" = phần trăm, "fixed_amount" = số tiền cố định
        discountValue: {
            type: Number,
            required: true,
            min: 0
        }, // Giá trị chiết khấu (% hoặc số tiền)
        applyTo: {
            type: String,
            enum: ["all_products", "specific_products", "product_category"],
            required: true,
            default: "all_products"
        }, // Áp dụng cho: tất cả sản phẩm, sản phẩm cụ thể, hoặc danh mục
        productIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        }], // Danh sách productId nếu applyTo = "specific_products"
        categoryIds: [String], // Danh sách categoryId nếu applyTo = "product_category"
        minQuantity: {
            type: Number,
            default: 1,
            min: 1
        }, // Số lượng tối thiểu để được chiết khấu
        minAmount: {
            type: Number,
            default: 0,
            min: 0
        }, // Tổng giá trị đơn hàng tối thiểu (nếu có)
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
schema.index({ dealerId: 1, status: 1 });
schema.index({ effectiveDate: 1, expiryDate: 1 });
schema.index({ applyTo: 1, productIds: 1 });

const DealerDiscount = mongoose.model('DealerDiscount', schema, "dealer-discounts");

export default DealerDiscount;

