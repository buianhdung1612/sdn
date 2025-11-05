import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        dealerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Dealer",
            required: true
        },
        promotionName: {
            type: String,
            required: true
        }, // Tên chương trình khuyến mãi
        promotionType: {
            type: String,
            enum: ["buy_x_get_y", "discount_percentage", "fixed_discount", "free_gift"],
            required: true
        }, // Loại khuyến mãi
        // buy_x_get_y: Mua X tặng Y
        // discount_percentage: Giảm giá theo %
        // fixed_discount: Giảm giá số tiền cố định
        // free_gift: Tặng quà
        promotionValue: {
            type: Number,
            required: true,
            min: 0
        }, // Giá trị khuyến mãi (tùy theo promotionType)
        promotionConfig: {
            buyX: Number, // Số lượng mua (cho buy_x_get_y)
            getY: Number, // Số lượng được tặng (cho buy_x_get_y)
            giftProductId: mongoose.Schema.Types.ObjectId, // ProductId của quà tặng (cho free_gift)
            giftDescription: String // Mô tả quà tặng
        },
        applyTo: {
            type: String,
            enum: ["all_products", "specific_products"],
            required: true,
            default: "all_products"
        }, // Áp dụng cho: tất cả sản phẩm hoặc sản phẩm cụ thể
        productIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        }], // Danh sách productId nếu applyTo = "specific_products"
        conditions: {
            minQuantity: {
                type: Number,
                default: 1,
                min: 1
            }, // Số lượng tối thiểu
            minAmount: {
                type: Number,
                default: 0,
                min: 0
            } // Tổng giá trị đơn hàng tối thiểu
        },
        startDate: {
            type: Date,
            required: true,
            default: Date.now
        }, // Ngày bắt đầu
        endDate: {
            type: Date,
            required: true
        }, // Ngày kết thúc
        status: {
            type: String,
            enum: ["active", "inactive", "expired"],
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
schema.index({ startDate: 1, endDate: 1 });
schema.index({ applyTo: 1, productIds: 1 });

const DealerPromotion = mongoose.model('DealerPromotion', schema, "dealer-promotions");

export default DealerPromotion;

