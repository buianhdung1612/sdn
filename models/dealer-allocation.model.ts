import mongoose from "mongoose";

// Schema cho VIN embedded - không có status riêng
// Trạng thái VIN được quản lý qua DealerAllocation.status và sự tồn tại trong các Model khác
const vinSchema = new mongoose.Schema({
    vin: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    notes: String, // Ghi chú riêng cho VIN này (nếu cần)
    createdAt: Date, // Ngày thêm VIN
    createdBy: String // ID người tạo
}, { _id: false });

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
        quantity: {
            type: Number,
            required: true,
            min: 1
        }, // Số lượng xe được phân bổ
        allocatedQuantity: {
            type: Number,
            default: 0
        }, // Số lượng đã được phân bổ thực tế (có thể nhỏ hơn quantity)
        vins: {
            type: [vinSchema],
            default: []
        }, // Mảng VINs được nhúng vào allocation - không có status riêng
        status: {
            type: String,
            enum: ["pending", "allocated", "shipped", "delivered", "cancelled"],
            default: "pending"
        }, // pending - chờ phân bổ, allocated - đã phân bổ, shipped - đã giao hàng, delivered - đã nhận, cancelled - hủy
        allocatedAt: Date, // Ngày phân bổ
        shippedAt: Date, // Ngày giao hàng
        deliveredAt: Date, // Ngày nhận hàng
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
schema.index({ dealerId: 1, productId: 1, status: 1 });
schema.index({ variantHash: 1 });
schema.index({ "vins.vin": 1 }, { unique: true, sparse: true }); // VIN phải unique

const DealerAllocation = mongoose.model('DealerAllocation', schema, "dealer-allocations");

export default DealerAllocation;

