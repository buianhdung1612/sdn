import mongoose from "mongoose";

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
        debt: {
            currentDebt: Number, // Công nợ hiện tại
            creditLimit: Number, // Hạn mức tín dụng
            paymentHistory: [{
                date: Date,
                amount: Number,
                type: String, // "payment" hoặc "debt"
                description: String
            }]
        },
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

