import { Request, Response } from 'express';
import { pathAdmin } from '../../configs/variable.config';
import Dealer from '../../models/dealer.model';
import Product from '../../models/product.model';
import DealerAllocation from '../../models/dealer-allocation.model';
import DealerInventory from '../../models/dealer-inventory.model';
import mongoose from 'mongoose';
import crypto from 'crypto';

// Helper function để tạo hash từ variant
function createVariantHash(attributeValue: any[]): string {
    if (!attributeValue || !Array.isArray(attributeValue)) {
        return crypto.createHash('md5').update('').digest('hex');
    }
    const sorted = JSON.stringify(attributeValue.sort((a, b) => (a.value || '').localeCompare(b.value || '')));
    return crypto.createHash('md5').update(sorted).digest('hex');
}

export const list = async (req: Request, res: Response) => {
    try {
        const find: {
            deleted: boolean,
            dealerId?: string,
            productId?: string,
            status?: string
        } = {
            deleted: false
        };

        if (req.query.dealerId) {
            find.dealerId = req.query.dealerId as string;
        }

        if (req.query.productId) {
            find.productId = req.query.productId as string;
        }

        if (req.query.status) {
            find.status = req.query.status as string;
        }

        const limitItems = 20;
        let page = 1;
        if (req.query.page) {
            const currentPage = parseInt(`${req.query.page}`);
            if (currentPage > 0) {
                page = currentPage;
            }
        }
        const totalRecords = await DealerAllocation.countDocuments(find);
        const totalPages = Math.ceil(totalRecords / limitItems);
        const skip = (page - 1) * limitItems;
        const pagination = {
            skip: skip,
            totalRecords: totalRecords,
            totalPages: totalPages
        };

        const allocationList: any = await DealerAllocation
            .find(find)
            .populate('dealerId', 'name code')
            .populate('productId', 'name version')
            .limit(limitItems)
            .skip(skip)
            .sort({
                createdAt: "desc"
            });

        // Lấy thông tin variant từ product
        for (const allocation of allocationList) {
            if (allocation.productId && allocation.variantIndex !== undefined) {
                const product = await Product.findById(allocation.productId);
                if (product && product.variants && product.variants[allocation.variantIndex]) {
                    allocation.variantInfo = product.variants[allocation.variantIndex];
                }
            }
            // Đếm số VIN của allocation này từ mảng embedded
            const vinCount = (allocation.vins || []).length;
            allocation.vinCount = vinCount;
        }

        // Lấy danh sách đại lý và sản phẩm cho filter
        const dealers = await Dealer.find({ deleted: false }).select('name code').sort({ name: 1 });
        const products = await Product.find({ deleted: false, status: "active" }).select('name version').sort({ name: 1 });

        res.render("admin/pages/dealer-allocation-list", {
            pageTitle: "Điều phối xe cho đại lý",
            allocationList: allocationList,
            pagination: pagination,
            dealers: dealers,
            products: products,
            query: req.query
        });
    } catch (error) {
        console.log(error);
        res.render("admin/pages/dealer-allocation-list", {
            pageTitle: "Điều phối xe cho đại lý",
            allocationList: [],
            pagination: { skip: 0, totalRecords: 0, totalPages: 0 },
            dealers: [],
            products: []
        });
    }
};

export const create = async (req: Request, res: Response) => {
    try {
        const dealers = await Dealer.find({ deleted: false, status: "active" }).select('name code').sort({ name: 1 });
        const products = await Product.find({ deleted: false, status: "active" }).select('name version').sort({ name: 1 });

        res.render('admin/pages/dealer-allocation-create', {
            pageTitle: "Tạo điều phối xe",
            dealers: dealers,
            products: products
        });
    } catch (error) {
        console.log(error);
        res.redirect(`/${pathAdmin}/dealer/allocation/list`);
    }
};

export const createPost = async (req: Request, res: Response) => {
    try {
        const dealerId = req.body.dealerId;
        const productId = req.body.productId;
        const variantIndex = parseInt(req.body.variantIndex);
        const quantity = parseInt(req.body.quantity) || 0;

        // Kiểm tra đại lý
        const dealer = await Dealer.findOne({
            _id: dealerId,
            deleted: false
        });

        if (!dealer) {
            res.json({
                code: "error",
                message: "Đại lý không tồn tại!"
            });
            return;
        }

        // Kiểm tra sản phẩm và variant
        const product = await Product.findOne({
            _id: productId,
            deleted: false
        });

        if (!product) {
            res.json({
                code: "error",
                message: "Sản phẩm không tồn tại!"
            });
            return;
        }

        if (!product.variants || !product.variants[variantIndex]) {
            res.json({
                code: "error",
                message: "Biến thể không tồn tại!"
            });
            return;
        }

        const variant = product.variants[variantIndex];
        const variantHash = createVariantHash(variant.attributeValue || []);

        // Kiểm tra tồn kho còn lại
        const currentStock = variant.stock || 0;
        const allocatedToOthers = await DealerAllocation.aggregate([
            {
                $match: {
                    productId: new mongoose.Types.ObjectId(productId),
                    variantHash: variantHash,
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

        const totalAllocated = allocatedToOthers.length > 0 ? allocatedToOthers[0].total : 0;
        const availableStock = currentStock - totalAllocated;

        if (quantity > availableStock) {
            res.json({
                code: "error",
                message: `Không đủ tồn kho! Tồn kho hiện có: ${currentStock.toLocaleString('vi-VN')} chiếc, đã phân bổ: ${totalAllocated.toLocaleString('vi-VN')} chiếc, còn lại: ${availableStock.toLocaleString('vi-VN')} chiếc`
            });
            return;
        }

        const newAllocation = new DealerAllocation({
            dealerId: dealerId,
            productId: productId,
            variantIndex: variantIndex,
            variantHash: variantHash,
            quantity: quantity,
            allocatedQuantity: 0,
            status: "pending",
            notes: req.body.notes || '',
            createdBy: (req as any).user?.id || ''
        });

        await newAllocation.save();

        // Trừ tồn kho ngay khi tạo điều phối (status = "pending") để các điều phối sau không bị ảnh hưởng
        const newStock = Math.max(0, currentStock - quantity);
        await Product.updateOne(
            { _id: productId },
            { 
                $set: { 
                    [`variants.${variantIndex}.stock`]: newStock 
                } 
            }
        );

        res.json({
            code: "success",
            message: `Tạo điều phối thành công! Đã trừ ${quantity.toLocaleString('vi-VN')} chiếc khỏi tồn kho.`
        });
    } catch (error) {
        console.log(error);
        res.json({
            code: "error",
            message: "Dữ liệu không hợp lệ!"
        });
    }
};

export const edit = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        const allocation = await DealerAllocation.findOne({
            _id: id,
            deleted: false
        })
        .populate('dealerId', 'name code')
        .populate('productId', 'name version variants');

        if (!allocation) {
            res.redirect(`/${pathAdmin}/dealer/allocation/list`);
            return;
        }

        // Lấy thông tin variant
        const product = allocation.productId as any;
        let variantInfo = null;
        if (product && product.variants && product.variants[allocation.variantIndex]) {
            variantInfo = product.variants[allocation.variantIndex];
        }

        const dealers = await Dealer.find({ deleted: false, status: "active" }).select('name code').sort({ name: 1 });
        const products = await Product.find({ deleted: false, status: "active" }).select('name version').sort({ name: 1 });

        res.render('admin/pages/dealer-allocation-edit', {
            pageTitle: "Chỉnh sửa điều phối xe",
            allocation: allocation,
            variantInfo: variantInfo,
            dealers: dealers,
            products: products
        });
    } catch (error) {
        console.log(error);
        res.redirect(`/${pathAdmin}/dealer/allocation/list`);
    }
};

export const editPatch = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        const allocation = await DealerAllocation.findOne({
            _id: id,
            deleted: false
        });

        if (!allocation) {
            res.json({
                code: "error",
                message: "Điều phối không tồn tại!"
            });
            return;
        }

        const quantity = parseInt(req.body.quantity) || 0;
        const status = req.body.status;

        // Nếu đang cập nhật số lượng, kiểm tra tồn kho
        if (quantity !== allocation.quantity && status !== "cancelled") {
            const product = await Product.findById(allocation.productId);
            if (product && product.variants && product.variants[allocation.variantIndex]) {
                const variant = product.variants[allocation.variantIndex];
                const currentStock = variant.stock || 0;
                
                const allocatedToOthers = await DealerAllocation.aggregate([
                    {
                        $match: {
                            productId: allocation.productId,
                            variantHash: allocation.variantHash,
                            _id: { $ne: allocation._id },
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

                const totalAllocated = allocatedToOthers.length > 0 ? allocatedToOthers[0].total : 0;
                const availableStock = currentStock - totalAllocated + allocation.quantity; // Cộng lại số lượng hiện tại của allocation này

                if (quantity > availableStock) {
                    res.json({
                        code: "error",
                        message: `Không đủ tồn kho! Tồn kho hiện có: ${currentStock.toLocaleString('vi-VN')} chiếc, đã phân bổ khác: ${totalAllocated.toLocaleString('vi-VN')} chiếc, còn lại: ${availableStock.toLocaleString('vi-VN')} chiếc`
                    });
                    return;
                }
            }
        }

        // Xử lý tồn kho theo luồng trạng thái
        const product = await Product.findById(allocation.productId);
        if (product && product.variants && product.variants[allocation.variantIndex]) {
            const variant = product.variants[allocation.variantIndex];
            const currentStock = variant.stock || 0;
            const oldStatus = allocation.status;
            const oldQuantity = allocation.quantity;
            const quantityDiff = quantity - oldQuantity;
            const statusChanged = oldStatus !== status;

            // Xử lý theo các trường hợp thay đổi trạng thái và số lượng
            if (statusChanged) {
                // Chuyển từ "pending" sang "allocated": Không cần trừ tồn kho (đã trừ khi tạo allocation)
                // Chuyển từ "allocated" hoặc "shipped" sang "cancelled": Hoàn tồn kho EVM Stock
                if ((oldStatus === "allocated" || oldStatus === "shipped") && status === "cancelled") {
                    const newStock = currentStock + oldQuantity; // Hoàn theo số lượng cũ
                    await Product.updateOne(
                        { _id: allocation.productId },
                        { 
                            $set: { 
                                [`variants.${allocation.variantIndex}.stock`]: newStock 
                            } 
                        }
                    );
                }
                // Chuyển từ "pending" sang "cancelled": Hoàn tồn kho EVM Stock (đã trừ khi tạo)
                else if (oldStatus === "pending" && status === "cancelled") {
                    const newStock = currentStock + oldQuantity; // Hoàn theo số lượng cũ
                    await Product.updateOne(
                        { _id: allocation.productId },
                        { 
                            $set: { 
                                [`variants.${allocation.variantIndex}.stock`]: newStock 
                            } 
                        }
                    );
                }
                // Chuyển từ "cancelled" sang "allocated" hoặc "pending": Trừ lại tồn kho EVM Stock
                else if (oldStatus === "cancelled" && (status === "allocated" || status === "pending")) {
                    const newStock = Math.max(0, currentStock - quantity);
                    await Product.updateOne(
                        { _id: allocation.productId },
                        { 
                            $set: { 
                                [`variants.${allocation.variantIndex}.stock`]: newStock 
                            } 
                        }
                    );
                }
                // Chuyển từ "allocated" sang "shipped": Không thay đổi tồn kho (đã trừ khi tạo allocation)
                // Chuyển từ "shipped" sang "delivered": Tăng tồn kho đại lý (xử lý ở phần dưới)
            }
            // Nếu chỉ thay đổi số lượng và đang ở trạng thái đã trừ kho (pending/allocated/shipped)
            else if (!statusChanged && quantityDiff !== 0 && 
                     (oldStatus === "pending" || oldStatus === "allocated" || oldStatus === "shipped")) {
                // Điều chỉnh tồn kho theo chênh lệch số lượng
                const newStock = Math.max(0, currentStock - quantityDiff);
                await Product.updateOne(
                    { _id: allocation.productId },
                    { 
                        $set: { 
                            [`variants.${allocation.variantIndex}.stock`]: newStock 
                        } 
                    }
                );
            }
        }

        // ============================================
        // TỰ ĐỘNG CẬP NHẬT TIMESTAMP KHI STATUS THAY ĐỔI
        // Best Practice: Audit Trail cho VIN Allocation
        // ============================================
        // pending → allocated: Cập nhật allocatedAt (Ngày phân bổ)
        // Thời điểm EVM cam kết VIN cho Đại lý
        if (status === "allocated" && allocation.status !== "allocated") {
            allocation.allocatedAt = new Date();
        }
        // allocated → shipped: Cập nhật shippedAt (Ngày giao hàng)
        // Thời điểm xe rời kho Hãng (EVM) đi giao
        if (status === "shipped" && allocation.status !== "shipped") {
            allocation.shippedAt = new Date();
        }
        // shipped → delivered: Cập nhật deliveredAt (Ngày giao đến đại lý)
        // Thời điểm Đại lý xác nhận đã nhận xe
        if (status === "delivered" && allocation.status !== "delivered") {
            allocation.deliveredAt = new Date();
            allocation.allocatedQuantity = quantity; // Cập nhật số lượng đã nhận
            
            // Tăng tồn kho Đại lý khi đã nhận hàng
            const inventory = await DealerInventory.findOne({
                dealerId: allocation.dealerId,
                productId: allocation.productId,
                variantIndex: allocation.variantIndex,
                deleted: false
            });

            if (inventory) {
                // Cập nhật tồn kho nếu đã có record
                inventory.stock = (inventory.stock || 0) + quantity;
                inventory.lastUpdatedAt = new Date();
                await inventory.save();
            } else {
                // Tạo mới record tồn kho
                const newInventory = new DealerInventory({
                    dealerId: allocation.dealerId,
                    productId: allocation.productId,
                    variantIndex: allocation.variantIndex,
                    variantHash: allocation.variantHash,
                    stock: quantity,
                    reservedStock: 0,
                    lastUpdatedAt: new Date()
                });
                await newInventory.save();
            }
        } else if (allocation.status === "delivered" && status !== "delivered") {
            // Nếu đang ở trạng thái delivered và chuyển sang trạng thái khác, giảm tồn kho đại lý
            const inventory = await DealerInventory.findOne({
                dealerId: allocation.dealerId,
                productId: allocation.productId,
                variantIndex: allocation.variantIndex,
                deleted: false
            });

            if (inventory) {
                const oldQuantity = allocation.allocatedQuantity || allocation.quantity;
                inventory.stock = Math.max(0, (inventory.stock || 0) - oldQuantity);
                inventory.lastUpdatedAt = new Date();
                await inventory.save();
            }
        }

        allocation.quantity = quantity;
        allocation.status = status;
        allocation.notes = req.body.notes || '';
        allocation.updatedBy = (req as any).user?.id || '';

        await allocation.save();

        res.json({
            code: "success",
            message: "Cập nhật điều phối thành công!"
        });
    } catch (error) {
        console.log(error);
        res.json({
            code: "error",
            message: "Dữ liệu không hợp lệ!"
        });
    }
};

export const deletePatch = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        const allocation = await DealerAllocation.findOne({
            _id: id,
            deleted: false
        });

        if (!allocation) {
            res.json({
                code: "error",
                message: "Điều phối không tồn tại!"
            });
            return;
        }

        // Đổi trạng thái sang "cancelled" thay vì xóa
        const oldStatus = allocation.status;
        allocation.status = "cancelled";
        allocation.updatedBy = (req as any).user?.id || '';

        // Khôi phục lại số lượng sản phẩm tương ứng
        // Stock đã được trừ khi tạo allocation (kể cả status = pending), nên khi hủy cần khôi phục lại
        // Chỉ bỏ qua nếu đã ở trạng thái cancelled rồi
        if (oldStatus !== "cancelled") {
            const product = await Product.findById(allocation.productId);
            if (product && product.variants && product.variants[allocation.variantIndex]) {
                const variant = product.variants[allocation.variantIndex];
                const currentStock = variant.stock || 0;
                const quantityToRestore = allocation.quantity;
                const newStock = currentStock + quantityToRestore;
                
                await Product.updateOne(
                    { _id: allocation.productId },
                    { 
                        $set: { 
                            [`variants.${allocation.variantIndex}.stock`]: newStock 
                        } 
                    }
                );
            }
        }

        // Nếu allocation đã ở trạng thái "delivered", giảm tồn kho đại lý
        if (oldStatus === "delivered") {
            const inventory = await DealerInventory.findOne({
                dealerId: allocation.dealerId,
                productId: allocation.productId,
                variantIndex: allocation.variantIndex,
                deleted: false
            });

            if (inventory) {
                const oldQuantity = allocation.allocatedQuantity || allocation.quantity;
                inventory.stock = Math.max(0, (inventory.stock || 0) - oldQuantity);
                inventory.lastUpdatedAt = new Date();
                await inventory.save();
            }
        }

        await allocation.save();

        res.json({
            code: "success",
            message: "Hủy điều phối thành công! Đã khôi phục lại số lượng sản phẩm."
        });
    } catch (error) {
        console.log(error);
        res.json({
            code: "error",
            message: "Id không hợp lệ!"
        });
    }
};

// Lấy danh sách variants của một product
export const getProductVariants = async (req: Request, res: Response) => {
    try {
        const productId = req.params.productId;

        const product = await Product.findOne({
            _id: productId,
            deleted: false
        });

        if (!product) {
            res.json({
                code: "error",
                message: "Sản phẩm không tồn tại!"
            });
            return;
        }

        const variants = product.variants || [];
        const variantsWithStock = variants.map((variant: any, index: number) => ({
            index: index,
            attributeValue: variant.attributeValue || [],
            stock: variant.stock || 0,
            priceOld: variant.priceOld || 0,
            priceNew: variant.priceNew || 0,
            status: variant.status || false
        }));

        res.json({
            code: "success",
            variants: variantsWithStock
        });
    } catch (error) {
        console.log(error);
        res.json({
            code: "error",
            message: "Lỗi khi lấy danh sách biến thể!"
        });
    }
};

