import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        },
        address: {
            type: String,
            trim: true
        },
        idCard: {
            type: String,
            trim: true,
            uppercase: true
        }, // CCCD/CMND
        dateOfBirth: Date,
        gender: {
            type: String,
            enum: ["male", "female", "other"],
            default: "other"
        },
        customerType: {
            type: String,
            enum: ["individual", "company"],
            default: "individual"
        }, // Cá nhân hoặc Doanh nghiệp
        companyName: String, // Nếu là doanh nghiệp
        taxCode: String, // Mã số thuế (nếu là doanh nghiệp)
        notes: String, // Ghi chú của dealer về khách hàng
        source: {
            type: String,
            enum: ["walk-in", "phone", "website", "referral", "other"],
            default: "walk-in"
        }, // Nguồn khách hàng
        dealerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Dealer",
            required: true
        }, // Dealer quản lý khách hàng này
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        },
        search: String, // Dùng để tìm kiếm (lowercase, slugified)
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
schema.index({ phone: 1, deleted: 1 });
schema.index({ dealerId: 1, deleted: 1 });
schema.index({ search: 1 });
schema.index({ email: 1 });
schema.index({ idCard: 1 });

const Customer = mongoose.model('Customer', schema, "customers");

export default Customer;

