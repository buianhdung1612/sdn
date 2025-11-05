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
            .populate({
                path: 'productId',
                select: 'name version basePrice variants'
            })
            .limit(limitItems)
            .skip(skip)
            .sort({ createdAt: "desc" })
            .lean(); // Use lean() để convert thành plain JavaScript objects

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
            .sort({ name: 1 })
            .lean(); // Use lean() để convert thành plain JavaScript objects

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
        const variantIndexStr = req.body.variantIndex;
        
        if (!variantIndexStr || variantIndexStr === '') {
            res.json({
                code: "error",
                message: "Vui lòng chọn biến thể!"
            });
            return;
        }
        
        const variantIndex = parseInt(variantIndexStr);
        if (isNaN(variantIndex)) {
            res.json({
                code: "error",
                message: "Biến thể không hợp lệ!"
            });
            return;
        }
        
        const wholesalePrice = parseFloat(req.body.wholesalePrice) || 0;
        const effectiveDate = req.body.effectiveDate ? new Date(req.body.effectiveDate) : new Date();
        const expiryDate = req.body.expiryDate ? new Date(req.body.expiryDate) : null;

        // Validate ngày hiệu lực không được trong quá khứ
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        effectiveDate.setHours(0, 0, 0, 0);
        
        if (effectiveDate < today) {
            res.json({
                code: "error",
                message: "Ngày hiệu lực không được trong quá khứ!"
            });
            return;
        }

        // Validate ngày hết hạn phải >= ngày hiệu lực
        if (expiryDate) {
            expiryDate.setHours(0, 0, 0, 0);
            if (expiryDate < today) {
                res.json({
                    code: "error",
                    message: "Ngày hết hạn không được trong quá khứ!"
                });
                return;
            }
            if (expiryDate < effectiveDate) {
                res.json({
                    code: "error",
                    message: "Ngày hết hạn phải lớn hơn hoặc bằng ngày hiệu lực!"
                });
                return;
            }
        }

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

        if (!product.variants || !product.variants[variantIndex]) {
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
        .populate({
            path: 'productId',
            select: 'name version basePrice variants'
        })
        .lean(); // Use lean() để convert thành plain JavaScript objects

        if (!pricing) {
            res.redirect(`/${pathAdmin}/dealer/${dealerId}/pricing/list`);
            return;
        }

        const products = await Product.find({ deleted: false, status: "active" })
            .select('name version basePrice variants')
            .sort({ name: 1 })
            .lean(); // Use lean() để convert thành plain JavaScript objects

        // Convert _id thành id cho pricing để tương thích với template
        const pricingFormatted = {
            ...pricing,
            id: (pricing as any)._id ? (pricing as any)._id.toString() : (pricing as any).id || ''
        };

        res.render('admin/pages/dealer-pricing-edit', {
            pageTitle: "Chỉnh sửa giá sỉ",
            dealer: dealer,
            pricing: pricingFormatted,
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

        // Validate ngày hiệu lực không được trong quá khứ
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        effectiveDate.setHours(0, 0, 0, 0);
        
        if (effectiveDate < today) {
            res.json({
                code: "error",
                message: "Ngày hiệu lực không được trong quá khứ!"
            });
            return;
        }

        // Validate ngày hết hạn phải >= ngày hiệu lực
        if (expiryDate) {
            expiryDate.setHours(0, 0, 0, 0);
            if (expiryDate < today) {
                res.json({
                    code: "error",
                    message: "Ngày hết hạn không được trong quá khứ!"
                });
                return;
            }
            if (expiryDate < effectiveDate) {
                res.json({
                    code: "error",
                    message: "Ngày hết hạn phải lớn hơn hoặc bằng ngày hiệu lực!"
                });
                return;
            }
        }

        // Kiểm tra giá sỉ trùng lặp (trừ chính record này)
        if (req.body.productId && req.body.variantIndex !== undefined && req.body.variantIndex !== '') {
            const variantIndex = parseInt(req.body.variantIndex);
            if (isNaN(variantIndex)) {
                res.json({
                    code: "error",
                    message: "Biến thể không hợp lệ!"
                });
                return;
            }
            
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
            pricing.variantIndex = variantIndex;
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

