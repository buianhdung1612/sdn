import { Response, Request } from 'express';
import AllocationRequest from '../../models/allocation-request.model';
import Product from '../../models/product.model';
import DealerInventory from '../../models/dealer-inventory.model';
import mongoose from 'mongoose';
import { RequestClient } from '../../interfaces/request.interface';
import { generateUniqueNumber } from '../../helpers/generate.helper';
import crypto from 'crypto';

// Helper function để tạo hash từ variant
function createVariantHash(attributeValue: any[]): string {
    if (!attributeValue || !Array.isArray(attributeValue)) {
        return crypto.createHash('md5').update('').digest('hex');
    }
    const sorted = JSON.stringify(attributeValue.sort((a, b) => (a.value || '').localeCompare(b.value || '')));
    return crypto.createHash('md5').update(sorted).digest('hex');
}

// GET /api/client/allocation-requests
// Lấy danh sách yêu cầu đặt hàng của đại lý
export const getRequestList = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string || "";

        if (!dealerId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        // Build query
        const query: any = {
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        };

        if (status) {
            query.status = status;
        }

        const totalRecords = await AllocationRequest.countDocuments(query);
        const totalPages = Math.ceil(totalRecords / limit);
        const skip = (page - 1) * limit;

        const requests = await AllocationRequest.find(query)
            .populate('dealerId', 'name code')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        // Get product info for each request
        const formattedRequests: any[] = [];

        for (const request of requests) {
            const productIds = request.items.map((item: any) => item.productId);
            const products = await Product.find({
                _id: { $in: productIds },
                deleted: false
            }).select('name version images');

            const productMap: { [key: string]: any } = {};
            products.forEach(p => {
                productMap[p._id.toString()] = p;
            });

            const formattedItems = request.items.map((item: any) => {
                const product = productMap[item.productId.toString()];
                const variant = product?.variants?.[item.variantIndex];

                return {
                    productId: item.productId.toString(),
                    productName: product?.name || 'N/A',
                    productVersion: product?.version || '',
                    variantIndex: item.variantIndex,
                    variantAttributes: variant?.attributeValue || [],
                    quantity: item.quantity,
                    estimatedPrice: item.estimatedPrice,
                    notes: item.notes
                };
            });

            formattedRequests.push({
                id: request._id.toString(),
                requestNumber: request.requestNumber,
                totalQuantity: request.totalQuantity,
                requestType: request.requestType,
                priority: request.priority,
                expectedDeliveryDate: request.expectedDeliveryDate,
                reason: request.reason,
                status: request.status,
                items: formattedItems,
                submittedAt: request.submittedAt,
                approvedAt: request.approvedAt,
                rejectedAt: request.rejectedAt,
                rejectedReason: request.rejectedReason,
                completedAt: request.completedAt,
                cancelledAt: request.cancelledAt,
                cancelReason: request.cancelReason,
                notes: request.notes,
                createdAt: request.createdAt,
                updatedAt: request.updatedAt
            });
        }

        res.json({
            success: true,
            message: "Lấy danh sách yêu cầu đặt hàng thành công!",
            data: {
                requests: formattedRequests,
                pagination: {
                    page: page,
                    limit: limit,
                    totalRecords: totalRecords,
                    totalPages: totalPages
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

// GET /api/client/allocation-requests/:id
// Lấy chi tiết một yêu cầu đặt hàng
export const getRequestDetail = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;
        const requestId = req.params.id;

        if (!dealerId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        const request = await AllocationRequest.findOne({
            _id: requestId,
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        }).populate('dealerId', 'name code email phone');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy yêu cầu đặt hàng!"
            });
        }

        // Get product details
        const productIds = request.items.map((item: any) => item.productId);
        const products = await Product.find({
            _id: { $in: productIds },
            deleted: false
        });

        const productMap: { [key: string]: any } = {};
        products.forEach(p => {
            productMap[p._id.toString()] = p;
        });

        const formattedItems = request.items.map((item: any) => {
            const product = productMap[item.productId.toString()];
            const variant = product?.variants?.[item.variantIndex];

            return {
                productId: item.productId.toString(),
                product: product ? {
                    id: product._id.toString(),
                    name: product.name,
                    version: product.version,
                    images: product.images || [],
                    basePrice: product.basePrice
                } : null,
                variantIndex: item.variantIndex,
                variantHash: item.variantHash,
                variant: variant ? {
                    attributeValue: variant.attributeValue,
                    price: variant.price,
                    sku: variant.sku
                } : null,
                quantity: item.quantity,
                estimatedPrice: item.estimatedPrice,
                notes: item.notes
            };
        });

        res.json({
            success: true,
            message: "Lấy chi tiết yêu cầu đặt hàng thành công!",
            data: {
                request: {
                    id: request._id.toString(),
                    requestNumber: request.requestNumber,
                    dealer: request.dealerId,
                    items: formattedItems,
                    totalQuantity: request.totalQuantity,
                    requestType: request.requestType,
                    priority: request.priority,
                    expectedDeliveryDate: request.expectedDeliveryDate,
                    reason: request.reason,
                    status: request.status,
                    submittedAt: request.submittedAt,
                    approvedAt: request.approvedAt,
                    approvedBy: request.approvedBy,
                    rejectedAt: request.rejectedAt,
                    rejectedBy: request.rejectedBy,
                    rejectedReason: request.rejectedReason,
                    completedAt: request.completedAt,
                    cancelledAt: request.cancelledAt,
                    cancelReason: request.cancelReason,
                    allocationIds: request.allocationIds,
                    internalNotes: request.internalNotes,
                    notes: request.notes,
                    createdAt: request.createdAt,
                    updatedAt: request.updatedAt
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

// POST /api/client/allocation-requests
// Tạo yêu cầu đặt hàng mới
export const createRequest = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;
        const userId = req.userId;

        if (!dealerId || !userId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        const { items, requestType, priority, expectedDeliveryDate, reason, notes, submitNow } = req.body;

        // Validate items
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Danh sách sản phẩm không được để trống!"
            });
        }

        // Validate and process items
        const processedItems: any[] = [];
        let totalQuantity = 0;

        for (const item of items) {
            // Check product exists
            const product = await Product.findOne({
                _id: item.productId,
                deleted: false,
                status: "active"
            });

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: `Sản phẩm ${item.productId} không tồn tại hoặc đã ngừng kinh doanh!`
                });
            }

            // Check variant exists
            if (!product.variants || !product.variants[item.variantIndex]) {
                return res.status(400).json({
                    success: false,
                    message: `Phiên bản sản phẩm không tồn tại!`
                });
            }

            const variant = product.variants[item.variantIndex];
            const variantHash = createVariantHash(variant.attributeValue);

            processedItems.push({
                productId: item.productId,
                variantIndex: item.variantIndex,
                variantHash: variantHash,
                quantity: item.quantity,
                estimatedPrice: item.estimatedPrice || variant.price,
                notes: item.notes || ''
            });

            totalQuantity += parseInt(item.quantity);
        }

        // Generate request number
        const requestNumber = generateUniqueNumber("REQ");

        // Create request
        const newRequest = new AllocationRequest({
            requestNumber: requestNumber,
            dealerId: dealerId,
            items: processedItems,
            totalQuantity: totalQuantity,
            requestType: requestType || "normal",
            priority: priority || "medium",
            expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
            reason: reason || '',
            status: submitNow ? "pending" : "draft",
            submittedAt: submitNow ? new Date() : null,
            notes: notes || '',
            createdBy: userId
        });

        await newRequest.save();

        res.json({
            success: true,
            message: submitNow ? "Gửi yêu cầu đặt hàng thành công!" : "Lưu nháp yêu cầu đặt hàng thành công!",
            data: {
                requestId: newRequest._id.toString(),
                requestNumber: newRequest.requestNumber,
                status: newRequest.status
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

// PATCH /api/client/allocation-requests/:id/submit
// Gửi yêu cầu đặt hàng (từ draft -> pending)
export const submitRequest = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;
        const requestId = req.params.id;

        if (!dealerId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        const request = await AllocationRequest.findOne({
            _id: requestId,
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy yêu cầu đặt hàng!"
            });
        }

        if (request.status !== "draft") {
            return res.status(400).json({
                success: false,
                message: "Chỉ có thể gửi yêu cầu ở trạng thái nháp!"
            });
        }

        request.status = "pending";
        request.submittedAt = new Date();
        await request.save();

        res.json({
            success: true,
            message: "Gửi yêu cầu đặt hàng thành công!",
            data: {
                requestId: request._id.toString(),
                status: request.status,
                submittedAt: request.submittedAt
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

// PATCH /api/client/allocation-requests/:id/cancel
// Hủy yêu cầu đặt hàng
export const cancelRequest = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;
        const requestId = req.params.id;
        const { cancelReason } = req.body;

        if (!dealerId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        const request = await AllocationRequest.findOne({
            _id: requestId,
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy yêu cầu đặt hàng!"
            });
        }

        if (!["draft", "pending"].includes(request.status)) {
            return res.status(400).json({
                success: false,
                message: "Không thể hủy yêu cầu ở trạng thái này!"
            });
        }

        request.status = "cancelled";
        request.cancelledAt = new Date();
        request.cancelReason = cancelReason || "Đại lý hủy yêu cầu";
        await request.save();

        res.json({
            success: true,
            message: "Hủy yêu cầu đặt hàng thành công!",
            data: {
                requestId: request._id.toString(),
                status: request.status,
                cancelledAt: request.cancelledAt
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

// [PATCH] /api/client/allocation-requests/:id - Cập nhật yêu cầu đặt hàng (chỉ draft)
export const updateRequest = async (req: RequestClient, res: Response) => {
    try {
        const requestId = req.params.id;
        const dealerId = req["dealerId"];
        const { items, requestType, priority, expectedDeliveryDate, reason, notes } = req.body;

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({
                success: false,
                message: "ID yêu cầu không hợp lệ!"
            });
        }

        const request = await AllocationRequest.findOne({
            _id: requestId,
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy yêu cầu đặt hàng!"
            });
        }

        // Chỉ cho phép update khi status = draft
        if (request.status !== "draft") {
            return res.status(400).json({
                success: false,
                message: "Chỉ có thể cập nhật yêu cầu ở trạng thái nháp!"
            });
        }

        // Validate items nếu có
        if (items && Array.isArray(items)) {
            if (items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Danh sách sản phẩm không được để trống!"
                });
            }

            // Validate từng item
            for (const item of items) {
                if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
                    return res.status(400).json({
                        success: false,
                        message: "Product ID không hợp lệ!"
                    });
                }

                if (typeof item.variantIndex !== "number" || item.variantIndex < 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Variant index không hợp lệ!"
                    });
                }

                if (!item.quantity || item.quantity < 1) {
                    return res.status(400).json({
                        success: false,
                        message: "Số lượng phải lớn hơn 0!"
                    });
                }

                // Kiểm tra product có tồn tại
                const product = await Product.findOne({
                    _id: item.productId,
                    status: "active",
                    deleted: false
                });

                if (!product) {
                    return res.status(404).json({
                        success: false,
                        message: `Không tìm thấy sản phẩm với ID: ${item.productId}!`
                    });
                }

                // Kiểm tra variant có tồn tại
                if (!product.variants || !product.variants[item.variantIndex]) {
                    return res.status(404).json({
                        success: false,
                        message: `Không tìm thấy variant index ${item.variantIndex} của sản phẩm ${product.name}!`
                    });
                }
            }

            // Cập nhật items
            (request as any).items = items.map((item: any) => ({
                productId: new mongoose.Types.ObjectId(item.productId),
                variantIndex: item.variantIndex,
                variantHash: "", // Sẽ được tính lại
                quantity: item.quantity,
                notes: item.notes || ""
            }));

            // Tính lại tổng số lượng
            (request as any).totalQuantity = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
        }

        // Cập nhật các trường khác nếu có
        if (requestType) {
            if (!["normal", "urgent", "scheduled"].includes(requestType)) {
                return res.status(400).json({
                    success: false,
                    message: "Request type không hợp lệ! (normal, urgent, scheduled)"
                });
            }
            (request as any).requestType = requestType;
        }

        if (priority) {
            if (!["low", "medium", "high"].includes(priority)) {
                return res.status(400).json({
                    success: false,
                    message: "Priority không hợp lệ! (low, medium, high)"
                });
            }
            (request as any).priority = priority;
        }

        if (expectedDeliveryDate) {
            (request as any).expectedDeliveryDate = new Date(expectedDeliveryDate);
        }

        if (reason !== undefined) {
            (request as any).reason = reason;
        }

        if (notes !== undefined) {
            (request as any).notes = notes;
        }

        (request as any).updatedBy = dealerId;
        await request.save();

        return res.json({
            success: true,
            message: "Cập nhật yêu cầu đặt hàng thành công!",
            data: {
                request
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

// [DELETE] /api/client/allocation-requests/:id - Xóa yêu cầu đặt hàng (chỉ draft)
export const deleteRequest = async (req: RequestClient, res: Response) => {
    try {
        const requestId = req.params.id;
        const dealerId = req["dealerId"];

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({
                success: false,
                message: "ID yêu cầu không hợp lệ!"
            });
        }

        const request = await AllocationRequest.findOne({
            _id: requestId,
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy yêu cầu đặt hàng!"
            });
        }

        // Chỉ cho phép xóa khi status = draft
        if (request.status !== "draft") {
            return res.status(400).json({
                success: false,
                message: "Chỉ có thể xóa yêu cầu ở trạng thái nháp!"
            });
        }

        // Soft delete
        (request as any).deleted = true;
        (request as any).deletedAt = new Date();
        await request.save();

        return res.json({
            success: true,
            message: "Xóa yêu cầu đặt hàng thành công!",
            data: {
                requestId: request._id.toString()
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

