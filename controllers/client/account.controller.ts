import { Request, Response } from 'express';
import AccountAdmin from '../../models/account-admin.model';
import Dealer from '../../models/dealer.model';
import Role from '../../models/role.model';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RequestClient } from '../../interfaces/request.interface';

export const loginPost = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập email và mật khẩu!"
            });
        }

        // Tìm tài khoản
        const existAccount = await AccountAdmin.findOne({
            email: email,
            deleted: false,
            status: "active"
        });

        if (!existAccount) {
            return res.status(401).json({
                success: false,
                message: "Email hoặc mật khẩu không chính xác!"
            });
        }

        // Kiểm tra mật khẩu
        const isPasswordValid = bcrypt.compareSync(password, `${existAccount.password}`);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Email hoặc mật khẩu không chính xác!"
            });
        }

        // Helper function để kiểm tra role có liên quan đến đại lý không
        const isDealerRole = (roleName: string): boolean => {
            const roleNameLower = roleName.toLowerCase();
            return roleNameLower.includes("quản lý đại lý") || 
                   roleNameLower.includes("quan ly dai ly") ||
                   roleNameLower.includes("dealer manager") ||
                   roleNameLower.includes("nhân viên bán hàng") ||
                   roleNameLower.includes("nhan vien ban hang") ||
                   roleNameLower.includes("sales staff") ||
                   roleNameLower.includes("sales") ||
                   roleNameLower.includes("đại lý") ||
                   roleNameLower.includes("dai ly");
        };

        // Kiểm tra role: chỉ cho phép các role liên quan đến đại lý
        let allowedRole = false;
        let userRole = "";
        
        for (const roleId of existAccount.roles) {
            const roleInfo = await Role.findOne({
                _id: roleId,
                deleted: false,
                status: "active"
            });

            if (roleInfo && roleInfo.name) {
                if (isDealerRole(roleInfo.name)) {
                    allowedRole = true;
                    userRole = roleInfo.name;
                    break;
                }
            }
        }

        // Điều kiện 1: Phải có role tương ứng với đại lý
        if (!allowedRole) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền truy cập ứng dụng này! Tài khoản phải có role liên quan đến đại lý."
            });
        }

        // Điều kiện 2: Kiểm tra tài khoản có được liên kết với dealer không và dealer phải active
        const dealer = await Dealer.findOne({
            accountId: existAccount._id.toString(),
            deleted: false,
            status: "active"
        });

        if (!dealer) {
            return res.status(403).json({
                success: false,
                message: "Tài khoản này chưa được liên kết với đại lý hoặc đại lý đã bị khóa!"
            });
        }

        // Điều kiện 3: Tài khoản phải active (đã kiểm tra ở trên)
        // Tất cả điều kiện đã thỏa mãn, cho phép đăng nhập

        // Tạo JWT Token
        const token = jwt.sign(
            {
                id: existAccount._id.toString(),
                email: existAccount.email,
                dealerId: dealer._id.toString(),
                role: userRole
            },
            `${process.env.JWT_SECRET}`,
            {
                expiresIn: "30d" // Token hết hạn sau 30 ngày
            }
        );

        // Cập nhật thời gian đăng nhập gần nhất
        await AccountAdmin.updateOne(
            { _id: existAccount._id },
            { lastLoginAt: new Date() }
        );

        // Trả về token và thông tin user
        res.json({
            success: true,
            message: "Đăng nhập thành công!",
            data: {
                token: token,
                user: {
                    id: existAccount._id.toString(),
                    fullName: existAccount.fullName,
                    email: existAccount.email,
                    role: userRole,
                    dealer: {
                        id: dealer._id.toString(),
                        name: dealer.name,
                        code: dealer.code
                    }
                }
            }
        });
    } catch (error: any) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Đã có lỗi xảy ra, vui lòng thử lại sau!"
        });
    }
};

