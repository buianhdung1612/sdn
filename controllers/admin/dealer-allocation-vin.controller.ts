import { Request, Response } from 'express';
import { pathAdmin } from '../../configs/variable.config';
import DealerAllocation from '../../models/dealer-allocation.model';
import Product from '../../models/product.model';
import mongoose from 'mongoose';

export const list = async (req: Request, res: Response) => {
    try {
        const allocationId = req.params.allocationId;

        const allocation = await DealerAllocation.findOne({
            _id: allocationId,
            deleted: false
        })
            .populate('dealerId', 'name code')
            .populate('productId', 'name version');

        if (!allocation) {
            res.redirect(`/${pathAdmin}/dealer/allocation/list`);
            return;
        }

        // Lấy danh sách VIN từ mảng embedded - chỉ hiển thị số khung
        const vinList = (allocation.vins || []).map((vin: any, index: number) => ({
            _id: index, // Dùng index làm ID tạm thời
            vin: vin.vin
        }));

        res.render("admin/pages/dealer-allocation-vin-list", {
            pageTitle: `Quản lý VIN - ${allocation.dealerId && (allocation.dealerId as any).name ? (allocation.dealerId as any).name : ''}`,
            allocation: allocation,
            vinList: vinList
        });
    } catch (error) {
        console.log(error);
        res.redirect(`/${pathAdmin}/dealer/allocation/list`);
    }
};

export const create = async (req: Request, res: Response) => {
    try {
        const allocationId = req.params.allocationId;

        const allocation = await DealerAllocation.findOne({
            _id: allocationId,
            deleted: false
        })
            .populate('dealerId', 'name code')
            .populate('productId', 'name version');

        if (!allocation) {
            res.redirect(`/${pathAdmin}/dealer/allocation/list`);
            return;
        }

        // Đếm số VIN hiện có từ mảng embedded
        const currentVinCount = (allocation.vins || []).length;

        // Nếu đã có đủ VIN, redirect về list
        if (currentVinCount >= allocation.quantity) {
            res.redirect(`/${pathAdmin}/dealer/allocation/${allocationId}/vins/list`);
            return;
        }

        res.render('admin/pages/dealer-allocation-vin-create', {
            pageTitle: "Thêm VIN",
            allocation: allocation,
            currentVinCount: currentVinCount,
            maxVins: allocation.quantity,
            requiredVins: allocation.quantity // Số lượng VIN cần nhập
        });
    } catch (error) {
        console.log(error);
        res.redirect(`/${pathAdmin}/dealer/allocation/list`);
    }
};

export const createPost = async (req: Request, res: Response) => {
    try {
        const allocationId = req.params.allocationId;

        const allocation = await DealerAllocation.findOne({
            _id: allocationId,
            deleted: false
        });

        if (!allocation) {
            res.json({
                code: "error",
                message: "Điều phối không tồn tại!"
            });
            return;
        }

        // Xử lý VIN: chia chuỗi theo dòng và loại bỏ khoảng trắng
        let vins: string[] = [];
        if (req.body.vins) {
            vins = req.body.vins
                .split('\n')
                .map((vin: string) => vin.trim().toUpperCase())
                .filter((vin: string) => vin.length > 0);
        }

        if (vins.length === 0) {
            res.json({
                code: "error",
                message: "Vui lòng nhập ít nhất một VIN!"
            });
            return;
        }

        // Kiểm tra số lượng VIN - CHỈ CHO PHÉP NHẬP ĐÚNG SỐ LƯỢNG
        const currentVinCount = (allocation.vins || []).length;
        const requiredVins = allocation.quantity;

        // Nếu đã có VIN, không cho phép thêm tiếp
        if (currentVinCount > 0) {
            res.json({
                code: "error",
                message: "Điều phối này đã có VIN. Vui lòng chỉnh sửa VIN hiện có thay vì thêm mới!"
            });
            return;
        }

        // Phải nhập đúng số lượng VIN
        if (vins.length !== requiredVins) {
            res.json({
                code: "error",
                message: `Vui lòng nhập đúng ${requiredVins} VIN! Bạn đã nhập ${vins.length} VIN.`
            });
            return;
        }

        // Kiểm tra VIN trùng lặp trong danh sách nhập vào
        const uniqueVins = [...new Set(vins)];
        if (uniqueVins.length !== vins.length) {
            res.json({
                code: "error",
                message: "Danh sách VIN có trùng lặp!"
            });
            return;
        }

        // Kiểm tra VIN đã tồn tại trong database (tất cả các allocation)
        const existingAllocations = await DealerAllocation.find({
            deleted: false,
            vins: { $elemMatch: { vin: { $in: vins } } }
        });

        const existingVins: string[] = [];
        existingAllocations.forEach((alloc: any) => {
            (alloc.vins || []).forEach((vin: any) => {
                if (vins.includes(vin.vin)) {
                    existingVins.push(vin.vin);
                }
            });
        });

        if (existingVins.length > 0) {
            const existingVinList = existingVins.join(', ');
            res.json({
                code: "error",
                message: `Các VIN sau đã tồn tại trong hệ thống: ${existingVinList}`
            });
            return;
        }

        // Kiểm tra tồn kho trước khi trừ
        const product = await Product.findById(allocation.productId);
        if (!product || !product.variants || !product.variants[allocation.variantIndex]) {
            res.json({
                code: "error",
                message: "Sản phẩm hoặc biến thể không tồn tại!"
            });
            return;
        }

        const variant = product.variants[allocation.variantIndex];
        const currentStock = variant.stock || 0;

        // Tự động chuyển trạng thái khi thêm đủ VIN
        const wasPending = allocation.status === "pending";

        // Thêm VINs vào mảng embedded - dùng push() thay vì gán lại
        vins.forEach((vin: string) => {
            allocation.vins.push({
                vin: vin,
                createdAt: new Date(),
                createdBy: (req as any).user?.id || ''
            });
        });
        allocation.markModified('vins'); // Đánh dấu mảng đã thay đổi

        // Cập nhật DealerAllocation: status và allocatedQuantity
        // Khi thêm đủ số lượng VIN và đang ở trạng thái pending, chuyển sang allocated
        if (wasPending) {
            allocation.status = "allocated";
            allocation.allocatedAt = new Date();
        }

        allocation.allocatedQuantity = requiredVins;
        allocation.updatedBy = (req as any).user?.id || '';
        await allocation.save();

        res.json({
            code: "success",
            message: `Thêm ${vins.length} VIN thành công! Đã cập nhật trạng thái sang "Đã phân bổ".`
        });
    } catch (error: any) {
        console.log(error);
        if (error.code === 11000) {
            res.json({
                code: "error",
                message: "VIN đã tồn tại trong hệ thống!"
            });
        } else {
            res.json({
                code: "error",
                message: "Dữ liệu không hợp lệ!"
            });
        }
    }
};

export const edit = async (req: Request, res: Response) => {
    try {
        const allocationId = req.params.allocationId;
        const vinIndex = parseInt(req.params.id);

        const allocation = await DealerAllocation.findOne({
            _id: allocationId,
            deleted: false
        })
            .populate('dealerId', 'name code')
            .populate('productId', 'name version');

        if (!allocation) {
            res.redirect(`/${pathAdmin}/dealer/allocation/list`);
            return;
        }

        // Kiểm tra nếu allocation đã cancelled thì không cho phép chỉnh sửa
        if (allocation.status === "cancelled") {
            res.json({
                code: "error",
                message: "Không thể chỉnh sửa VIN khi điều phối đã hủy!"
            });
            return;
        }

        const vins = allocation.vins || [];
        if (!vins[vinIndex]) {
            res.redirect(`/${pathAdmin}/dealer/allocation/${allocationId}/vins/list`);
            return;
        }

        const vinDetail = {
            _id: vinIndex,
            vin: vins[vinIndex].vin || '', // Đảm bảo có field vin
            notes: vins[vinIndex].notes || '',
            createdAt: vins[vinIndex].createdAt,
            createdBy: vins[vinIndex].createdBy,
            allocationStatus: allocation.status // Thêm trạng thái allocation để hiển thị
        };

        res.render('admin/pages/dealer-allocation-vin-edit', {
            pageTitle: "Chỉnh sửa VIN",
            allocation: allocation,
            vinDetail: vinDetail
        });
    } catch (error) {
        console.log(error);
        res.redirect(`/${pathAdmin}/dealer/allocation/list`);
    }
};

export const editPatch = async (req: Request, res: Response) => {
    try {
        const allocationId = req.params.allocationId;
        const vinIndex = parseInt(req.params.id);

        const allocation = await DealerAllocation.findOne({
            _id: allocationId,
            deleted: false
        });

        if (!allocation) {
            res.json({
                code: "error",
                message: "Điều phối không tồn tại!"
            });
            return;
        }

        // Kiểm tra nếu allocation đã cancelled thì không cho phép chỉnh sửa
        if (allocation.status === "cancelled") {
            res.json({
                code: "error",
                message: "Không thể chỉnh sửa VIN khi điều phối đã hủy!"
            });
            return;
        }

        const vins = allocation.vins || [];
        if (!vins[vinIndex]) {
            res.json({
                code: "error",
                message: "VIN không tồn tại!"
            });
            return;
        }

        const newVin = (req.body.vin || '').trim().toUpperCase();

        if (!newVin || newVin.length === 0) {
            res.json({
                code: "error",
                message: "Vui lòng nhập mã VIN!"
            });
            return;
        }

        // Kiểm tra VIN trùng lặp trong các allocation khác (trừ chính VIN này)
        const existingAllocations = await DealerAllocation.find({
            _id: { $ne: allocationId },
            deleted: false,
            vins: { $elemMatch: { vin: newVin } }
        });

        if (existingAllocations.length > 0) {
            res.json({
                code: "error",
                message: `VIN "${newVin}" đã tồn tại trong hệ thống!`
            });
            return;
        }

        // Kiểm tra VIN trùng lặp trong cùng allocation (trừ chính VIN này)
        const duplicateVin = vins.find((vin: any, index: number) =>
            index !== vinIndex && vin.vin === newVin
        );

        if (duplicateVin) {
            res.json({
                code: "error",
                message: `VIN "${newVin}" đã tồn tại trong điều phối này!`
            });
            return;
        }

        // Cập nhật VIN
        vins[vinIndex].vin = newVin;
        allocation.markModified('vins'); // Đánh dấu mảng đã thay đổi
        allocation.updatedBy = (req as any).user?.id || '';
        await allocation.save();

        res.json({
            code: "success",
            message: "Cập nhật VIN thành công!"
        });
    } catch (error: any) {
        console.log(error);
        if (error.code === 11000) {
            res.json({
                code: "error",
                message: "VIN đã tồn tại trong hệ thống!"
            });
        } else {
            res.json({
                code: "error",
                message: "Dữ liệu không hợp lệ!"
            });
        }
    }
};

// Xóa các hàm xóa VIN - không cho phép xóa VIN
// export const deletePatch và deleteMultiplePatch đã được xóa

