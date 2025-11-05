import { Response } from 'express';
import DealerInventory from '../../models/dealer-inventory.model';
import Product from '../../models/product.model';
import CategoryProduct from '../../models/category-product.model';
import DealerPricing from '../../models/dealer-pricing.model';
import mongoose from 'mongoose';
import { RequestClient } from '../../interfaces/request.interface';

// GET /api/client/inventory
// Lấy danh sách tồn kho của đại lý
export const getInventoryList = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const keyword = req.query.keyword as string || "";
        const categoryId = req.query.categoryId as string || "";
        const lowStock = req.query.lowStock === "true"; // Filter low stock items

        if (!dealerId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        // Build query
        const inventoryQuery: any = {
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        };

        // Filter low stock (stock <= 5)
        if (lowStock) {
            inventoryQuery.stock = { $lte: 5 };
        }

        // Get inventories
        const totalRecords = await DealerInventory.countDocuments(inventoryQuery);
        const totalPages = Math.ceil(totalRecords / limit);
        const skip = (page - 1) * limit;

        const inventories = await DealerInventory.find(inventoryQuery)
            .sort({ lastUpdatedAt: -1, createdAt: -1 })
            .limit(limit)
            .skip(skip);

        // Get unique productIds
        const productIds = [...new Set(inventories.map(inv => inv.productId.toString()))];

        // Build product query
        const productQuery: any = {
            _id: { $in: productIds.map(id => new mongoose.Types.ObjectId(id)) },
            deleted: false,
            status: "active"
        };

        // Filter by keyword
        if (keyword) {
            const keywordRegex = new RegExp(keyword, "i");
            productQuery.$or = [
                { name: keywordRegex },
                { version: keywordRegex },
                { search: keywordRegex }
            ];
        }

        // Filter by category
        if (categoryId) {
            productQuery.category = { $in: [categoryId] };
        }

        // Get products
        const products = await Product.find(productQuery);

        // Create product map
        const productMap: { [key: string]: any } = {};
        products.forEach(p => {
            productMap[p._id.toString()] = p;
        });

        // Get categories
        const categoryIds = [...new Set(products.flatMap(p => p.category || []))];
        const categories = await CategoryProduct.find({
            _id: { $in: categoryIds },
            deleted: false
        }).select('name slug');

        const categoryMap: { [key: string]: any } = {};
        categories.forEach(cat => {
            categoryMap[cat._id.toString()] = {
                id: cat._id.toString(),
                name: cat.name,
                slug: cat.slug
            };
        });

        // Get dealer pricing for products
        const pricingRecords = await DealerPricing.find({
            dealerId: new mongoose.Types.ObjectId(dealerId),
            productId: { $in: productIds.map(id => new mongoose.Types.ObjectId(id)) },
            status: "active",
            deleted: false,
            $or: [
                { expiryDate: null },
                { expiryDate: { $gte: new Date() } }
            ]
        });

        // Create pricing map: productId_variantIndex => price
        const pricingMap: { [key: string]: number } = {};
        pricingRecords.forEach(pricing => {
            const key = `${pricing.productId.toString()}_${pricing.variantIndex === null ? 'all' : pricing.variantIndex}`;
            pricingMap[key] = pricing.wholesalePrice;
        });

        // Format response
        const inventoryList: any[] = [];

        for (const inventory of inventories) {
            const product = productMap[inventory.productId.toString()];
            if (!product) continue; // Skip if product not found or filtered out

            const variant = product.variants && product.variants[inventory.variantIndex];
            if (!variant) continue; // Skip if variant not found

            // Get pricing
            const specificPriceKey = `${inventory.productId.toString()}_${inventory.variantIndex}`;
            const allVariantsPriceKey = `${inventory.productId.toString()}_all`;
            const wholesalePrice = pricingMap[specificPriceKey] || pricingMap[allVariantsPriceKey] || variant.price;

            // Category names
            const categoryNames = (product.category || []).map((catId: string) => {
                return categoryMap[catId]?.name || null;
            }).filter(Boolean);

            inventoryList.push({
                inventoryId: inventory._id.toString(),
                product: {
                    id: product._id.toString(),
                    name: product.name,
                    version: product.version,
                    slug: product.slug,
                    images: product.images || [],
                    basePrice: product.basePrice,
                    rangeKm: product.rangeKm,
                    batteryKWh: product.batteryKWh,
                    maxPowerHP: product.maxPowerHP,
                    categories: categoryNames
                },
                variant: {
                    index: inventory.variantIndex,
                    hash: inventory.variantHash,
                    attributeValue: variant.attributeValue,
                    price: variant.price,
                    sku: variant.sku
                },
                stock: inventory.stock,
                reservedStock: inventory.reservedStock,
                availableStock: inventory.stock - inventory.reservedStock,
                wholesalePrice: wholesalePrice,
                lastUpdatedAt: inventory.lastUpdatedAt,
                notes: inventory.notes
            });
        }

        res.json({
            success: true,
            message: "Lấy danh sách tồn kho thành công!",
            data: {
                inventories: inventoryList,
                pagination: {
                    page: page,
                    limit: limit,
                    totalRecords: inventoryList.length, // After filtering by product
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

// GET /api/client/inventory/:productId
// Lấy tồn kho của một sản phẩm cụ thể
export const getInventoryByProduct = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;
        const productId = req.params.productId;

        if (!dealerId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        // Check product exists
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

        // Get all inventories for this product
        const inventories = await DealerInventory.find({
            dealerId: new mongoose.Types.ObjectId(dealerId),
            productId: new mongoose.Types.ObjectId(productId),
            deleted: false
        });

        if (inventories.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Sản phẩm này chưa có trong kho của đại lý!"
            });
        }

        // Get categories
        const categoryIds = product.category || [];
        const categories = await CategoryProduct.find({
            _id: { $in: categoryIds },
            deleted: false
        }).select('name slug');

        // Get dealer pricing
        const pricingRecords = await DealerPricing.find({
            dealerId: new mongoose.Types.ObjectId(dealerId),
            productId: new mongoose.Types.ObjectId(productId),
            status: "active",
            deleted: false,
            $or: [
                { expiryDate: null },
                { expiryDate: { $gte: new Date() } }
            ]
        });

        // Create pricing map
        const pricingMap: { [key: string]: number } = {};
        pricingRecords.forEach(pricing => {
            const key = pricing.variantIndex === null ? 'all' : pricing.variantIndex.toString();
            pricingMap[key] = pricing.wholesalePrice;
        });

        // Create inventory map
        const inventoryMap: { [key: number]: any } = {};
        inventories.forEach(inv => {
            inventoryMap[inv.variantIndex] = {
                inventoryId: inv._id.toString(),
                stock: inv.stock,
                reservedStock: inv.reservedStock,
                availableStock: inv.stock - inv.reservedStock,
                lastUpdatedAt: inv.lastUpdatedAt,
                notes: inv.notes
            };
        });

        // Format variants with inventory
        const variantsWithInventory = (product.variants || []).map((variant: any, index: number) => {
            const inventory = inventoryMap[index];
            const wholesalePrice = pricingMap[index.toString()] || pricingMap['all'] || variant.price;

            return {
                index: index,
                attributeValue: variant.attributeValue,
                price: variant.price,
                sku: variant.sku,
                wholesalePrice: wholesalePrice,
                inventory: inventory || {
                    stock: 0,
                    reservedStock: 0,
                    availableStock: 0,
                    notes: "Chưa có trong kho"
                }
            };
        });

        // Calculate total stock
        const totalStock = Object.values(inventoryMap).reduce((sum: number, inv: any) => sum + inv.stock, 0);
        const totalReserved = Object.values(inventoryMap).reduce((sum: number, inv: any) => sum + inv.reservedStock, 0);

        res.json({
            success: true,
            message: "Lấy thông tin tồn kho sản phẩm thành công!",
            data: {
                product: {
                    id: product._id.toString(),
                    name: product.name,
                    version: product.version,
                    slug: product.slug,
                    images: product.images || [],
                    basePrice: product.basePrice,
                    rangeKm: product.rangeKm,
                    batteryKWh: product.batteryKWh,
                    maxPowerHP: product.maxPowerHP,
                    categories: categories.map(cat => ({
                        id: cat._id.toString(),
                        name: cat.name,
                        slug: cat.slug
                    })),
                    attributes: product.attributes || []
                },
                variants: variantsWithInventory,
                summary: {
                    totalStock: totalStock,
                    totalReserved: totalReserved,
                    totalAvailable: totalStock - totalReserved,
                    variantsInStock: Object.keys(inventoryMap).length,
                    totalVariants: product.variants?.length || 0
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

