import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import AccountAdmin from "../../models/account-admin.model";
import Dealer from "../../models/dealer.model";
import { RequestClient } from "../../interfaces/request.interface";

export const verifyToken = async (req: RequestClient, res: Response, next: NextFunction) => {
    try {
        // Lấy token từ header Authorization: Bearer <token>
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: "Token không hợp lệ hoặc không được cung cấp!"
            });
        }

        const token = authHeader.substring(7); // Bỏ qua "Bearer "

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token không hợp lệ!"
            });
        }

        // Giải mã token
        const decoded = jwt.verify(token, `${process.env.JWT_SECRET}`) as jwt.JwtPayload;

        // Kiểm tra tài khoản có tồn tại và active không
        const existAccount = await AccountAdmin.findOne({
            _id: decoded.id,
            email: decoded.email,
            deleted: false,
            status: "active"
        });

        if (!existAccount) {
            return res.status(401).json({
                success: false,
                message: "Token không hợp lệ hoặc tài khoản đã bị khóa!"
            });
        }

        // Kiểm tra dealer có tồn tại không
        const dealer = await Dealer.findOne({
            _id: decoded.dealerId,
            deleted: false,
            status: "active"
        });

        if (!dealer) {
            return res.status(401).json({
                success: false,
                message: "Đại lý không tồn tại hoặc đã bị khóa!"
            });
        }

        // Gán thông tin vào request để sử dụng ở các controller tiếp theo
        req.userId = decoded.id as string;
        req.dealerId = decoded.dealerId as string;
        req.role = decoded.role as string;

        next();
    } catch (error: any) {
        console.log(error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: "Token không hợp lệ!"
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: "Token đã hết hạn, vui lòng đăng nhập lại!"
            });
        }
        return res.status(500).json({
            success: false,
            message: "Đã có lỗi xảy ra, vui lòng thử lại sau!"
        });
    }
};
