import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        feedbackNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true
        }, // Mã phản hồi (auto-generate: FB-YYYYMMDD-XXXX)
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true
        },
        dealerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Dealer",
            required: true
        },
        type: {
            type: String,
            enum: ["complaint", "suggestion", "compliment", "inquiry", "other"],
            required: true
        },
        // complaint: Khiếu nại
        // suggestion: Đề xuất
        // compliment: Khen ngợi
        // inquiry: Yêu cầu hỗ trợ
        // other: Khác
        category: {
            type: String,
            enum: ["product", "service", "staff", "facility", "delivery", "pricing", "other"],
            required: true
        }, // Danh mục phản hồi
        subject: {
            type: String,
            required: true,
            trim: true
        }, // Tiêu đề
        description: {
            type: String,
            required: true
        }, // Nội dung chi tiết
        images: [String], // Hình ảnh đính kèm (nếu có)
        relatedOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order"
        }, // Liên quan đến đơn hàng nào (nếu có)
        relatedProductId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        }, // Liên quan đến sản phẩm nào (nếu có)
        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium"
        },
        status: {
            type: String,
            enum: ["open", "in_progress", "resolved", "closed", "rejected"],
            default: "open"
        },
        // open: Mở (mới gửi)
        // in_progress: Đang xử lý
        // resolved: Đã giải quyết
        // closed: Đóng
        // rejected: Từ chối
        rating: {
            type: Number,
            min: 1,
            max: 5
        }, // Đánh giá mức độ hài lòng (1-5 sao)
        assignedTo: String, // ID nhân viên phụ trách
        response: String, // Phản hồi từ dealer
        respondedAt: Date,
        respondedBy: String, // ID người trả lời
        resolution: String, // Giải pháp/kết quả xử lý
        resolvedAt: Date,
        resolvedBy: String, // ID người giải quyết
        closedAt: Date,
        internalNotes: String, // Ghi chú nội bộ
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

// Indexes
schema.index({ customerId: 1, deleted: 1 });
schema.index({ dealerId: 1, deleted: 1 });
schema.index({ feedbackNumber: 1 });
schema.index({ type: 1, status: 1 });
schema.index({ status: 1, deleted: 1 });
schema.index({ priority: 1, status: 1 });
schema.index({ createdAt: -1 });

const CustomerFeedback = mongoose.model('CustomerFeedback', schema, "customer-feedbacks");

export default CustomerFeedback;

