import { Request, Response } from 'express';
import { pathAdmin } from '../../configs/variable.config';
import DealerDiscount from '../../models/dealer-discount.model';
import Dealer from '../../models/dealer.model';
import Product from '../../models/product.model';
import mongoose from 'mongoose';

export const list = async (req: Request, res: Response) => {
    try {
        const dealerId = req.params.dealerId;

        const dealer = await Dealer.findOne({
            _id: dealerId,
            deleted: false
        });

        if (!dealer) {
            res.redirect(`/${pathAdmin}/dealer/list`);
            return;
        }

        const find: any = {
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        };

        // Phân trang
        const limitItems = 20;
        let page = 1;
        if (req.query.page) {
            const currentPage = parseInt(`${req.query.page}`);
            if (currentPage > 0) {
                page = currentPage;
            }
        }
        const totalRecords = await DealerDiscount.countDocuments(find);
        const totalPages = Math.ceil(totalRecords / limitItems);
        const skip = (page - 1) * limitItems;
        const pagination = {
            skip: skip,
            totalRecords: totalRecords,
            totalPages: totalPages
        };

        const discountList: any = await DealerDiscount.find(find)
            .populate('productIds', 'name version')
            .limit(limitItems)
            .skip(skip)
            .sort({ createdAt: "desc" });

        res.render("admin/pages/dealer-discount-list", {
            pageTitle: `Quản lý chiết khấu - ${dealer.name}`,
            dealer: dealer,
            discountList: discountList,
            pagination: pagination
        });
    } catch (error) {
        console.log(error);
        res.redirect(`/${pathAdmin}/dealer/list`);
    }
};

export const create = async (req: Request, res: Response) => {
    try {
        const dealerId = req.params.dealerId;

        const dealer = await Dealer.findOne({
            _id: dealerId,
            deleted: false
        });

        if (!dealer) {
            res.redirect(`/${pathAdmin}/dealer/list`);
            return;
        }

        const products = await Product.find({ deleted: false, status: "active" })
            .select('name version category')
            .sort({ name: 1 });

        res.render('admin/pages/dealer-discount-create', {
            pageTitle: "Thêm chính sách chiết khấu",
            dealer: dealer,
            products: products
        });
    } catch (error) {
        console.log(error);
        res.redirect(`/${pathAdmin}/dealer/list`);
    }
};

export const createPost = async (req: Request, res: Response) => {
    try {
        const dealerId = req.params.dealerId;

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

        const discountType = req.body.discountType;
        const discountValue = parseFloat(req.body.discountValue) || 0;
        const applyTo = req.body.applyTo;
        const productIds = req.body.productIds ? (Array.isArray(req.body.productIds) ? req.body.productIds : [req.body.productIds]) : [];
        const categoryIds = req.body.categoryIds ? (Array.isArray(req.body.categoryIds) ? req.body.categoryIds : [req.body.categoryIds]) : [];
        const minQuantity = parseInt(req.body.minQuantity) || 1;
        const minAmount = parseFloat(req.body.minAmount) || 0;
        const effectiveDate = req.body.effectiveDate ? new Date(req.body.effectiveDate) : new Date();
        const expiryDate = req.body.expiryDate ? new Date(req.body.expiryDate) : null;

        if (discountType === "percentage" && discountValue > 100) {
            res.json({
                code: "error",
                message: "Chiết khấu phần trăm không được vượt quá 100%!"
            });
            return;
        }

        const newDiscount = new DealerDiscount({
            dealerId: dealerId,
            discountName: req.body.discountName || '',
            discountType: discountType,
            discountValue: discountValue,
            applyTo: applyTo,
            productIds: productIds.map((id: string) => new mongoose.Types.ObjectId(id)),
            categoryIds: categoryIds,
            minQuantity: minQuantity,
            minAmount: minAmount,
            effectiveDate: effectiveDate,
            expiryDate: expiryDate,
            status: req.body.status || "active",
            notes: req.body.notes || '',
            createdBy: (req as any).user?.id || ''
        });

        await newDiscount.save();

        res.json({
            code: "success",
            message: "Thêm chính sách chiết khấu thành công!"
        });
    } catch (error: any) {
        console.log(error);
        res.json({
            code: "error",
            message: "Dữ liệu không hợp lệ!"
        });
    }
};

export const edit = async (req: Request, res: Response) => {
    try {
        const dealerId = req.params.dealerId;
        const discountId = req.params.id;

        const dealer = await Dealer.findOne({
            _id: dealerId,
            deleted: false
        });

        if (!dealer) {
            res.redirect(`/${pathAdmin}/dealer/list`);
            return;
        }

        const discount = await DealerDiscount.findOne({
            _id: discountId,
            dealerId: dealerId,
            deleted: false
        })
        .populate('productIds', 'name version');

        if (!discount) {
            res.redirect(`/${pathAdmin}/dealer/${dealerId}/discount/list`);
            return;
        }

        const products = await Product.find({ deleted: false, status: "active" })
            .select('name version category')
            .sort({ name: 1 });

        res.render('admin/pages/dealer-discount-edit', {
            pageTitle: "Chỉnh sửa chính sách chiết khấu",
            dealer: dealer,
            discount: discount,
            products: products
        });
    } catch (error) {
        console.log(error);
        res.redirect(`/${pathAdmin}/dealer/list`);
    }
};

export const editPatch = async (req: Request, res: Response) => {
    try {
        const dealerId = req.params.dealerId;
        const discountId = req.params.id;

        const discount = await DealerDiscount.findOne({
            _id: discountId,
            dealerId: dealerId,
            deleted: false
        });

        if (!discount) {
            res.json({
                code: "error",
                message: "Chính sách chiết khấu không tồn tại!"
            });
            return;
        }

        const discountType = req.body.discountType;
        const discountValue = parseFloat(req.body.discountValue) || 0;
        const applyTo = req.body.applyTo;
        const productIds = req.body.productIds ? (Array.isArray(req.body.productIds) ? req.body.productIds : [req.body.productIds]) : [];
        const categoryIds = req.body.categoryIds ? (Array.isArray(req.body.categoryIds) ? req.body.categoryIds : [req.body.categoryIds]) : [];
        const minQuantity = parseInt(req.body.minQuantity) || 1;
        const minAmount = parseFloat(req.body.minAmount) || 0;
        const effectiveDate = req.body.effectiveDate ? new Date(req.body.effectiveDate) : new Date();
        const expiryDate = req.body.expiryDate ? new Date(req.body.expiryDate) : null;

        if (discountType === "percentage" && discountValue > 100) {
            res.json({
                code: "error",
                message: "Chiết khấu phần trăm không được vượt quá 100%!"
            });
            return;
        }

        discount.discountName = req.body.discountName || '';
        discount.discountType = discountType;
        discount.discountValue = discountValue;
        discount.applyTo = applyTo;
        discount.productIds = productIds.map((id: string) => new mongoose.Types.ObjectId(id));
        discount.categoryIds = categoryIds;
        discount.minQuantity = minQuantity;
        discount.minAmount = minAmount;
        discount.effectiveDate = effectiveDate;
        if (expiryDate) {
            discount.expiryDate = expiryDate;
        } else {
            (discount as any).expiryDate = null;
        }
        discount.status = req.body.status || "active";
        discount.notes = req.body.notes || '';
        discount.updatedBy = (req as any).user?.id || '';
        await discount.save();

        res.json({
            code: "success",
            message: "Cập nhật chính sách chiết khấu thành công!"
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
        const dealerId = req.params.dealerId;
        const discountId = req.params.id;

        await DealerDiscount.updateOne({
            _id: discountId,
            dealerId: dealerId
        }, {
            deleted: true,
            deletedAt: Date.now()
        });

        res.json({
            code: "success",
            message: "Xóa chính sách chiết khấu thành công!"
        });
    } catch (error) {
        console.log(error);
        res.json({
            code: "error",
            message: "Id không hợp lệ!"
        });
    }
};

