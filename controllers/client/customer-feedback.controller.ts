import { Response } from 'express';
import CustomerFeedback from '../../models/customer-feedback.model';
import Customer from '../../models/customer.model';
import mongoose from 'mongoose';
import { RequestClient } from '../../interfaces/request.interface';
import { generateUniqueNumber } from '../../helpers/generate.helper';

// [POST] /api/client/feedbacks - Gửi phản hồi/khiếu nại
export const createFeedback = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req["dealerId"];
        const { customerId, type, category, subject, description, images, relatedOrderId, relatedProductId, rating } = req.body;

        // Validate required fields
        if (!customerId || !type || !category || !subject || !description) {
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

        // Generate feedback number
        const feedbackNumber = generateUniqueNumber("FB");

        // Determine priority based on type
        let priority = "medium";
        if (type === "complaint") {
            priority = "high";
        } else if (type === "compliment") {
            priority = "low";
        }

        // Create feedback
        const feedback = new CustomerFeedback({
            feedbackNumber,
            customerId: new mongoose.Types.ObjectId(customerId),
            dealerId: new mongoose.Types.ObjectId(dealerId),
            type,
            category,
            subject,
            description,
            images: images || [],
            relatedOrderId: relatedOrderId ? new mongoose.Types.ObjectId(relatedOrderId) : undefined,
            relatedProductId: relatedProductId ? new mongoose.Types.ObjectId(relatedProductId) : undefined,
            rating,
            priority,
            status: "open"
        });

        await feedback.save();

        // Populate data
        await feedback.populate([
            { path: 'customerId', select: 'fullName phone email' },
            { path: 'relatedProductId', select: 'name version' }
        ]);

        return res.status(201).json({
            success: true,
            message: "Gửi phản hồi thành công!",
            data: {
                feedback
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

// [GET] /api/client/feedbacks - Lấy danh sách phản hồi
export const getFeedbackList = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req["dealerId"];
        const { page = 1, limit = 20, status = "", type = "", category = "", priority = "", customerId = "" } = req.query;

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

        // Filter by type
        if (type) {
            query.type = type;
        }

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Filter by priority
        if (priority) {
            query.priority = priority;
        }

        // Filter by customer
        if (customerId) {
            query.customerId = new mongoose.Types.ObjectId(customerId as string);
        }

        // Get total count
        const totalRecords = await CustomerFeedback.countDocuments(query);

        // Get feedbacks
        const feedbacks = await CustomerFeedback.find(query)
            .populate('customerId', 'fullName phone email')
            .populate('relatedProductId', 'name version')
            .select('-deleted -deletedAt -internalNotes -__v')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber)
            .lean();

        return res.json({
            success: true,
            message: "Lấy danh sách phản hồi thành công!",
            data: {
                feedbacks,
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

// [GET] /api/client/feedbacks/:id - Lấy chi tiết phản hồi
export const getFeedbackDetail = async (req: RequestClient, res: Response) => {
    try {
        const feedbackId = req.params.id;
        const dealerId = req["dealerId"];

        if (!mongoose.Types.ObjectId.isValid(feedbackId)) {
            return res.status(400).json({
                success: false,
                message: "ID phản hồi không hợp lệ!"
            });
        }

        const feedback = await CustomerFeedback.findOne({
            _id: feedbackId,
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        })
            .populate('customerId', 'fullName phone email address')
            .populate('relatedProductId', 'name version images')
            .populate('dealerId', 'name code')
            .select('-deleted -deletedAt -__v')
            .lean();

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phản hồi!"
            });
        }

        return res.json({
            success: true,
            message: "Lấy thông tin phản hồi thành công!",
            data: {
                feedback
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

// [PATCH] /api/client/feedbacks/:id/reply - Trả lời phản hồi
export const replyFeedback = async (req: RequestClient, res: Response) => {
    try {
        const feedbackId = req.params.id;
        const dealerId = req["dealerId"];
        const { response } = req.body;

        if (!response) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập nội dung trả lời!"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(feedbackId)) {
            return res.status(400).json({
                success: false,
                message: "ID phản hồi không hợp lệ!"
            });
        }

        const feedback = await CustomerFeedback.findOne({
            _id: feedbackId,
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        });

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phản hồi!"
            });
        }

        // Update response
        (feedback as any).response = response;
        (feedback as any).respondedAt = new Date();
        (feedback as any).respondedBy = dealerId;
        
        // Update status to in_progress if still open
        if ((feedback as any).status === "open") {
            (feedback as any).status = "in_progress";
        }

        await feedback.save();

        return res.json({
            success: true,
            message: "Trả lời phản hồi thành công!",
            data: {
                feedback
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

// [PATCH] /api/client/feedbacks/:id/resolve - Giải quyết xong phản hồi
export const resolveFeedback = async (req: RequestClient, res: Response) => {
    try {
        const feedbackId = req.params.id;
        const dealerId = req["dealerId"];
        const { resolution } = req.body;

        if (!resolution) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập kết quả giải quyết!"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(feedbackId)) {
            return res.status(400).json({
                success: false,
                message: "ID phản hồi không hợp lệ!"
            });
        }

        const feedback = await CustomerFeedback.findOne({
            _id: feedbackId,
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        });

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phản hồi!"
            });
        }

        if ((feedback as any).status === "resolved" || (feedback as any).status === "closed") {
            return res.status(400).json({
                success: false,
                message: "Phản hồi đã được giải quyết hoặc đóng!"
            });
        }

        // Update resolution
        (feedback as any).resolution = resolution;
        (feedback as any).resolvedAt = new Date();
        (feedback as any).resolvedBy = dealerId;
        (feedback as any).status = "resolved";

        await feedback.save();

        return res.json({
            success: true,
            message: "Giải quyết phản hồi thành công!",
            data: {
                feedback
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

// [PATCH] /api/client/feedbacks/:id/close - Đóng phản hồi
export const closeFeedback = async (req: RequestClient, res: Response) => {
    try {
        const feedbackId = req.params.id;
        const dealerId = req["dealerId"];

        if (!mongoose.Types.ObjectId.isValid(feedbackId)) {
            return res.status(400).json({
                success: false,
                message: "ID phản hồi không hợp lệ!"
            });
        }

        const feedback = await CustomerFeedback.findOne({
            _id: feedbackId,
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        });

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phản hồi!"
            });
        }

        if ((feedback as any).status === "closed") {
            return res.status(400).json({
                success: false,
                message: "Phản hồi đã được đóng!"
            });
        }

        // Update status
        (feedback as any).status = "closed";
        (feedback as any).closedAt = new Date();

        await feedback.save();

        return res.json({
            success: true,
            message: "Đóng phản hồi thành công!",
            data: {
                feedback
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

