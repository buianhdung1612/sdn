import { Response } from 'express';
import TestDrive from '../../models/test-drive.model';
import Customer from '../../models/customer.model';
import Product from '../../models/product.model';
import mongoose from 'mongoose';
import { RequestClient } from '../../interfaces/request.interface';
import { generateUniqueNumber } from '../../helpers/generate.helper';

// [POST] /api/client/test-drives - Đặt lịch lái thử
export const createTestDrive = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req["dealerId"];
        const { customerId, productId, variantIndex, scheduledDate, scheduledTime, duration, location, notes } = req.body;

        // Validate required fields
        if (!customerId || !productId || typeof variantIndex !== 'number' || !scheduledDate || !scheduledTime || !location) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin!"
            });
        }

        // Check customer exists
        const customer = await Customer.findOne({
            _id: customerId,
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy khách hàng! Vui lòng đăng ký khách hàng trước."
            });
        }

        // Check product exists
        const product = await Product.findOne({
            _id: productId,
            status: "active",
            deleted: false
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm!"
            });
        }

        // Check variant exists
        if (!(product as any).variants || !(product as any).variants[variantIndex]) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phiên bản sản phẩm!"
            });
        }

        // Generate booking number
        const bookingNumber = generateUniqueNumber("TD");

        // Create test drive
        const testDrive = new TestDrive({
            bookingNumber,
            customerId: new mongoose.Types.ObjectId(customerId),
            dealerId: new mongoose.Types.ObjectId(dealerId),
            productId: new mongoose.Types.ObjectId(productId),
            variantIndex,
            scheduledDate: new Date(scheduledDate),
            scheduledTime,
            duration: duration || 30,
            location,
            notes,
            status: "pending"
        });

        await testDrive.save();

        // Populate data
        await testDrive.populate([
            { path: 'customerId', select: 'fullName phone email' },
            { path: 'productId', select: 'name version images' }
        ]);

        return res.status(201).json({
            success: true,
            message: "Đặt lịch lái thử thành công!",
            data: {
                testDrive
            }
        });
    } catch (error: any) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Đã có lỗi xảy ra, vui lòng thử lại sau!"
        });
    }
};

// [GET] /api/client/test-drives - Lấy danh sách lịch hẹn lái thử
export const getTestDriveList = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req["dealerId"];
        const { page = 1, limit = 20, status = "", customerId = "", fromDate = "", toDate = "" } = req.query;

        const pageNumber = parseInt(page as string);
        const limitNumber = parseInt(limit as string);
        const skip = (pageNumber - 1) * limitNumber;

        // Build query
        const query: any = {
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        };

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by customer
        if (customerId) {
            query.customerId = new mongoose.Types.ObjectId(customerId as string);
        }

        // Filter by date range
        if (fromDate) {
            query.scheduledDate = { $gte: new Date(fromDate as string) };
        }
        if (toDate) {
            if (query.scheduledDate) {
                query.scheduledDate.$lte = new Date(toDate as string);
            } else {
                query.scheduledDate = { $lte: new Date(toDate as string) };
            }
        }

        // Get total count
        const totalRecords = await TestDrive.countDocuments(query);

        // Get test drives
        const testDrives = await TestDrive.find(query)
            .populate('customerId', 'fullName phone email')
            .populate('productId', 'name version images')
            .select('-deleted -deletedAt -__v')
            .sort({ scheduledDate: -1, scheduledTime: -1 })
            .skip(skip)
            .limit(limitNumber)
            .lean();

        return res.json({
            success: true,
            message: "Lấy danh sách lịch hẹn lái thử thành công!",
            data: {
                testDrives,
                pagination: {
                    page: pageNumber,
                    limit: limitNumber,
                    totalRecords,
                    totalPages: Math.ceil(totalRecords / limitNumber)
                }
            }
        });
    } catch (error: any) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Đã có lỗi xảy ra, vui lòng thử lại sau!"
        });
    }
};

// [GET] /api/client/test-drives/:id - Lấy chi tiết lịch hẹn
export const getTestDriveDetail = async (req: RequestClient, res: Response) => {
    try {
        const testDriveId = req.params.id;
        const dealerId = req["dealerId"];

        if (!mongoose.Types.ObjectId.isValid(testDriveId)) {
            return res.status(400).json({
                success: false,
                message: "ID lịch hẹn không hợp lệ!"
            });
        }

        const testDrive = await TestDrive.findOne({
            _id: testDriveId,
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        })
            .populate('customerId', 'fullName phone email address')
            .populate('productId', 'name version images basePrice variants')
            .populate('dealerId', 'name code address phone')
            .select('-deleted -deletedAt -__v')
            .lean();

        if (!testDrive) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lịch hẹn lái thử!"
            });
        }

        return res.json({
            success: true,
            message: "Lấy thông tin lịch hẹn thành công!",
            data: {
                testDrive
            }
        });
    } catch (error: any) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Đã có lỗi xảy ra, vui lòng thử lại sau!"
        });
    }
};

// [PATCH] /api/client/test-drives/:id/confirm - Xác nhận lịch hẹn
export const confirmTestDrive = async (req: RequestClient, res: Response) => {
    try {
        const testDriveId = req.params.id;
        const dealerId = req["dealerId"];
        const { assignedStaff, vehicleVIN } = req.body;

        if (!mongoose.Types.ObjectId.isValid(testDriveId)) {
            return res.status(400).json({
                success: false,
                message: "ID lịch hẹn không hợp lệ!"
            });
        }

        const testDrive = await TestDrive.findOne({
            _id: testDriveId,
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        });

        if (!testDrive) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lịch hẹn lái thử!"
            });
        }

        if ((testDrive as any).status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Chỉ có thể xác nhận lịch hẹn đang chờ!"
            });
        }

        // Update status
        (testDrive as any).status = "confirmed";
        (testDrive as any).confirmedAt = new Date();
        (testDrive as any).confirmedBy = dealerId;
        
        if (assignedStaff) (testDrive as any).assignedStaff = assignedStaff;
        if (vehicleVIN) (testDrive as any).vehicleVIN = vehicleVIN;

        await testDrive.save();

        return res.json({
            success: true,
            message: "Xác nhận lịch hẹn thành công!",
            data: {
                testDrive
            }
        });
    } catch (error: any) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Đã có lỗi xảy ra, vui lòng thử lại sau!"
        });
    }
};

// [PATCH] /api/client/test-drives/:id/complete - Hoàn thành lái thử
export const completeTestDrive = async (req: RequestClient, res: Response) => {
    try {
        const testDriveId = req.params.id;
        const dealerId = req["dealerId"];
        const { feedback, rating } = req.body;

        if (!mongoose.Types.ObjectId.isValid(testDriveId)) {
            return res.status(400).json({
                success: false,
                message: "ID lịch hẹn không hợp lệ!"
            });
        }

        const testDrive = await TestDrive.findOne({
            _id: testDriveId,
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        });

        if (!testDrive) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lịch hẹn lái thử!"
            });
        }

        if (!["confirmed", "in_progress"].includes((testDrive as any).status)) {
            return res.status(400).json({
                success: false,
                message: "Chỉ có thể hoàn thành lịch hẹn đã xác nhận hoặc đang diễn ra!"
            });
        }

        // Update status
        (testDrive as any).status = "completed";
        (testDrive as any).completedAt = new Date();
        
        if (feedback) (testDrive as any).feedback = feedback;
        if (rating) (testDrive as any).rating = rating;

        await testDrive.save();

        return res.json({
            success: true,
            message: "Hoàn thành lái thử thành công!",
            data: {
                testDrive
            }
        });
    } catch (error: any) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Đã có lỗi xảy ra, vui lòng thử lại sau!"
        });
    }
};

// [PATCH] /api/client/test-drives/:id/cancel - Hủy lịch hẹn
export const cancelTestDrive = async (req: RequestClient, res: Response) => {
    try {
        const testDriveId = req.params.id;
        const dealerId = req["dealerId"];
        const { cancelReason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(testDriveId)) {
            return res.status(400).json({
                success: false,
                message: "ID lịch hẹn không hợp lệ!"
            });
        }

        const testDrive = await TestDrive.findOne({
            _id: testDriveId,
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        });

        if (!testDrive) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lịch hẹn lái thử!"
            });
        }

        if (!["pending", "confirmed"].includes((testDrive as any).status)) {
            return res.status(400).json({
                success: false,
                message: "Chỉ có thể hủy lịch hẹn đang chờ hoặc đã xác nhận!"
            });
        }

        // Update status
        (testDrive as any).status = "cancelled";
        (testDrive as any).cancelledAt = new Date();
        (testDrive as any).cancelReason = cancelReason || "Khách hàng hủy";

        await testDrive.save();

        return res.json({
            success: true,
            message: "Hủy lịch hẹn thành công!",
            data: {
                testDrive
            }
        });
    } catch (error: any) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Đã có lỗi xảy ra, vui lòng thử lại sau!"
        });
    }
};

