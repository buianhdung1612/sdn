import { Request, Response } from 'express';
import Product from '../../models/product.model';
import CategoryProduct from '../../models/category-product.model';
import DealerInventory from '../../models/dealer-inventory.model';
import mongoose from 'mongoose';
import { RequestClient } from '../../interfaces/request.interface';

export const getProducts = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;
        const keyword = req.query.keyword as string || "";
        const categoryId = req.query.categoryId as string || "";
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        if (!dealerId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        // Lấy tồn kho đại lý để biết sản phẩm nào đại lý có
        const inventories = await DealerInventory.find({
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false,
            stock: { $gt: 0 } // Chỉ lấy sản phẩm có tồn kho > 0
        }).select('productId variantIndex stock');

        // Lấy danh sách productId unique từ tồn kho đại lý
        const productIds = [...new Set(inventories.map(inv => inv.productId.toString()))];

        if (productIds.length === 0) {
            return res.json({
                success: true,
                message: "Lấy danh sách sản phẩm thành công!",
                data: {
                    products: [],
                    pagination: {
                        page: page,
                        limit: limit,
                        totalRecords: 0,
                        totalPages: 0
                    }
                }
            });
        }

        // Tạo map để lấy tồn kho theo productId và variantIndex
        const inventoryMap: { [key: string]: number } = {};
        inventories.forEach(inv => {
            const key = `${inv.productId.toString()}_${inv.variantIndex}`;
            inventoryMap[key] = inv.stock || 0;
        });

        // Xây dựng query filter
        const find: any = {
            _id: { $in: productIds.map(id => new mongoose.Types.ObjectId(id)) },
            deleted: false,
            status: "active"
        };

        // Tìm kiếm theo keyword
        if (keyword) {
            const keywordRegex = new RegExp(keyword, "i");
            find.$or = [
                { name: keywordRegex },
                { version: keywordRegex },
                { search: keywordRegex }
            ];
        }

        // Lọc theo category
        if (categoryId) {
            find.category = { $in: [categoryId] };
        }

        // Đếm tổng số records
        const totalRecords = await Product.countDocuments(find);
        const totalPages = Math.ceil(totalRecords / limit);
        const skip = (page - 1) * limit;

        // Lấy danh sách sản phẩm
        const products = await Product.find(find)
            .select('name version slug images basePrice rangeKm batteryKWh maxPowerHP category attributes variants status')
            .sort({ position: -1, createdAt: -1 })
            .limit(limit)
            .skip(skip);

        // Lấy thông tin category nếu có
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

        // Format dữ liệu trả về
        const formattedProducts = products.map(product => {
            // Tính tổng stock từ tồn kho đại lý (không phải từ variants của product)
            let totalStock = 0;
            if (product.variants && Array.isArray(product.variants)) {
                product.variants.forEach((variant: any, index: number) => {
                    const key = `${product._id.toString()}_${index}`;
                    const dealerStock = inventoryMap[key] || 0;
                    totalStock += dealerStock;
                });
            }

            // Lấy category names
            const categoryNames = (product.category || []).map((catId: string) => {
                return categoryMap[catId]?.name || null;
            }).filter(Boolean);

            // Format variants với tồn kho đại lý
            const formattedVariants = (product.variants || []).map((variant: any, index: number) => {
                const key = `${product._id.toString()}_${index}`;
                const dealerStock = inventoryMap[key] || 0;
                return {
                    ...variant,
                    dealerStock: dealerStock // Tồn kho của đại lý cho variant này
                };
            });

            return {
                id: product._id.toString(),
                name: product.name,
                version: product.version,
                slug: product.slug,
                images: product.images || [],
                basePrice: product.basePrice || 0,
                rangeKm: product.rangeKm || 0,
                batteryKWh: product.batteryKWh || 0,
                maxPowerHP: product.maxPowerHP || 0,
                categories: categoryNames,
                categoryIds: product.category || [],
                variants: formattedVariants,
                totalStock: totalStock, // Tổng tồn kho đại lý
                status: product.status
            };
        });

        res.json({
            success: true,
            message: "Lấy danh sách sản phẩm thành công!",
            data: {
                products: formattedProducts,
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

export const getProductDetail = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;
        const productId = req.params.id;

        if (!dealerId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        // Kiểm tra sản phẩm có trong tồn kho đại lý không
        const inventory = await DealerInventory.findOne({
            dealerId: new mongoose.Types.ObjectId(dealerId),
            productId: new mongoose.Types.ObjectId(productId),
            deleted: false,
            stock: { $gt: 0 }
        });

        if (!inventory) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền xem sản phẩm này hoặc sản phẩm chưa có trong kho!"
            });
        }

        // Lấy thông tin sản phẩm
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

        // Lấy thông tin category
        const categoryIds = product.category || [];
        const categories = await CategoryProduct.find({
            _id: { $in: categoryIds },
            deleted: false
        }).select('name slug');

        // Lấy tồn kho đại lý cho tất cả variants của sản phẩm này
        const productInventories = await DealerInventory.find({
            dealerId: new mongoose.Types.ObjectId(dealerId),
            productId: new mongoose.Types.ObjectId(productId),
            deleted: false
        }).select('variantIndex stock');

        const inventoryMap: { [key: number]: number } = {};
        productInventories.forEach(inv => {
            inventoryMap[inv.variantIndex] = inv.stock || 0;
        });

        // Format variants với tồn kho đại lý
        const formattedVariants = (product.variants || []).map((variant: any, index: number) => {
            return {
                ...variant,
                dealerStock: inventoryMap[index] || 0 // Tồn kho của đại lý cho variant này
            };
        });

        // Tính tổng tồn kho đại lý
        const totalStock = Object.values(inventoryMap).reduce((sum, stock) => sum + stock, 0);

        // Format dữ liệu
        const formattedProduct = {
            id: product._id.toString(),
            name: product.name,
            version: product.version,
            slug: product.slug,
            images: product.images || [],
            basePrice: product.basePrice || 0,
            rangeKm: product.rangeKm || 0,
            batteryKWh: product.batteryKWh || 0,
            maxPowerHP: product.maxPowerHP || 0,
            categories: categories.map(cat => ({
                id: cat._id.toString(),
                name: cat.name,
                slug: cat.slug
            })),
            categoryIds: product.category || [],
            attributes: product.attributes || [],
            variants: formattedVariants,
            totalStock: totalStock, // Tổng tồn kho đại lý
            content: product.content || "",
            status: product.status
        };

        res.json({
            success: true,
            message: "Lấy thông tin sản phẩm thành công!",
            data: {
                product: formattedProduct
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

