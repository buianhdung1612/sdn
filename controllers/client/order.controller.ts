import { Response } from 'express';
import Order from '../../models/order.model';
import Product from '../../models/product.model';
import DealerInventory from '../../models/dealer-inventory.model';
import mongoose from 'mongoose';
import { RequestClient } from '../../interfaces/request.interface';
import { generateUniqueNumber } from '../../helpers/generate.helper';
import crypto from 'crypto';

// GET /api/client/orders
// Lấy danh sách đơn hàng
export const getOrderList = async (req: RequestClient, res: Response) => {
    try {
        console.log("=== GET ORDER LIST ===");
        console.log("req.dealerId:", req.dealerId);
        console.log("req.userId:", req.userId);
        
        const dealerId = req.dealerId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string || "";
        const keyword = req.query.keyword as string || "";

        if (!dealerId) {
            console.log("ERROR: No dealerId found");
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }
        
        console.log("Query:", { dealerId, page, limit, status, keyword });

        const query: any = {
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        };

        if (status) {
            query.status = status;
        }

        if (keyword) {
            query.search = new RegExp(keyword.toLowerCase(), 'i');
        }

        const totalRecords = await Order.countDocuments(query);
        const totalPages = Math.ceil(totalRecords / limit);
        const skip = (page - 1) * limit;

        console.log("Fetching orders...");
        const orders = await Order.find(query)
            .populate('items.productId', 'name version images')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        console.log("Found orders:", orders.length);
        
        const formattedOrders = orders.map((order: any) => ({
            id: order._id.toString(),
            orderNumber: order.orderNumber,
            customer: {
                fullName: order.customerInfo.fullName,
                phone: order.customerInfo.phone,
                email: order.customerInfo.email,
                address: order.customerInfo.address
            },
            totalItems: order.items.length,
            totalQuantity: order.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
            subtotal: order.subtotal,
            discountAmount: order.discountAmount,
            totalAmount: order.totalAmount,
            status: order.status,
            paymentMethod: order.paymentMethod,
            orderedAt: order.orderedAt,
            confirmedAt: order.confirmedAt,
            completedAt: order.completedAt,
            cancelledAt: order.cancelledAt,
            createdAt: order.createdAt
        }));

        console.log("Returning response with", formattedOrders.length, "orders");
        
        return res.json({
            success: true,
            message: "Lấy danh sách đơn hàng thành công!",
            data: formattedOrders,
            pagination: {
                total: totalRecords,
                page: page,
                limit: limit,
                totalPages: totalPages
            }
        });
    } catch (error: any) {
        console.log("=== ERROR IN GET ORDER LIST ===");
        console.log("Error:", error);
        console.log("Error message:", error.message);
        console.log("Error stack:", error.stack);
        return res.status(500).json({
            success: false,
            message: "Đã có lỗi xảy ra, vui lòng thử lại sau!",
            error: error.message
        });
    }
};

// GET /api/client/orders/:id
// Chi tiết đơn hàng
export const getOrderDetail = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;
        const orderId = req.params.id;

        if (!dealerId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        const order = await Order.findOne({
            _id: new mongoose.Types.ObjectId(orderId),
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        })
            .populate('items.productId', 'name version images basePrice')
            .populate('createdBy', 'fullName email')
            .populate('updatedBy', 'fullName email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đơn hàng!"
            });
        }

        const orderData = order.toObject() as any;

        // Format items
        const formattedItems = orderData.items.map((item: any) => {
            const product = item.productId;
            let variantInfo = null;

            if (product && product.variants && product.variants[item.variantIndex]) {
                const variant = product.variants[item.variantIndex];
                variantInfo = {
                    attributeValues: variant.attributeValue || [],
                    price: variant.price
                };
            }

            return {
                productId: product?._id?.toString(),
                productName: item.productSnapshot?.name || product?.name,
                productVersion: item.productSnapshot?.version || product?.version,
                productImages: item.productSnapshot?.images || product?.images || [],
                variantIndex: item.variantIndex,
                variantInfo: variantInfo,
                attributeValues: item.productSnapshot?.attributeValues || [],
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount,
                totalPrice: item.totalPrice
            };
        });

        const response = {
            id: orderData._id.toString(),
            orderNumber: orderData.orderNumber,
            customer: {
                fullName: orderData.customerInfo.fullName,
                phone: orderData.customerInfo.phone,
                email: orderData.customerInfo.email,
                address: orderData.customerInfo.address
            },
            items: formattedItems,
            subtotal: orderData.subtotal,
            discountAmount: orderData.discountAmount,
            taxAmount: orderData.taxAmount,
            totalAmount: orderData.totalAmount,
            status: orderData.status,
            statusHistory: orderData.statusHistory,
            paymentMethod: orderData.paymentMethod,
            shippingAddress: orderData.shippingAddress,
            customerNotes: orderData.customerNotes,
            dealerNotes: orderData.dealerNotes,
            orderedAt: orderData.orderedAt,
            confirmedAt: orderData.confirmedAt,
            completedAt: orderData.completedAt,
            cancelledAt: orderData.cancelledAt,
            createdBy: orderData.createdBy,
            updatedBy: orderData.updatedBy,
            createdAt: orderData.createdAt,
            updatedAt: orderData.updatedAt
        };

        return res.json({
            success: true,
            message: "Lấy thông tin đơn hàng thành công!",
            data: response
        });
    } catch (error: any) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Đã có lỗi xảy ra, vui lòng thử lại sau!"
        });
    }
};

// POST /api/client/orders
// Tạo đơn hàng mới
export const createOrder = async (req: RequestClient, res: Response) => {
    try {
        console.log("=== CREATE ORDER ===");
        console.log("dealerId:", req.dealerId);
        console.log("userId:", req.userId);
        console.log("body:", JSON.stringify(req.body, null, 2));
        
        const dealerId = req.dealerId;
        const userId = req.userId;

        if (!dealerId) {
            console.log("ERROR: No dealerId");
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        const { customerInfo, items, customerNotes, paymentMethod, shippingAddress } = req.body;

        // Validate customer info
        if (!customerInfo || !customerInfo.fullName || !customerInfo.phone) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp đầy đủ thông tin khách hàng (tên và số điện thoại)!"
            });
        }

        // Validate items
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Đơn hàng phải có ít nhất 1 sản phẩm!"
            });
        }

        // Process items và calculate prices
        const processedItems = [];
        let subtotal = 0;

        for (const item of items) {
            const { productId, variantIndex, quantity } = item;
            
            console.log(`Processing item: productId=${productId}, variantIndex=${variantIndex}, quantity=${quantity}`);

            // Validate product
            const product = await Product.findOne({
                _id: new mongoose.Types.ObjectId(productId),
                deleted: false,
                status: "active"
            });

            if (!product) {
                console.log(`ERROR: Product not found: ${productId}`);
                return res.status(404).json({
                    success: false,
                    message: `Không tìm thấy sản phẩm với ID: ${productId}`
                });
            }
            
            console.log(`Found product: ${product.name}`);

            // Validate variant
            const productData = product.toObject() as any;
            if (!productData.variants || !productData.variants[variantIndex]) {
                return res.status(400).json({
                    success: false,
                    message: `Không tìm thấy biến thể ${variantIndex} của sản phẩm ${productData.name}`
                });
            }

            const variant = productData.variants[variantIndex];

            // Generate variant hash
            const sortedAttributes = [...variant.attributeValue].sort();
            const variantHash = crypto.createHash('md5')
                .update(sortedAttributes.join('|'))
                .digest('hex');

            // Check inventory
            const inventory = await DealerInventory.findOne({
                dealerId: new mongoose.Types.ObjectId(dealerId),
                productId: new mongoose.Types.ObjectId(productId),
                variantIndex: variantIndex,
                deleted: false
            });

            if (!inventory) {
                return res.status(400).json({
                    success: false,
                    message: `Sản phẩm ${productData.name} (${variant.attributeValue.join(', ')}) không có trong kho!`
                });
            }

            const availableStock = inventory.stock - inventory.reservedStock;
            if (availableStock < quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Sản phẩm ${productData.name} (${variant.attributeValue.join(', ')}) chỉ còn ${availableStock} xe!`
                });
            }

            // Calculate price
            const unitPrice = variant.price || productData.basePrice;
            const discount = item.discount || 0;
            const totalPrice = (unitPrice - discount) * quantity;

            processedItems.push({
                productId: productId,
                variantIndex: variantIndex,
                variantHash: variantHash,
                quantity: quantity,
                unitPrice: unitPrice,
                discount: discount,
                totalPrice: totalPrice,
                productSnapshot: {
                    name: productData.name,
                    version: productData.version,
                    images: productData.images || [],
                    attributeValues: variant.attributeValue
                }
            });

            subtotal += totalPrice;
        }

        // Calculate totals
        const discountAmount = 0; // TODO: Apply discount logic if needed
        const taxAmount = 0; // TODO: Apply tax logic if needed
        const totalAmount = subtotal - discountAmount + taxAmount;

        // Generate order number
        const orderNumber = generateUniqueNumber("ORD");

        // Create order
        const newOrder = new Order({
            orderNumber: orderNumber,
            dealerId: new mongoose.Types.ObjectId(dealerId),
            customerInfo: {
                fullName: customerInfo.fullName,
                phone: customerInfo.phone,
                email: customerInfo.email || "",
                address: customerInfo.address || ""
            },
            items: processedItems,
            subtotal: subtotal,
            discountAmount: discountAmount,
            taxAmount: taxAmount,
            totalAmount: totalAmount,
            status: "draft",
            statusHistory: [{
                status: "draft",
                changedAt: new Date(),
                changedBy: new mongoose.Types.ObjectId(userId)
            }],
            customerNotes: customerNotes,
            paymentMethod: paymentMethod || "cash",
            shippingAddress: shippingAddress,
            createdBy: new mongoose.Types.ObjectId(userId)
        });

        console.log("Saving order...");
        await newOrder.save();
        console.log("Order saved successfully:", newOrder._id);

        return res.status(201).json({
            success: true,
            message: "Tạo đơn hàng thành công!",
            data: {
                id: newOrder._id.toString(),
                orderNumber: newOrder.orderNumber,
                status: newOrder.status,
                totalAmount: newOrder.totalAmount
            }
        });
    } catch (error: any) {
        console.log("=== ERROR IN CREATE ORDER ===");
        console.log("Error:", error);
        console.log("Error message:", error.message);
        console.log("Error stack:", error.stack);
        return res.status(500).json({
            success: false,
            message: "Đã có lỗi xảy ra, vui lòng thử lại sau!",
            error: error.message
        });
    }
};

// PATCH /api/client/orders/:id
// Cập nhật đơn hàng (chỉ draft)
export const updateOrder = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;
        const userId = req.userId;
        const orderId = req.params.id;

        if (!dealerId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        const order = await Order.findOne({
            _id: new mongoose.Types.ObjectId(orderId),
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đơn hàng!"
            });
        }

        const orderData = order as any;

        if (orderData.status !== "draft") {
            return res.status(400).json({
                success: false,
                message: "Chỉ có thể sửa đơn hàng ở trạng thái 'draft'!"
            });
        }

        const { items, customerNotes, dealerNotes, paymentMethod, shippingAddress } = req.body;

        // Update items if provided
        if (items && items.length > 0) {
            const processedItems = [];
            let subtotal = 0;

            for (const item of items) {
                const { productId, variantIndex, quantity, discount } = item;

                const product = await Product.findOne({
                    _id: new mongoose.Types.ObjectId(productId),
                    deleted: false,
                    status: "active"
                });

                if (!product) {
                    return res.status(404).json({
                        success: false,
                        message: `Không tìm thấy sản phẩm với ID: ${productId}`
                    });
                }

                const productData = product.toObject() as any;
                const variant = productData.variants[variantIndex];

                if (!variant) {
                    return res.status(400).json({
                        success: false,
                        message: `Không tìm thấy biến thể ${variantIndex} của sản phẩm ${productData.name}`
                    });
                }

                const sortedAttributes = [...variant.attributeValue].sort();
                const variantHash = crypto.createHash('md5')
                    .update(sortedAttributes.join('|'))
                    .digest('hex');

                const unitPrice = variant.price || productData.basePrice;
                const itemDiscount = discount || 0;
                const totalPrice = (unitPrice - itemDiscount) * quantity;

                processedItems.push({
                    productId: productId,
                    variantIndex: variantIndex,
                    variantHash: variantHash,
                    quantity: quantity,
                    unitPrice: unitPrice,
                    discount: itemDiscount,
                    totalPrice: totalPrice,
                    productSnapshot: {
                        name: productData.name,
                        version: productData.version,
                        images: productData.images || [],
                        attributeValues: variant.attributeValue
                    }
                });

                subtotal += totalPrice;
            }

            orderData.items = processedItems;
            orderData.subtotal = subtotal;
            orderData.totalAmount = subtotal - orderData.discountAmount + orderData.taxAmount;
        }

        // Update other fields
        if (customerNotes !== undefined) orderData.customerNotes = customerNotes;
        if (dealerNotes !== undefined) orderData.dealerNotes = dealerNotes;
        if (paymentMethod) orderData.paymentMethod = paymentMethod;
        if (shippingAddress) orderData.shippingAddress = shippingAddress;

        orderData.updatedBy = new mongoose.Types.ObjectId(userId);

        await orderData.save();

        return res.json({
            success: true,
            message: "Cập nhật đơn hàng thành công!",
            data: {
                id: orderData._id.toString(),
                orderNumber: orderData.orderNumber,
                status: orderData.status,
                totalAmount: orderData.totalAmount
            }
        });
    } catch (error: any) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Đã có lỗi xảy ra, vui lòng thử lại sau!"
        });
    }
};

// PATCH /api/client/orders/:id/submit
// Gửi đơn hàng (draft -> pending)
export const submitOrder = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;
        const userId = req.userId;
        const orderId = req.params.id;

        if (!dealerId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        const order = await Order.findOne({
            _id: new mongoose.Types.ObjectId(orderId),
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đơn hàng!"
            });
        }

        const orderData = order as any;

        if (orderData.status !== "draft") {
            return res.status(400).json({
                success: false,
                message: "Chỉ có thể gửi đơn hàng ở trạng thái 'draft'!"
            });
        }

        // Reserve stock for all items
        for (const item of orderData.items) {
            const inventory = await DealerInventory.findOne({
                dealerId: new mongoose.Types.ObjectId(dealerId),
                productId: item.productId,
                variantIndex: item.variantIndex,
                deleted: false
            });

            if (!inventory) {
                return res.status(400).json({
                    success: false,
                    message: `Sản phẩm không còn trong kho!`
                });
            }

            const availableStock = inventory.stock - inventory.reservedStock;
            if (availableStock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Sản phẩm chỉ còn ${availableStock} xe!`
                });
            }

            // Reserve stock
            inventory.reservedStock += item.quantity;
            await inventory.save();
        }

        // Update order status
        orderData.status = "pending";
        orderData.orderedAt = new Date();
        orderData.statusHistory.push({
            status: "pending",
            changedAt: new Date(),
            changedBy: new mongoose.Types.ObjectId(userId),
            notes: "Đơn hàng đã được gửi"
        });
        orderData.updatedBy = new mongoose.Types.ObjectId(userId);

        await orderData.save();

        return res.json({
            success: true,
            message: "Gửi đơn hàng thành công!",
            data: {
                id: orderData._id.toString(),
                orderNumber: orderData.orderNumber,
                status: orderData.status,
                orderedAt: orderData.orderedAt
            }
        });
    } catch (error: any) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Đã có lỗi xảy ra, vui lòng thử lại sau!"
        });
    }
};

// PATCH /api/client/orders/:id/confirm
// Xác nhận đơn hàng (pending -> confirmed)
export const confirmOrder = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;
        const userId = req.userId;
        const orderId = req.params.id;

        if (!dealerId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        const order = await Order.findOne({
            _id: new mongoose.Types.ObjectId(orderId),
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đơn hàng!"
            });
        }

        const orderData = order as any;

        if (orderData.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Chỉ có thể xác nhận đơn hàng ở trạng thái 'pending'!"
            });
        }

        orderData.status = "confirmed";
        orderData.confirmedAt = new Date();
        orderData.statusHistory.push({
            status: "confirmed",
            changedAt: new Date(),
            changedBy: new mongoose.Types.ObjectId(userId),
            notes: req.body.notes || "Đơn hàng đã được xác nhận"
        });
        orderData.updatedBy = new mongoose.Types.ObjectId(userId);

        await orderData.save();

        return res.json({
            success: true,
            message: "Xác nhận đơn hàng thành công!",
            data: {
                id: orderData._id.toString(),
                orderNumber: orderData.orderNumber,
                status: orderData.status,
                confirmedAt: orderData.confirmedAt
            }
        });
    } catch (error: any) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Đã có lỗi xảy ra, vui lòng thử lại sau!"
        });
    }
};

// PATCH /api/client/orders/:id/cancel
// Hủy đơn hàng
export const cancelOrder = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;
        const userId = req.userId;
        const orderId = req.params.id;

        if (!dealerId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        const order = await Order.findOne({
            _id: new mongoose.Types.ObjectId(orderId),
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đơn hàng!"
            });
        }

        const orderData = order as any;

        if (["completed", "cancelled", "refunded"].includes(orderData.status)) {
            return res.status(400).json({
                success: false,
                message: "Không thể hủy đơn hàng ở trạng thái này!"
            });
        }

        // Release reserved stock if order was pending or confirmed
        if (["pending", "confirmed", "processing"].includes(orderData.status)) {
            for (const item of orderData.items) {
                const inventory = await DealerInventory.findOne({
                    dealerId: new mongoose.Types.ObjectId(dealerId),
                    productId: item.productId,
                    variantIndex: item.variantIndex,
                    deleted: false
                });

                if (inventory) {
                    inventory.reservedStock -= item.quantity;
                    if (inventory.reservedStock < 0) inventory.reservedStock = 0;
                    await inventory.save();
                }
            }
        }

        orderData.status = "cancelled";
        orderData.cancelledAt = new Date();
        orderData.statusHistory.push({
            status: "cancelled",
            changedAt: new Date(),
            changedBy: new mongoose.Types.ObjectId(userId),
            notes: req.body.reason || "Đơn hàng đã bị hủy"
        });
        orderData.updatedBy = new mongoose.Types.ObjectId(userId);

        await orderData.save();

        return res.json({
            success: true,
            message: "Hủy đơn hàng thành công!",
            data: {
                id: orderData._id.toString(),
                orderNumber: orderData.orderNumber,
                status: orderData.status,
                cancelledAt: orderData.cancelledAt
            }
        });
    } catch (error: any) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Đã có lỗi xảy ra, vui lòng thử lại sau!"
        });
    }
};

// DELETE /api/client/orders/:id
// Xóa đơn hàng (chỉ draft)
export const deleteOrder = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;
        const orderId = req.params.id;

        if (!dealerId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        const order = await Order.findOne({
            _id: new mongoose.Types.ObjectId(orderId),
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đơn hàng!"
            });
        }

        const orderData = order as any;

        if (orderData.status !== "draft") {
            return res.status(400).json({
                success: false,
                message: "Chỉ có thể xóa đơn hàng ở trạng thái 'draft'!"
            });
        }

        orderData.deleted = true;
        orderData.deletedAt = new Date();
        await orderData.save();

        return res.json({
            success: true,
            message: "Xóa đơn hàng thành công!"
        });
    } catch (error: any) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Đã có lỗi xảy ra, vui lòng thử lại sau!"
        });
    }
};

// GET /api/client/orders/:id/history
// Lấy lịch sử đơn hàng
export const getOrderHistory = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req.dealerId;
        const orderId = req.params.id;

        if (!dealerId) {
            return res.status(401).json({
                success: false,
                message: "Không tìm thấy thông tin đại lý!"
            });
        }

        const order = await Order.findOne({
            _id: new mongoose.Types.ObjectId(orderId),
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        }).populate('statusHistory.changedBy', 'fullName email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đơn hàng!"
            });
        }

        const orderData = order.toObject() as any;

        const history = orderData.statusHistory.map((item: any) => ({
            status: item.status,
            changedAt: item.changedAt,
            changedBy: item.changedBy ? {
                fullName: item.changedBy.fullName,
                email: item.changedBy.email
            } : null,
            notes: item.notes
        }));

        return res.json({
            success: true,
            message: "Lấy lịch sử đơn hàng thành công!",
            data: {
                orderNumber: orderData.orderNumber,
                currentStatus: orderData.status,
                history: history
            }
        });
    } catch (error: any) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Đã có lỗi xảy ra, vui lòng thử lại sau!"
        });
    }
};

