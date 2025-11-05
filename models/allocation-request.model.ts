import mongoose from "mongoose";

// Schema cho từng item trong yêu cầu đặt hàng
const requestItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
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
    estimatedPrice: Number, // Giá sỉ dự kiến
    notes: String // Ghi chú cho item này
}, { _id: false });

const schema = new mongoose.Schema(
    {
        requestNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        }, // Mã yêu cầu (auto-generate: REQ-YYYYMMDD-XXXX)
        dealerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Dealer",
            required: true
        },
        items: {
            type: [requestItemSchema],
            required: true,
            validate: {
                validator: function(items: any[]) {
                    return items && items.length > 0;
                },
                message: "Yêu cầu phải có ít nhất 1 sản phẩm"
            }
        }, // Danh sách xe cần đặt
        totalQuantity: {
            type: Number,
            required: true,
            min: 1
        }, // Tổng số lượng xe
        requestType: {
            type: String,
            enum: ["urgent", "normal", "scheduled"],
            default: "normal"
        },
        // urgent: Khẩn cấp (cần gấp)
        // normal: Bình thường
        // scheduled: Đặt hàng theo kế hoạch
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium"
        },
        expectedDeliveryDate: Date, // Ngày mong muốn nhận hàng
        reason: String, // Lý do đặt hàng (thiếu hàng, khách đặt trước, dự trữ...)
        status: {
            type: String,
            enum: ["draft", "pending", "approved", "rejected", "processing", "completed", "cancelled"],
            default: "draft"
        },
        // draft: Nháp
        // pending: Chờ duyệt
        // approved: Đã duyệt
        // rejected: Từ chối
        // processing: Đang xử lý (hãng đang chuẩn bị)
        // completed: Hoàn thành (đã nhận hàng)
        // cancelled: Đã hủy
        submittedAt: Date, // Thời gian gửi yêu cầu
        approvedAt: Date,
        approvedBy: String, // ID admin/EVM staff duyệt
        rejectedAt: Date,
        rejectedBy: String,
        rejectedReason: String, // Lý do từ chối
        completedAt: Date,
        cancelledAt: Date,
        cancelReason: String,
        // Liên kết với allocation thực tế (khi được duyệt)
        allocationIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "DealerAllocation"
        }], // Các allocation được tạo từ request này
        internalNotes: String, // Ghi chú nội bộ của admin
        notes: String, // Ghi chú của dealer
        createdBy: {
            type: String,
            required: true
        }, // ID dealer staff tạo yêu cầu
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
schema.index({ requestNumber: 1 });
schema.index({ status: 1, createdAt: -1 });
schema.index({ expectedDeliveryDate: 1, status: 1 });
schema.index({ priority: 1, status: 1 });
schema.index({ deleted: 1 });

const AllocationRequest = mongoose.model('AllocationRequest', schema, "allocation-requests");

export default AllocationRequest;

