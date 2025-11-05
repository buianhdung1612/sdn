import { Response } from 'express';
import DealerPricing from '../../models/dealer-pricing.model';
import DealerDiscount from '../../models/dealer-discount.model';
import DealerPromotion from '../../models/dealer-promotion.model';
import Product from '../../models/product.model';
import CategoryProduct from '../../models/category-product.model';
import mongoose from 'mongoose';
import { RequestClient } from '../../interfaces/request.interface';

// GET /api/client/pricing
// Lấy giá sỉ của đại lý
export const getDealerPricing = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;
        const productId = req.query.productId as string || "";

        if (!dealerId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        const query: any = {
            dealerId: new mongoose.Types.ObjectId(dealerId),
            status: "active",
            deleted: false,
            $or: [
                { expiryDate: null },
                { expiryDate: { $gte: new Date() } }
            ]
        };

        if (productId) {
            query.productId = new mongoose.Types.ObjectId(productId);
        }

        const pricingList = await DealerPricing.find(query)
            .populate('productId', 'name version images basePrice')
            .sort({ effectiveDate: -1 });

        const formattedPricing = await Promise.all(pricingList.map(async (pricing: any) => {
            const product = pricing.productId;
            let variantInfo = null;

            if (pricing.variantIndex !== null && product?.variants) {
                const variant = product.variants[pricing.variantIndex];
                if (variant) {
                    variantInfo = {
                        index: pricing.variantIndex,
                        attributeValue: variant.attributeValue,
                        price: variant.price,
                        sku: variant.sku
                    };
                }
            }

            return {
                id: pricing._id.toString(),
                product: {
                    id: product._id.toString(),
                    name: product.name,
                    version: product.version,
                    images: product.images || [],
                    basePrice: product.basePrice
                },
                variant: variantInfo,
                wholesalePrice: pricing.wholesalePrice,
                effectiveDate: pricing.effectiveDate,
                expiryDate: pricing.expiryDate,
                notes: pricing.notes
            };
        }));

        res.json({
            success: true,
            message: "Lấy danh sách giá sỉ thành công!",
            data: {
                pricing: formattedPricing
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

// GET /api/client/discounts
// Lấy chính sách chiết khấu của đại lý
export const getDealerDiscounts = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;

        if (!dealerId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        const query: any = {
            dealerId: new mongoose.Types.ObjectId(dealerId),
            status: "active",
            deleted: false,
            $or: [
                { expiryDate: null },
                { expiryDate: { $gte: new Date() } }
            ]
        };

        const discounts = await DealerDiscount.find(query)
            .populate('productIds', 'name version images')
            .sort({ effectiveDate: -1 });

        const formattedDiscounts = await Promise.all(discounts.map(async (discount: any) => {
            let categories: any[] = [];
            if (discount.applyTo === 'product_category' && discount.categoryIds.length > 0) {
                const cats = await CategoryProduct.find({
                    _id: { $in: discount.categoryIds },
                    deleted: false
                }).select('name slug');
                categories = cats.map(cat => ({
                    id: cat._id.toString(),
                    name: cat.name,
                    slug: cat.slug
                }));
            }

            return {
                id: discount._id.toString(),
                discountName: discount.discountName,
                discountType: discount.discountType,
                discountValue: discount.discountValue,
                applyTo: discount.applyTo,
                products: discount.productIds || [],
                categories: categories,
                minQuantity: discount.minQuantity,
                minAmount: discount.minAmount,
                effectiveDate: discount.effectiveDate,
                expiryDate: discount.expiryDate,
                notes: discount.notes
            };
        }));

        res.json({
            success: true,
            message: "Lấy danh sách chiết khấu thành công!",
            data: {
                discounts: formattedDiscounts
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

// GET /api/client/promotions
// Lấy khuyến mãi của đại lý
export const getDealerPromotions = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;

        if (!dealerId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        const now = new Date();
        const query: any = {
            dealerId: new mongoose.Types.ObjectId(dealerId),
            status: "active",
            deleted: false,
            startDate: { $lte: now },
            endDate: { $gte: now }
        };

        const promotions = await DealerPromotion.find(query)
            .populate('productIds', 'name version images')
            .populate('promotionConfig.giftProductId', 'name version images')
            .sort({ startDate: -1 });

        const formattedPromotions = promotions.map((promotion: any) => ({
            id: promotion._id.toString(),
            promotionName: promotion.promotionName,
            promotionType: promotion.promotionType,
            promotionValue: promotion.promotionValue,
            promotionConfig: promotion.promotionConfig,
            applyTo: promotion.applyTo,
            products: promotion.productIds || [],
            conditions: promotion.conditions,
            startDate: promotion.startDate,
            endDate: promotion.endDate,
            notes: promotion.notes
        }));

        res.json({
            success: true,
            message: "Lấy danh sách khuyến mãi thành công!",
            data: {
                promotions: formattedPromotions
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

// GET /api/client/pricing/calculate
// Tính giá bán cuối cùng sau chiết khấu & khuyến mãi
export const calculateFinalPrice = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;
        const { productId, variantIndex, quantity } = req.query;

        if (!dealerId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        if (!productId || variantIndex === undefined || !quantity) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin sản phẩm, phiên bản hoặc số lượng!"
            });
        }

        // Get product
        const product = await Product.findOne({
            _id: productId,
            deleted: false,
            status: "active"
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm!"
            });
        }

        const variant = product.variants?.[parseInt(variantIndex as string)];
        if (!variant) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phiên bản sản phẩm!"
            });
        }

        // Get wholesale price
        const pricing = await DealerPricing.findOne({
            dealerId: new mongoose.Types.ObjectId(dealerId),
            productId: new mongoose.Types.ObjectId(productId as string),
            $or: [
                { variantIndex: parseInt(variantIndex as string) },
                { variantIndex: null }
            ],
            status: "active",
            deleted: false,
            $and: [
                { effectiveDate: { $lte: new Date() } },
                {
                    $or: [
                        { expiryDate: null },
                        { expiryDate: { $gte: new Date() } }
                    ]
                }
            ]
        }).sort({ variantIndex: -1, effectiveDate: -1 });

        const basePrice = pricing?.wholesalePrice || variant.price;
        const qty = parseInt(quantity as string);
        const subtotal = basePrice * qty;

        // Check applicable discounts
        const discounts = await DealerDiscount.find({
            dealerId: new mongoose.Types.ObjectId(dealerId),
            status: "active",
            deleted: false,
            minQuantity: { $lte: qty },
            minAmount: { $lte: subtotal },
            $and: [
                { effectiveDate: { $lte: new Date() } },
                {
                    $or: [
                        { expiryDate: null },
                        { expiryDate: { $gte: new Date() } }
                    ]
                }
            ]
        });

        let applicableDiscount: any = null;
        let discountAmount = 0;

        for (const discount of discounts) {
            if (discount.applyTo === "all_products" ||
                (discount.applyTo === "specific_products" && discount.productIds.some((id: any) => id.toString() === productId)) ||
                (discount.applyTo === "product_category" && product.category?.some((catId: string) => discount.categoryIds.includes(catId)))) {
                
                let amount = 0;
                if (discount.discountType === "percentage") {
                    amount = (subtotal * discount.discountValue) / 100;
                } else {
                    amount = discount.discountValue;
                }

                if (amount > discountAmount) {
                    discountAmount = amount;
                    applicableDiscount = discount;
                }
            }
        }

        const totalAfterDiscount = subtotal - discountAmount;

        res.json({
            success: true,
            message: "Tính giá thành công!",
            data: {
                product: {
                    id: product._id.toString(),
                    name: product.name,
                    version: product.version
                },
                variant: {
                    index: parseInt(variantIndex as string),
                    attributeValue: variant.attributeValue
                },
                quantity: qty,
                basePrice: basePrice,
                subtotal: subtotal,
                discount: applicableDiscount ? {
                    id: applicableDiscount._id.toString(),
                    name: applicableDiscount.discountName,
                    type: applicableDiscount.discountType,
                    value: applicableDiscount.discountValue,
                    amount: discountAmount
                } : null,
                totalAfterDiscount: totalAfterDiscount
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

