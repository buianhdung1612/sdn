import { Response } from 'express';
import DealerAllocation from '../../models/dealer-allocation.model';
import Product from '../../models/product.model';
import mongoose from 'mongoose';
import { RequestClient } from '../../interfaces/request.interface';

// GET /api/client/allocations
// Lấy danh sách xe được phân bổ cho đại lý
export const getAllocationList = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string || "";
        const productId = req.query.productId as string || "";

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

        if (productId) {
            query.productId = new mongoose.Types.ObjectId(productId);
        }

        const totalRecords = await DealerAllocation.countDocuments(query);
        const totalPages = Math.ceil(totalRecords / limit);
        const skip = (page - 1) * limit;

        const allocations = await DealerAllocation.find(query)
            .populate('dealerId', 'name code')
            .populate('productId', 'name version images')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        const formattedAllocations = allocations.map((allocation: any) => {
            const product = allocation.productId;
            const variant = product?.variants?.[allocation.variantIndex];

            return {
                id: allocation._id.toString(),
                product: {
                    id: product._id.toString(),
                    name: product.name,
                    version: product.version,
                    images: product.images || []
                },
                variant: {
                    index: allocation.variantIndex,
                    hash: allocation.variantHash,
                    attributeValue: variant?.attributeValue || [],
                    price: variant?.price || 0,
                    sku: variant?.sku || ''
                },
                quantity: allocation.quantity,
                allocatedQuantity: allocation.allocatedQuantity,
                vinCount: allocation.vins?.length || 0,
                status: allocation.status,
                allocatedAt: allocation.allocatedAt,
                shippedAt: allocation.shippedAt,
                deliveredAt: allocation.deliveredAt,
                notes: allocation.notes,
                createdAt: allocation.createdAt
            };
        });

        res.json({
            success: true,
            message: "Lấy danh sách phân bổ thành công!",
            data: {
                allocations: formattedAllocations,
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

// GET /api/client/allocations/:id
// Lấy chi tiết một phân bổ
export const getAllocationDetail = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;
        const allocationId = req.params.id;

        if (!dealerId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        const allocation = await DealerAllocation.findOne({
            _id: allocationId,
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        })
        .populate('dealerId', 'name code email phone address')
        .populate('productId');

        if (!allocation) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông tin phân bổ!"
            });
        }

        const product: any = allocation.productId;
        const variant = product?.variants?.[allocation.variantIndex];

        res.json({
            success: true,
            message: "Lấy chi tiết phân bổ thành công!",
            data: {
                allocation: {
                    id: allocation._id.toString(),
                    dealer: allocation.dealerId,
                    product: {
                        id: product._id.toString(),
                        name: product.name,
                        version: product.version,
                        slug: product.slug,
                        images: product.images || [],
                        basePrice: product.basePrice,
                        rangeKm: product.rangeKm,
                        batteryKWh: product.batteryKWh,
                        maxPowerHP: product.maxPowerHP
                    },
                    variant: {
                        index: allocation.variantIndex,
                        hash: allocation.variantHash,
                        attributeValue: variant?.attributeValue || [],
                        price: variant?.price || 0,
                        sku: variant?.sku || ''
                    },
                    quantity: allocation.quantity,
                    allocatedQuantity: allocation.allocatedQuantity,
                    vins: allocation.vins || [],
                    status: allocation.status,
                    allocatedAt: allocation.allocatedAt,
                    shippedAt: allocation.shippedAt,
                    deliveredAt: allocation.deliveredAt,
                    notes: allocation.notes,
                    createdBy: allocation.createdBy,
                    updatedBy: allocation.updatedBy,
                    createdAt: allocation.createdAt,
                    updatedAt: allocation.updatedAt
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

// GET /api/client/allocations/:id/vins
// Lấy danh sách VIN của một phân bổ
export const getAllocationVins = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;
        const allocationId = req.params.id;

        if (!dealerId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        const allocation = await DealerAllocation.findOne({
            _id: allocationId,
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        })
        .select('vins status productId variantIndex')
        .populate('productId', 'name version');

        if (!allocation) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông tin phân bổ!"
            });
        }

        const vins = (allocation.vins || []).map((vinItem: any) => ({
            vin: vinItem.vin,
            notes: vinItem.notes,
            createdAt: vinItem.createdAt,
            createdBy: vinItem.createdBy
        }));

        res.json({
            success: true,
            message: "Lấy danh sách VIN thành công!",
            data: {
                allocationId: allocation._id.toString(),
                product: allocation.productId,
                vins: vins,
                totalVins: vins.length,
                status: allocation.status
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

// GET /api/client/allocations/summary
// Thống kê tổng quan về phân bổ
export const getAllocationSummary = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;

        if (!dealerId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        // Count by status
        const statusCounts = await DealerAllocation.aggregate([
            {
                $match: {
                    dealerId: new mongoose.Types.ObjectId(dealerId),
                    deleted: false
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalQuantity: { $sum: '$quantity' },
                    totalVins: { $sum: { $size: { $ifNull: ['$vins', []] } } }
                }
            }
        ]);

        const summary: any = {
            total: 0,
            pending: 0,
            allocated: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0,
            totalQuantity: 0,
            totalVins: 0
        };

        statusCounts.forEach(item => {
            summary[item._id] = item.count;
            summary.total += item.count;
            summary.totalQuantity += item.totalQuantity;
            summary.totalVins += item.totalVins;
        });

        res.json({
            success: true,
            message: "Lấy thống kê phân bổ thành công!",
            data: {
                summary: summary
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

