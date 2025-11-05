import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        bookingNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true
        }, // Mã đặt lịch (auto-generate: TD-YYYYMMDD-XXXX)
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
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        }, // Xe muốn lái thử
        variantIndex: {
            type: Number,
            required: true
        }, // Variant cụ thể muốn lái thử
        scheduledDate: {
            type: Date,
            required: true
        }, // Ngày hẹn lái thử
        scheduledTime: {
            type: String,
            required: true
        }, // Giờ hẹn (format: "HH:MM")
        duration: {
            type: Number,
            default: 30
        }, // Thời gian lái thử (phút)
        location: {
            type: String,
            required: true
        }, // Địa điểm lái thử
        notes: String, // Ghi chú của khách hàng
        status: {
            type: String,
            enum: ["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"],
            default: "pending"
        },
        // pending: Chờ xác nhận
        // confirmed: Đã xác nhận
        // in_progress: Đang diễn ra
        // completed: Hoàn thành
        // cancelled: Đã hủy
        // no_show: Khách không đến
        confirmedAt: Date,
        confirmedBy: String, // ID nhân viên xác nhận
        startedAt: Date, // Thời gian bắt đầu lái thử thực tế
        completedAt: Date,
        cancelledAt: Date,
        cancelReason: String,
        feedback: String, // Phản hồi sau khi lái thử
        rating: {
            type: Number,
            min: 1,
            max: 5
        }, // Đánh giá sau lái thử
        assignedStaff: String, // Nhân viên phụ trách
        vehicleVIN: String, // VIN của xe dùng lái thử (nếu có)
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
schema.index({ productId: 1, deleted: 1 });
schema.index({ scheduledDate: 1, status: 1 });
schema.index({ bookingNumber: 1 });
schema.index({ status: 1, deleted: 1 });

const TestDrive = mongoose.model('TestDrive', schema, "test-drives");

export default TestDrive;

