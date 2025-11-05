import { Request, Response } from 'express';
import { pathAdmin } from '../../configs/variable.config';
import DealerPromotion from '../../models/dealer-promotion.model';
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
        const totalRecords = await DealerPromotion.countDocuments(find);
        const totalPages = Math.ceil(totalRecords / limitItems);
        const skip = (page - 1) * limitItems;
        const pagination = {
            skip: skip,
            totalRecords: totalRecords,
            totalPages: totalPages
        };

        const promotionList: any = await DealerPromotion.find(find)
            .populate('productIds', 'name version')
            .populate('promotionConfig.giftProductId', 'name version')
            .limit(limitItems)
            .skip(skip)
            .sort({ createdAt: "desc" });

        // Cập nhật status expired nếu cần
        const now = new Date();
        for (const promotion of promotionList) {
            if (promotion.status === "active" && promotion.endDate < now) {
                promotion.status = "expired";
                await DealerPromotion.updateOne({ _id: promotion._id }, { status: "expired" });
            }
        }

        res.render("admin/pages/dealer-promotion-list", {
            pageTitle: `Quản lý khuyến mãi - ${dealer.name}`,
            dealer: dealer,
            promotionList: promotionList,
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
            .select('name version')
            .sort({ name: 1 });

        res.render('admin/pages/dealer-promotion-create', {
            pageTitle: "Thêm chương trình khuyến mãi",
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

        const promotionType = req.body.promotionType;
        const promotionValue = parseFloat(req.body.promotionValue) || 0;
        const applyTo = req.body.applyTo;
        const productIds = req.body.productIds ? (Array.isArray(req.body.productIds) ? req.body.productIds : [req.body.productIds]) : [];
        const minQuantity = parseInt(req.body.minQuantity) || 1;
        const minAmount = parseFloat(req.body.minAmount) || 0;
        const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
        const endDate = req.body.endDate ? new Date(req.body.endDate) : null;

        if (!endDate || endDate <= startDate) {
            res.json({
                code: "error",
                message: "Ngày kết thúc phải sau ngày bắt đầu!"
            });
            return;
        }

        if (promotionType === "discount_percentage" && promotionValue > 100) {
            res.json({
                code: "error",
                message: "Giảm giá phần trăm không được vượt quá 100%!"
            });
            return;
        }

        const promotionConfig: any = {};
        if (promotionType === "buy_x_get_y") {
            promotionConfig.buyX = parseInt(req.body.buyX) || 1;
            promotionConfig.getY = parseInt(req.body.getY) || 1;
        } else if (promotionType === "free_gift") {
            promotionConfig.giftProductId = req.body.giftProductId ? new mongoose.Types.ObjectId(req.body.giftProductId) : null;
            promotionConfig.giftDescription = req.body.giftDescription || '';
        }

        const newPromotion = new DealerPromotion({
            dealerId: dealerId,
            promotionName: req.body.promotionName || '',
            promotionType: promotionType,
            promotionValue: promotionValue,
            promotionConfig: promotionConfig,
            applyTo: applyTo,
            productIds: productIds.map((id: string) => new mongoose.Types.ObjectId(id)),
            conditions: {
                minQuantity: minQuantity,
                minAmount: minAmount
            },
            startDate: startDate,
            endDate: endDate,
            status: req.body.status || "active",
            notes: req.body.notes || '',
            createdBy: (req as any).user?.id || ''
        });

        await newPromotion.save();

        res.json({
            code: "success",
            message: "Thêm chương trình khuyến mãi thành công!"
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
        const promotionId = req.params.id;

        const dealer = await Dealer.findOne({
            _id: dealerId,
            deleted: false
        });

        if (!dealer) {
            res.redirect(`/${pathAdmin}/dealer/list`);
            return;
        }

        const promotion = await DealerPromotion.findOne({
            _id: promotionId,
            dealerId: dealerId,
            deleted: false
        })
        .populate('productIds', 'name version')
        .populate('promotionConfig.giftProductId', 'name version');

        if (!promotion) {
            res.redirect(`/${pathAdmin}/dealer/${dealerId}/promotion/list`);
            return;
        }

        const products = await Product.find({ deleted: false, status: "active" })
            .select('name version')
            .sort({ name: 1 });

        res.render('admin/pages/dealer-promotion-edit', {
            pageTitle: "Chỉnh sửa chương trình khuyến mãi",
            dealer: dealer,
            promotion: promotion,
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
        const promotionId = req.params.id;

        const promotion = await DealerPromotion.findOne({
            _id: promotionId,
            dealerId: dealerId,
            deleted: false
        });

        if (!promotion) {
            res.json({
                code: "error",
                message: "Chương trình khuyến mãi không tồn tại!"
            });
            return;
        }

        const promotionType = req.body.promotionType;
        const promotionValue = parseFloat(req.body.promotionValue) || 0;
        const applyTo = req.body.applyTo;
        const productIds = req.body.productIds ? (Array.isArray(req.body.productIds) ? req.body.productIds : [req.body.productIds]) : [];
        const minQuantity = parseInt(req.body.minQuantity) || 1;
        const minAmount = parseFloat(req.body.minAmount) || 0;
        const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
        const endDateInput = req.body.endDate ? new Date(req.body.endDate) : null;

        if (!endDateInput || endDateInput <= startDate) {
            res.json({
                code: "error",
                message: "Ngày kết thúc phải sau ngày bắt đầu!"
            });
            return;
        }

        const endDate = endDateInput; // Sau khi validate, endDate không thể null

        if (promotionType === "discount_percentage" && promotionValue > 100) {
            res.json({
                code: "error",
                message: "Giảm giá phần trăm không được vượt quá 100%!"
            });
            return;
        }

        const promotionConfig: any = {};
        if (promotionType === "buy_x_get_y") {
            promotionConfig.buyX = parseInt(req.body.buyX) || 1;
            promotionConfig.getY = parseInt(req.body.getY) || 1;
        } else if (promotionType === "free_gift") {
            promotionConfig.giftProductId = req.body.giftProductId ? new mongoose.Types.ObjectId(req.body.giftProductId) : null;
            promotionConfig.giftDescription = req.body.giftDescription || '';
        }

        promotion.promotionName = req.body.promotionName || '';
        promotion.promotionType = promotionType;
        promotion.promotionValue = promotionValue;
        promotion.promotionConfig = promotionConfig;
        promotion.applyTo = applyTo;
        promotion.productIds = productIds.map((id: string) => new mongoose.Types.ObjectId(id));
        if (!promotion.conditions) {
            promotion.conditions = { minQuantity: 1, minAmount: 0 };
        }
        promotion.conditions.minQuantity = minQuantity;
        promotion.conditions.minAmount = minAmount;
        promotion.startDate = startDate;
        promotion.endDate = endDate;
        promotion.status = req.body.status || "active";
        promotion.notes = req.body.notes || '';
        promotion.updatedBy = (req as any).user?.id || '';
        await promotion.save();

        res.json({
            code: "success",
            message: "Cập nhật chương trình khuyến mãi thành công!"
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
        const promotionId = req.params.id;

        await DealerPromotion.updateOne({
            _id: promotionId,
            dealerId: dealerId
        }, {
            deleted: true,
            deletedAt: Date.now()
        });

        res.json({
            code: "success",
            message: "Xóa chương trình khuyến mãi thành công!"
        });
    } catch (error) {
        console.log(error);
        res.json({
            code: "error",
            message: "Id không hợp lệ!"
        });
    }
};

