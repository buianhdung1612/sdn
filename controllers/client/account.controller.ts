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

        // Kiểm tra role: chỉ cho phép "quản lý đại lý" hoặc "nhân viên bán hàng"
        let allowedRole = false;
        let userRole = "";
        
        for (const roleId of existAccount.roles) {
            const roleInfo = await Role.findOne({
                _id: roleId,
                deleted: false,
                status: "active"
            });

            if (roleInfo) {
                const roleName = roleInfo.name?.toLowerCase() || "";
                // Kiểm tra role name có chứa từ khóa "quản lý đại lý" hoặc "nhân viên bán hàng"
                if (roleName.includes("quản lý đại lý") || 
                    roleName.includes("quan ly dai ly") ||
                    roleName.includes("dealer manager") ||
                    roleName.includes("nhân viên bán hàng") ||
                    roleName.includes("nhan vien ban hang") ||
                    roleName.includes("sales staff") ||
                    roleName.includes("sales")) {
                    allowedRole = true;
                    userRole = roleInfo.name || "";
                    break;
                }
            }
        }

        if (!allowedRole) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền truy cập ứng dụng này!"
            });
        }

        // Tìm đại lý tương ứng với account
        const dealer = await Dealer.findOne({
            accountId: existAccount._id.toString(),
            deleted: false,
            status: "active"
        });

        if (!dealer) {
            return res.status(403).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

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
                    avatar: existAccount.avatar,
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

