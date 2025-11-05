import { Request, Response } from 'express';
import DealerAllocation from '../../models/dealer-allocation.model';
import Dealer from '../../models/dealer.model';
import Product from '../../models/product.model';
import DealerPricing from '../../models/dealer-pricing.model';
import DealerInventory from '../../models/dealer-inventory.model';
import mongoose from 'mongoose';
import { pathAdmin } from '../../configs/variable.config';

// Báo cáo doanh số theo đại lý
export const salesByDealer = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, dealerId } = req.query;

        // Tạo filter cho ngày tháng
        const dateFilter: any = {};
        if (startDate || endDate) {
            dateFilter.deliveredAt = {};
            if (startDate) {
                dateFilter.deliveredAt.$gte = new Date(startDate as string);
            }
            if (endDate) {
                const end = new Date(endDate as string);
                end.setHours(23, 59, 59, 999);
                dateFilter.deliveredAt.$lte = end;
            }
        } else {
            // Mặc định lấy 30 ngày gần nhất
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            dateFilter.deliveredAt = { $gte: thirtyDaysAgo };
        }

        // Filter theo đại lý nếu có
        if (dealerId) {
            dateFilter.dealerId = new mongoose.Types.ObjectId(dealerId as string);
        }

        // Lấy danh sách đại lý để hiển thị
        const dealers = await Dealer.find({ deleted: false, status: "active" })
            .select('name code address')
            .sort({ name: 1 })
            .lean();

        // Tính doanh số theo đại lý
        const salesStats = await DealerAllocation.aggregate([
            {
                $match: {
                    status: "delivered",
                    deleted: false,
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: "$dealerId",
                    totalQuantity: { $sum: "$quantity" },
                    totalAllocations: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "dealers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "dealerInfo"
                }
            },
            {
                $unwind: {
                    path: "$dealerInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    dealerId: "$_id",
                    dealerName: "$dealerInfo.name",
                    dealerCode: "$dealerInfo.code",
                    dealerAddress: "$dealerInfo.address",
                    totalQuantity: 1,
                    totalAllocations: 1
                }
            },
            {
                $sort: { totalQuantity: -1 }
            }
        ]);

        // Tính giá trị doanh số cho từng đại lý
        for (const stat of salesStats) {
            // Lấy tất cả allocations của đại lý này trong khoảng thời gian
            const allocations = await DealerAllocation.find({
                dealerId: stat.dealerId,
                status: "delivered",
                deleted: false,
                ...dateFilter
            })
            .populate('productId', 'name version variants')
            .lean();

            let totalRevenue = 0;

            for (const allocation of allocations) {
                const product = allocation.productId as any;
                const productId = product._id ? product._id : allocation.productId;
                
                // Tìm giá sỉ cho allocation này
                const pricing = await DealerPricing.findOne({
                    dealerId: stat.dealerId,
                    productId: productId,
                    variantIndex: allocation.variantIndex !== null && allocation.variantIndex !== undefined ? allocation.variantIndex : null,
                    status: "active",
                    deleted: false,
                    effectiveDate: { $lte: allocation.deliveredAt || new Date() },
                    $or: [
                        { expiryDate: null },
                        { expiryDate: { $gte: allocation.deliveredAt || new Date() } }
                    ]
                })
                .sort({ effectiveDate: -1 })
                .lean();

                if (pricing) {
                    totalRevenue += pricing.wholesalePrice * allocation.quantity;
                } else {
                    // Nếu không có giá sỉ, dùng giá gốc của variant
                    if (product && product.variants && product.variants[allocation.variantIndex]) {
                        const variant = product.variants[allocation.variantIndex];
                        const variantPrice = variant.priceNew || variant.newPrice || product.basePrice || 0;
                        totalRevenue += variantPrice * allocation.quantity;
                    }
                }
            }

            (stat as any).totalRevenue = totalRevenue;
        }

        // Tính tổng doanh số
        const totalStats = salesStats.reduce((acc, stat: any) => {
            acc.totalQuantity += stat.totalQuantity;
            acc.totalRevenue += stat.totalRevenue || 0;
            acc.totalAllocations += stat.totalAllocations;
            return acc;
        }, { totalQuantity: 0, totalRevenue: 0, totalAllocations: 0 });

        res.render("admin/pages/report-sales-by-dealer", {
            pageTitle: "Báo cáo doanh số theo đại lý",
            salesStats: salesStats,
            dealers: dealers,
            totalStats: totalStats,
            filters: {
                startDate: startDate || '',
                endDate: endDate || '',
                dealerId: dealerId || ''
            }
        });
    } catch (error) {
        console.log(error);
        res.render("admin/pages/report-sales-by-dealer", {
            pageTitle: "Báo cáo doanh số theo đại lý",
            salesStats: [],
            dealers: [],
            totalStats: { totalQuantity: 0, totalRevenue: 0, totalAllocations: 0 },
            filters: {
                startDate: '',
                endDate: '',
                dealerId: ''
            }
        });
    }
};

// Báo cáo tồn kho
export const inventoryReport = async (req: Request, res: Response) => {
    try {
        const { productId, dealerId } = req.query;

        // Lấy danh sách sản phẩm
        const products = await Product.find({ deleted: false, status: "active" })
            .select('name version variants')
            .sort({ name: 1 })
            .lean();

        // Lấy danh sách đại lý
        const dealers = await Dealer.find({ deleted: false, status: "active" })
            .select('name code')
            .sort({ name: 1 })
            .lean();

        // Tính tồn kho tổng (EVM Stock)
        const evmStockStats: any[] = [];
        for (const product of products) {
            if (productId && product._id.toString() !== productId) continue;

            const variants = product.variants || [];
            for (let i = 0; i < variants.length; i++) {
                const variant = variants[i];
                if (variant.status === false) continue;

                const stock = variant.stock || 0;
                
                // Tính số lượng đã được phân bổ (pending, allocated, shipped)
                const allocatedCount = await DealerAllocation.aggregate([
                    {
                        $match: {
                            productId: product._id,
                            variantIndex: i,
                            status: { $in: ["pending", "allocated", "shipped"] },
                            deleted: false
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: "$quantity" }
                        }
                    }
                ]);

                const allocated = allocatedCount.length > 0 ? allocatedCount[0].total : 0;
                const availableStock = Math.max(0, stock - allocated);

                evmStockStats.push({
                    productId: product._id,
                    productName: product.name,
                    productVersion: product.version,
                    variantIndex: i,
                    variantLabel: variant.attributeValue?.map((av: any) => av.label).join(', ') || `Biến thể ${i + 1}`,
                    totalStock: stock,
                    allocatedStock: allocated,
                    availableStock: availableStock
                });
            }
        }

        // Tính tồn kho đại lý (Dealer Inventory)
        const dealerInventoryFilter: any = { deleted: false };
        if (dealerId) {
            dealerInventoryFilter.dealerId = new mongoose.Types.ObjectId(dealerId as string);
        }
        if (productId) {
            dealerInventoryFilter.productId = new mongoose.Types.ObjectId(productId as string);
        }

        const dealerInventoryStats = await DealerInventory.aggregate([
            {
                $match: dealerInventoryFilter
            },
            {
                $group: {
                    _id: {
                        dealerId: "$dealerId",
                        productId: "$productId",
                        variantIndex: "$variantIndex"
                    },
                    totalStock: { $sum: "$stock" }
                }
            },
            {
                $lookup: {
                    from: "dealers",
                    localField: "_id.dealerId",
                    foreignField: "_id",
                    as: "dealerInfo"
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id.productId",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            {
                $unwind: "$dealerInfo"
            },
            {
                $unwind: "$productInfo"
            },
            {
                $project: {
                    dealerId: "$_id.dealerId",
                    dealerName: "$dealerInfo.name",
                    dealerCode: "$dealerInfo.code",
                    productId: "$_id.productId",
                    productName: "$productInfo.name",
                    productVersion: "$productInfo.version",
                    variantIndex: "$_id.variantIndex",
                    totalStock: 1
                }
            },
            {
                $sort: { dealerName: 1, productName: 1 }
            }
        ]);

        // Format variant labels cho dealer inventory
        for (const stat of dealerInventoryStats) {
            const product = products.find(p => p._id.toString() === stat.productId.toString());
            if (product && product.variants && product.variants[stat.variantIndex]) {
                const variant = product.variants[stat.variantIndex];
                (stat as any).variantLabel = variant.attributeValue?.map((av: any) => av.label).join(', ') || `Biến thể ${stat.variantIndex + 1}`;
            } else {
                (stat as any).variantLabel = `Biến thể ${stat.variantIndex + 1}`;
            }
        }

        res.render("admin/pages/report-inventory", {
            pageTitle: "Báo cáo tồn kho",
            evmStockStats: evmStockStats,
            dealerInventoryStats: dealerInventoryStats,
            products: products,
            dealers: dealers,
            filters: {
                productId: productId || '',
                dealerId: dealerId || ''
            }
        });
    } catch (error) {
        console.log(error);
        res.render("admin/pages/report-inventory", {
            pageTitle: "Báo cáo tồn kho",
            evmStockStats: [],
            dealerInventoryStats: [],
            products: [],
            dealers: [],
            filters: {
                productId: '',
                dealerId: ''
            }
        });
    }
};

// Báo cáo tốc độ tiêu thụ
export const consumptionRate = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, productId, dealerId } = req.query;

        // Mặc định từ ngày 5/11
        let start: Date;
        let end: Date = new Date();
        end.setHours(23, 59, 59, 999);

        if (startDate && endDate) {
            start = new Date(startDate as string);
            start.setHours(0, 0, 0, 0);
            end = new Date(endDate as string);
            end.setHours(23, 59, 59, 999);
        } else {
            // Mặc định từ ngày 5/11 năm hiện tại
            const currentYear = new Date().getFullYear();
            start = new Date(currentYear, 10, 5); // Tháng 11 = index 10 (0-based)
            start.setHours(0, 0, 0, 0);
        }

        // Tính số lượng đã delivered theo ngày
        const consumptionFilter: any = {
            status: "delivered",
            deleted: false,
            deliveredAt: { $gte: start, $lte: end }
        };

        if (productId) {
            consumptionFilter.productId = new mongoose.Types.ObjectId(productId as string);
        }
        if (dealerId) {
            consumptionFilter.dealerId = new mongoose.Types.ObjectId(dealerId as string);
        }

        // Nhóm theo ngày
        const dailyConsumption = await DealerAllocation.aggregate([
            {
                $match: consumptionFilter
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$deliveredAt" }
                    },
                    totalQuantity: { $sum: "$quantity" },
                    totalAllocations: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Nhóm theo sản phẩm
        const productConsumption = await DealerAllocation.aggregate([
            {
                $match: consumptionFilter
            },
            {
                $group: {
                    _id: "$productId",
                    totalQuantity: { $sum: "$quantity" },
                    totalAllocations: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            {
                $unwind: "$productInfo"
            },
            {
                $project: {
                    productId: "$_id",
                    productName: "$productInfo.name",
                    productVersion: "$productInfo.version",
                    totalQuantity: 1,
                    totalAllocations: 1
                }
            },
            {
                $sort: { totalQuantity: -1 }
            }
        ]);

        // Tính tốc độ tiêu thụ trung bình
        const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const totalConsumed = dailyConsumption.reduce((sum, item) => sum + item.totalQuantity, 0);
        const averageDailyConsumption = totalDays > 0 ? (totalConsumed / totalDays).toFixed(2) : 0;

        // Lấy danh sách sản phẩm và đại lý cho filter
        const products = await Product.find({ deleted: false, status: "active" })
            .select('name version')
            .sort({ name: 1 })
            .lean();

        const dealers = await Dealer.find({ deleted: false, status: "active" })
            .select('name code')
            .sort({ name: 1 })
            .lean();

        res.render("admin/pages/report-consumption-rate", {
            pageTitle: "Báo cáo tốc độ tiêu thụ",
            dailyConsumption: dailyConsumption,
            productConsumption: productConsumption,
            averageDailyConsumption: averageDailyConsumption,
            totalConsumed: totalConsumed,
            products: products,
            dealers: dealers,
            filters: {
                startDate: startDate || start.toISOString().split('T')[0],
                endDate: endDate || end.toISOString().split('T')[0],
                productId: productId || '',
                dealerId: dealerId || ''
            }
        });
    } catch (error) {
        console.log(error);
        res.render("admin/pages/report-consumption-rate", {
            pageTitle: "Báo cáo tốc độ tiêu thụ",
            dailyConsumption: [],
            productConsumption: [],
            averageDailyConsumption: 0,
            totalConsumed: 0,
            products: [],
            dealers: [],
            filters: {
                startDate: '',
                endDate: '',
                productId: '',
                dealerId: ''
            }
        });
    }
};

