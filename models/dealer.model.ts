import mongoose from "mongoose";

// Schema cho payment history entry
const paymentHistorySchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ["payment", "debt"],
        required: true
    },
    description: {
        type: String,
        default: ""
    }
}, { _id: false });

// Schema cho debt
const debtSchema = new mongoose.Schema({
    currentDebt: {
        type: Number,
        default: 0
    },
    creditLimit: {
        type: Number,
        default: 0
    },
    paymentHistory: {
        type: [paymentHistorySchema],
        default: []
    }
}, { _id: false });

const schema = new mongoose.Schema(
    {
        name: String,
        code: String, // Mã đại lý
        address: String,
        phone: String,
        email: String,
        contract: {
            contractNumber: String, // Số hợp đồng
            contractDate: Date, // Ngày ký hợp đồng
            expiryDate: Date, // Ngày hết hạn
            contractValue: Number, // Giá trị hợp đồng
            contractType: String, // Loại hợp đồng
            description: String // Mô tả hợp đồng
        },
        debt: debtSchema,
        accountId: String, // ID tài khoản đại lý trên hệ thống
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        },
        search: String,
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

const Dealer = mongoose.model('Dealer', schema, "dealers");

export default Dealer;

