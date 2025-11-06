import mongoose, { Schema } from "mongoose";
import { convertToSlug } from "../helpers/format.helper";

// Schema cho Item trong đơn hàng
const orderItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    variantIndex: {
        type: Number,
        required: true
    },
    variantHash: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    // Lưu snapshot thông tin sản phẩm tại thời điểm đặt hàng
    productSnapshot: {
        name: String,
        version: String,
        images: [String],
        attributeValues: [String] // Màu sắc, nội thất...
    }
}, { _id: false });

// Schema cho lịch sử trạng thái
const statusHistorySchema = new Schema({
    status: {
        type: String,
        required: true,
        enum: ["draft", "pending", "confirmed", "processing", "delivering", "completed", "cancelled", "refunded"]
    },
    changedAt: {
        type: Date,
        default: Date.now
    },
    changedBy: {
        type: Schema.Types.ObjectId,
        ref: "AccountAdmin"
    },
    notes: String
}, { _id: false });

// Main Order Schema
const orderSchema = new Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true
        },
        dealerId: {
            type: Schema.Types.ObjectId,
            ref: "Dealer",
            required: true
        },
        customerId: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            required: true
        },
        items: [orderItemSchema],
        
        // Tổng giá trị
        subtotal: {
            type: Number,
            required: true,
            min: 0
        },
        discountAmount: {
            type: Number,
            default: 0,
            min: 0
        },
        taxAmount: {
            type: Number,
            default: 0,
            min: 0
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        // Thông tin khách hàng (snapshot)
        customerSnapshot: {
            fullName: String,
            phone: String,
            email: String,
            address: String
        },

        // Trạng thái đơn hàng
        status: {
            type: String,
            enum: ["draft", "pending", "confirmed", "processing", "delivering", "completed", "cancelled", "refunded"],
            default: "draft"
        },

        // Lịch sử thay đổi trạng thái
        statusHistory: [statusHistorySchema],

        // Ngày quan trọng
        orderedAt: Date,          // Ngày khách đặt hàng (khi chuyển từ draft -> pending)
        confirmedAt: Date,        // Ngày dealer xác nhận
        completedAt: Date,        // Ngày hoàn thành
        cancelledAt: Date,        // Ngày hủy

        // Ghi chú
        customerNotes: String,    // Ghi chú từ khách hàng
        dealerNotes: String,      // Ghi chú nội bộ dealer

        // Phương thức thanh toán dự kiến
        paymentMethod: {
            type: String,
            enum: ["cash", "bank_transfer", "installment", "other"],
            default: "cash"
        },

        // Địa chỉ giao hàng (nếu khác địa chỉ khách hàng)
        shippingAddress: {
            fullAddress: String,
            city: String,
            district: String,
            ward: String
        },

        // Metadata
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "AccountAdmin"
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: "AccountAdmin"
        },

        // Search field
        search: String,

        // Soft delete
        deleted: {
            type: Boolean,
            default: false
        },
        deletedAt: Date
    },
    {
        timestamps: true
    }
);

// Index
orderSchema.index({ dealerId: 1, status: 1 });
orderSchema.index({ customerId: 1, status: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ search: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ deleted: 1 });

// Pre-save middleware: Generate search field
orderSchema.pre('save', function(next) {
    const searchFields = [
        this.orderNumber,
        this.customerSnapshot?.fullName,
        this.customerSnapshot?.phone,
        this.customerSnapshot?.email
    ].filter(Boolean);
    
    this.search = convertToSlug(searchFields.join(' '));
    next();
});

const Order = mongoose.model("Order", orderSchema, "orders");

export default Order;

