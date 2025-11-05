import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        dealerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Dealer",
            required: true
        },
        year: {
            type: Number,
            required: true
        },
        yearlyTarget: {
            type: Number,
            default: 0
        },
        quarterlyTarget: [{
            quarter: {
                type: Number,
                enum: [1, 2, 3, 4]
            },
            target: {
                type: Number,
                default: 0
            }
        }],
        monthlyTarget: [{
            month: {
                type: Number,
                enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            },
            target: {
                type: Number,
                default: 0
            }
        }], // Chỉ tiêu số chiếc theo tháng
        note: String, // Ghi chú về chỉ tiêu
        createdBy: String, // ID người tạo
        updatedBy: String, // ID người cập nhật
        status: {
            type: String,
            enum: ["active", "archived"], // active - đang sử dụng, archived - đã lưu trữ
            default: "active"
        },
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

// Index để truy vấn nhanh
schema.index({ dealerId: 1, year: 1, status: 1 });

const DealerTargetSales = mongoose.model('DealerTargetSales', schema, "dealer-target-sales");

export default DealerTargetSales;

