import { Request, Response } from 'express';
import { pathAdmin } from '../../configs/variable.config';
import DealerPricing from '../../models/dealer-pricing.model';
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
        const totalRecords = await DealerPricing.countDocuments(find);
        const totalPages = Math.ceil(totalRecords / limitItems);
        const skip = (page - 1) * limitItems;
        const pagination = {
            skip: skip,
            totalRecords: totalRecords,
            totalPages: totalPages
        };

        const pricingList: any = await DealerPricing.find(find)
            .populate('productId', 'name version basePrice')
            .limit(limitItems)
            .skip(skip)
            .sort({ createdAt: "desc" });

        res.render("admin/pages/dealer-pricing-list", {
            pageTitle: `Quản lý giá sỉ - ${dealer.name}`,
            dealer: dealer,
            pricingList: pricingList,
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
            .select('name version basePrice variants')
            .sort({ name: 1 });

        res.render('admin/pages/dealer-pricing-create', {
            pageTitle: "Thêm giá sỉ",
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
        const productId = req.body.productId;
        const variantIndex = req.body.variantIndex !== '' ? parseInt(req.body.variantIndex) : null;
        const wholesalePrice = parseFloat(req.body.wholesalePrice) || 0;
        const effectiveDate = req.body.effectiveDate ? new Date(req.body.effectiveDate) : new Date();
        const expiryDate = req.body.expiryDate ? new Date(req.body.expiryDate) : null;

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

        if (variantIndex !== null && (!product.variants || !product.variants[variantIndex])) {
            res.json({
                code: "error",
                message: "Biến thể không tồn tại!"
            });
            return;
        }

        // Kiểm tra giá sỉ đã tồn tại
        const existingPricing = await DealerPricing.findOne({
            dealerId: dealerId,
            productId: productId,
            variantIndex: variantIndex,
            deleted: false,
            status: "active"
        });

        if (existingPricing) {
            res.json({
                code: "error",
                message: "Giá sỉ cho sản phẩm này đã tồn tại!"
            });
            return;
        }

        const newPricing = new DealerPricing({
            dealerId: dealerId,
            productId: productId,
            variantIndex: variantIndex,
            wholesalePrice: wholesalePrice,
            effectiveDate: effectiveDate,
            expiryDate: expiryDate,
            status: req.body.status || "active",
            notes: req.body.notes || '',
            createdBy: (req as any).user?.id || ''
        });

        await newPricing.save();

        res.json({
            code: "success",
            message: "Thêm giá sỉ thành công!"
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
        const pricingId = req.params.id;

        const dealer = await Dealer.findOne({
            _id: dealerId,
            deleted: false
        });

        if (!dealer) {
            res.redirect(`/${pathAdmin}/dealer/list`);
            return;
        }

        const pricing = await DealerPricing.findOne({
            _id: pricingId,
            dealerId: dealerId,
            deleted: false
        })
        .populate('productId', 'name version basePrice variants');

        if (!pricing) {
            res.redirect(`/${pathAdmin}/dealer/${dealerId}/pricing/list`);
            return;
        }

        const products = await Product.find({ deleted: false, status: "active" })
            .select('name version basePrice variants')
            .sort({ name: 1 });

        res.render('admin/pages/dealer-pricing-edit', {
            pageTitle: "Chỉnh sửa giá sỉ",
            dealer: dealer,
            pricing: pricing,
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
        const pricingId = req.params.id;

        const pricing = await DealerPricing.findOne({
            _id: pricingId,
            dealerId: dealerId,
            deleted: false
        });

        if (!pricing) {
            res.json({
                code: "error",
                message: "Giá sỉ không tồn tại!"
            });
            return;
        }

        const wholesalePrice = parseFloat(req.body.wholesalePrice) || 0;
        const effectiveDate = req.body.effectiveDate ? new Date(req.body.effectiveDate) : new Date();
        const expiryDate = req.body.expiryDate ? new Date(req.body.expiryDate) : null;

        // Kiểm tra giá sỉ trùng lặp (trừ chính record này)
        if (req.body.productId && req.body.variantIndex !== undefined) {
            const variantIndex = req.body.variantIndex !== '' ? parseInt(req.body.variantIndex) : null;
            const existingPricing = await DealerPricing.findOne({
                _id: { $ne: pricingId },
                dealerId: dealerId,
                productId: req.body.productId,
                variantIndex: variantIndex,
                deleted: false,
                status: "active"
            });

            if (existingPricing) {
                res.json({
                    code: "error",
                    message: "Giá sỉ cho sản phẩm này đã tồn tại!"
                });
                return;
            }

            pricing.productId = new mongoose.Types.ObjectId(req.body.productId);
            if (variantIndex !== null) {
                pricing.variantIndex = variantIndex;
            } else {
                (pricing as any).variantIndex = null;
            }
        }

        pricing.wholesalePrice = wholesalePrice;
        pricing.effectiveDate = effectiveDate;
        if (expiryDate) {
            pricing.expiryDate = expiryDate;
        } else {
            (pricing as any).expiryDate = null;
        }
        pricing.status = req.body.status || "active";
        pricing.notes = req.body.notes || '';
        pricing.updatedBy = (req as any).user?.id || '';
        await pricing.save();

        res.json({
            code: "success",
            message: "Cập nhật giá sỉ thành công!"
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
        const pricingId = req.params.id;

        await DealerPricing.updateOne({
            _id: pricingId,
            dealerId: dealerId
        }, {
            deleted: true,
            deletedAt: Date.now()
        });

        res.json({
            code: "success",
            message: "Xóa giá sỉ thành công!"
        });
    } catch (error) {
        console.log(error);
        res.json({
            code: "error",
            message: "Id không hợp lệ!"
        });
    }
};

