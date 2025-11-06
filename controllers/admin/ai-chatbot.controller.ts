import { Request, Response } from "express";
import mongoose from "mongoose";
import axios from "axios";
import Product from "../../models/product.model";
import Dealer from "../../models/dealer.model";
import DealerAllocation from "../../models/dealer-allocation.model";
import DealerInventory from "../../models/dealer-inventory.model";
import AllocationRequest from "../../models/allocation-request.model";
import DealerTargetSales from "../../models/dealer-target-sales.model";
import ChargingSession from "../../models/charging-session.model";
import ChargingStation from "../../models/charging-station.model";
import { RequestAccount } from "../../interfaces/request.interface";

/**
 * Render trang chatbot AI (Admin)
 */
export const view = (req: Request, res: Response) => {
    res.render('admin/pages/ai-chatbot', {
        pageTitle: "Chatbot AI"
    });
};

/**
 * Lấy thông tin tổng quan về hệ thống để cung cấp context cho AI (Admin)
 */
async function getSystemContext(adminId?: string) {
    const context: any = {
        systemOverview: "Hệ thống quản lý phân phối xe điện - Dashboard Admin với toàn quyền truy cập",
        databaseInfo: {}
    };

    try {
        // Thống kê tổng quan
        const totalProducts = await Product.countDocuments({ deleted: false, status: "active" });
        const totalDealers = await Dealer.countDocuments({ deleted: false, status: "active" });
        const totalAllocations = await DealerAllocation.countDocuments({ deleted: false });
        const totalInventory = await DealerInventory.aggregate([
            { $match: { deleted: false } },
            { $group: { _id: null, totalStock: { $sum: "$stock" }, totalReserved: { $sum: "$reservedStock" } } }
        ]);
        const totalRequests = await AllocationRequest.countDocuments({ deleted: false });
        const pendingRequests = await AllocationRequest.countDocuments({ deleted: false, status: "pending" });
        const totalStations = await ChargingStation.countDocuments({ deleted: false });

        context.databaseInfo = {
            totalProducts,
            totalDealers,
            totalAllocations,
            totalInventoryStock: totalInventory[0]?.totalStock || 0,
            totalReservedStock: totalInventory[0]?.totalReserved || 0,
            totalRequests,
            pendingRequests,
            totalStations,
            adminId: adminId || null
        };

        // Phân tích trạng thái phân bổ
        const allocationStatus = await DealerAllocation.aggregate([
            { $match: { deleted: false } },
            { $group: { _id: "$status", count: { $sum: 1 }, totalQuantity: { $sum: "$quantity" } } }
        ]);
        context.allocationStatus = allocationStatus;

        // Phân tích trạng thái đặt hàng
        const requestStatus = await AllocationRequest.aggregate([
            { $match: { deleted: false } },
            { $group: { _id: "$status", count: { $sum: 1 }, totalQuantity: { $sum: "$totalQuantity" } } }
        ]);
        context.requestStatus = requestStatus;

    } catch (error) {
        console.error("Error getting system context:", error);
    }

    return context;
}

/**
 * Query database dựa trên câu hỏi của user (Admin - toàn quyền)
 */
async function queryDatabase(query: string, adminId?: string): Promise<any> {
    const queryLower = query.toLowerCase();
    const results: any = {};

    try {
        // Kiểm tra tồn kho
        if (queryLower.includes("tồn kho") || queryLower.includes("inventory") || queryLower.includes("stock")) {
            const totalInventory = await DealerInventory.aggregate([
                { $match: { deleted: false } },
                { $group: { _id: "$productId", totalStock: { $sum: "$stock" }, totalReserved: { $sum: "$reservedStock" } } },
                { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
                { $unwind: "$product" },
                { $match: { "product.deleted": false } },
                { $project: { productName: "$product.name", productVersion: "$product.version", totalStock: 1, totalReserved: 1, availableStock: { $subtract: ["$totalStock", "$totalReserved"] } } },
                { $sort: { totalStock: -1 } },
                { $limit: 20 }
            ]);
            results.inventory = totalInventory;
        }

        // Kiểm tra phân bổ
        if (queryLower.includes("phân bổ") || queryLower.includes("allocation") || queryLower.includes("điều phối")) {
            const allocations = await DealerAllocation.find({ deleted: false })
                .populate("productId", "name version")
                .populate("dealerId", "name code")
                .sort({ createdAt: -1 })
                .limit(20)
                .lean();
            results.allocations = allocations;
        }

        // Kiểm tra đặt hàng
        if (queryLower.includes("đặt hàng") || queryLower.includes("request") || queryLower.includes("yêu cầu")) {
            const requests = await AllocationRequest.find({ deleted: false })
                .populate("dealerId", "name code")
                .sort({ createdAt: -1 })
                .limit(20)
                .lean();
            results.requests = requests;
        }

        // Kiểm tra sản phẩm
        if (queryLower.includes("sản phẩm") || queryLower.includes("product") || queryLower.includes("xe")) {
            const products = await Product.find({ deleted: false, status: "active" })
                .select("name version basePrice rangeKm batteryKWh maxPowerHP")
                .limit(20)
                .lean();
            results.products = products;
        }

        // Kiểm tra đại lý
        if (queryLower.includes("đại lý") || queryLower.includes("dealer")) {
            const dealers = await Dealer.find({ deleted: false, status: "active" })
                .select("name code address phone email")
                .limit(20)
                .lean();
            results.dealers = dealers;
        }

        // Kiểm tra trạm sạc
        if (queryLower.includes("trạm sạc") || queryLower.includes("station") || queryLower.includes("charging")) {
            const stations = await ChargingStation.find({ deleted: false })
                .select("name code region status location")
                .populate("chargingPoints")
                .limit(20)
                .lean();
            results.stations = stations;
        }

        // Kiểm tra doanh số / bán hàng
        if (queryLower.includes("doanh số") || queryLower.includes("sales") || queryLower.includes("bán hàng") || queryLower.includes("target")) {
            const currentYear = new Date().getFullYear();
            const targets = await DealerTargetSales.find({
                year: currentYear,
                status: "active",
                deleted: false
            }).populate("dealerId", "name code").limit(20).lean();
            results.salesTargets = targets;
        }

        // Kiểm tra phiên sạc
        if (queryLower.includes("phiên sạc") || queryLower.includes("session") || queryLower.includes("charging session")) {
            const recentSessions = await ChargingSession.find({ deleted: false })
                .populate("stationId", "name code")
                .sort({ startedAt: -1 })
                .limit(20)
                .lean();
            results.sessions = recentSessions;
        }
    } catch (error) {
        console.error("Error querying database:", error);
        results.error = "Không thể truy vấn database";
    }

    return results;
}

/**
 * Dự báo nhu cầu cho sản xuất và phân phối (Admin - toàn hệ thống)
 */
async function forecastDemandForPlanning(): Promise<any> {
    const forecast: any = {
        production: {},
        distribution: {},
        recommendations: []
    };

    try {
        const now = new Date();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        // Phân tích đặt hàng trong 30 ngày qua
        const recentRequests = await AllocationRequest.aggregate([
            {
                $match: {
                    deleted: false,
                    status: { $in: ["pending", "approved", "processing"] },
                    createdAt: { $gte: last30Days }
                }
            },
            {
                $unwind: "$items"
            },
            {
                $group: {
                    _id: "$items.productId",
                    totalQuantity: { $sum: "$items.quantity" },
                    avgQuantity: { $avg: "$items.quantity" },
                    requestsCount: { $sum: 1 },
                    urgentCount: { $sum: { $cond: [{ $eq: ["$requestType", "urgent"] }, 1, 0] } }
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $unwind: "$product"
            },
            {
                $project: {
                    productId: "$_id",
                    productName: "$product.name",
                    productVersion: "$product.version",
                    totalQuantity: 1,
                    avgQuantity: 1,
                    requestsCount: 1,
                    urgentCount: 1
                }
            },
            { $sort: { totalQuantity: -1 } }
        ]);

        forecast.production = {
            recentDemand: recentRequests,
            trend: "Tăng/giảm dựa trên đơn đặt hàng gần đây",
            recommendation: "Ưu tiên sản xuất các sản phẩm có nhu cầu cao và nhiều đơn khẩn cấp"
        };

        // Phân tích phân phối theo đại lý
        const distributionAnalysis = await DealerAllocation.aggregate([
            {
                $match: {
                    deleted: false,
                    status: { $in: ["pending", "allocated", "shipped"] },
                    createdAt: { $gte: last30Days }
                }
            },
            {
                $group: {
                    _id: "$dealerId",
                    totalQuantity: { $sum: "$quantity" },
                    pendingQuantity: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, "$quantity", 0] } },
                    allocatedQuantity: { $sum: { $cond: [{ $eq: ["$status", "allocated"] }, "$quantity", 0] } },
                    shippedQuantity: { $sum: { $cond: [{ $eq: ["$status", "shipped"] }, "$quantity", 0] } }
                }
            },
            {
                $lookup: {
                    from: "dealers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "dealer"
                }
            },
            {
                $unwind: "$dealer"
            },
            {
                $project: {
                    dealerId: "$_id",
                    dealerName: "$dealer.name",
                    dealerCode: "$dealer.code",
                    dealerRegion: "$dealer.address",
                    totalQuantity: 1,
                    pendingQuantity: 1,
                    allocatedQuantity: 1,
                    shippedQuantity: 1
                }
            },
            { $sort: { totalQuantity: -1 } }
        ]);

        forecast.distribution = {
            dealerAnalysis: distributionAnalysis,
            recommendation: "Phân bổ theo nhu cầu thực tế của từng đại lý và khu vực"
        };

        // Phân tích tồn kho toàn hệ thống
        const inventoryAnalysis = await DealerInventory.aggregate([
            { $match: { deleted: false } },
            {
                $group: {
                    _id: "$productId",
                    totalStock: { $sum: "$stock" },
                    totalReserved: { $sum: "$reservedStock" },
                    dealersCount: { $sum: 1 },
                    avgStockPerDealer: { $avg: "$stock" }
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $unwind: "$product"
            },
            {
                $project: {
                    productId: "$_id",
                    productName: "$product.name",
                    productVersion: "$product.version",
                    totalStock: 1,
                    totalReserved: 1,
                    availableStock: { $subtract: ["$totalStock", "$totalReserved"] },
                    dealersCount: 1,
                    avgStockPerDealer: 1
                }
            },
            { $sort: { totalStock: -1 } }
        ]);

        forecast.inventory = {
            analysis: inventoryAnalysis,
            recommendation: "Theo dõi tồn kho để tránh thiếu hụt hoặc tồn đọng quá mức"
        };

        // Phân tích xu hướng dài hạn (90 ngày)
        const longTermTrend = await AllocationRequest.aggregate([
            {
                $match: {
                    deleted: false,
                    createdAt: { $gte: last90Days }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    totalRequests: { $sum: 1 },
                    totalQuantity: { $sum: "$totalQuantity" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        forecast.trend = {
            monthlyTrend: longTermTrend,
            recommendation: "Phân tích xu hướng theo tháng để lập kế hoạch dài hạn"
        };

        // Khuyến nghị
        const lowStockProducts = inventoryAnalysis.filter((item: any) => item.availableStock < 10);
        if (lowStockProducts.length > 0) {
            forecast.recommendations.push({
                type: "warning",
                message: `Có ${lowStockProducts.length} sản phẩm đang tồn kho thấp, cần bổ sung ngay`,
                products: lowStockProducts.map((p: any) => p.productName)
            });
        }

        const highDemandProducts = recentRequests.filter((item: any) => item.totalQuantity > 50);
        if (highDemandProducts.length > 0) {
            forecast.recommendations.push({
                type: "info",
                message: `Các sản phẩm có nhu cầu cao cần ưu tiên sản xuất`,
                products: highDemandProducts.map((p: any) => p.productName)
            });
        }

    } catch (error) {
        console.error("Error forecasting demand:", error);
        forecast.error = "Không thể dự báo nhu cầu";
    }

    return forecast;
}

/**
 * Chatbot API - Giao tiếp với AI (Admin)
 */
export const chat = async (req: RequestAccount, res: Response) => {
    try {
        const { message, conversationId } = req.body;
        const adminId = req.adminId as string;

        if (!message || typeof message !== "string" || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập câu hỏi!"
            });
        }

        // Lấy context hệ thống
        const systemContext = await getSystemContext(adminId);

        // Query database nếu cần
        const dbResults = await queryDatabase(message, adminId);

        // Dự báo nhu cầu nếu user hỏi về kế hoạch sản xuất/phân phối
        const messageLower = message.toLowerCase();
        let forecastData = null;
        if (messageLower.includes("dự báo") || messageLower.includes("forecast") || 
            messageLower.includes("kế hoạch") || messageLower.includes("planning") ||
            messageLower.includes("sản xuất") || messageLower.includes("phân phối") ||
            messageLower.includes("production") || messageLower.includes("distribution")) {
            forecastData = await forecastDemandForPlanning();
        }

        // Tạo prompt cho LLM
        const contextPrompt = `
Bạn là AI chatbot hỗ trợ quản trị hệ thống quản lý phân phối xe điện SDN. Bạn có quyền truy cập toàn bộ hệ thống và có thể:

1. **Hiểu hệ thống**: Hệ thống quản lý sản phẩm (xe điện), đại lý, phân bổ, tồn kho, đặt hàng, và trạm sạc với quyền admin.

2. **Đọc database**: Bạn có thể truy vấn và trả lời về:
   - Sản phẩm (xe điện): tên, version, giá, thông số kỹ thuật
   - Đại lý: thông tin, tồn kho, đơn đặt hàng của tất cả đại lý
   - Phân bổ: trạng thái điều phối xe đến đại lý
   - Tồn kho: số lượng xe tại các đại lý (toàn hệ thống)
   - Đặt hàng: yêu cầu đặt hàng từ đại lý (tất cả đại lý)
   - Trạm sạc: thông tin và trạng thái
   - Phiên sạc: lịch sử và thống kê

3. **Dự báo nhu cầu**: Phân tích dữ liệu toàn hệ thống để đưa ra dự báo và kế hoạch sản xuất & phân phối.

4. **Khuyến nghị**: Đưa ra các khuyến nghị quản trị dựa trên dữ liệu thực tế.

**Thông tin hệ thống hiện tại:**
${JSON.stringify(systemContext, null, 2)}

**Kết quả truy vấn database:**
${JSON.stringify(dbResults, null, 2)}

${forecastData ? `**Dữ liệu dự báo nhu cầu:**\n${JSON.stringify(forecastData, null, 2)}` : ''}

**Câu hỏi của người dùng:** ${message}

Hãy trả lời câu hỏi một cách tự nhiên, chính xác và hữu ích với tư cách là admin. Sử dụng dữ liệu từ database để đưa ra câu trả lời cụ thể. Nếu người dùng hỏi về kế hoạch sản xuất/phân phối, hãy đưa ra phân tích chi tiết và khuyến nghị dựa trên dữ liệu dự báo toàn hệ thống.
`;

        // Gọi LLM API (Gemini)
        let aiResponse = "";
        
        // Kiểm tra xem có dữ liệu từ database không
        const hasDatabaseData = Object.keys(dbResults).length > 0 || forecastData !== null;
        
        if (process.env.GEMINI_API_KEY) {
            try {
                // Thử các model mới nhất theo thứ tự ưu tiên (từ nhanh đến mạnh)
                const models = [
                    "gemini-2.5-flash",        // Best balance - nhanh và hiệu quả
                    "gemini-2.5-flash-lite",   // Nhanh nhất và rẻ nhất
                    "gemini-2.0-flash",        // Thế hệ trước
                    "gemini-2.0-flash-lite",   // Fast và cost-effective
                    "gemini-2.5-pro"           // Mạnh nhất cho phức tạp
                ];
                let lastError: any = null;
                let success = false;
                
                modelLoop: for (const model of models) {
                    // Thử cả v1 và v1beta
                    const endpoints = [
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
                        `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`
                    ];
                    
                    for (const url of endpoints) {
                        try {
                            const body = {
                                contents: [{
                                    parts: [{ text: contextPrompt }]
                                }],
                                generationConfig: {
                                    temperature: 0.7,
                                    topK: 40,
                                    topP: 0.95,
                                    maxOutputTokens: 16384, // Tăng lên 16384 để tránh bị cắt (giới hạn cao nhất)
                                }
                            };

                            const response = await axios.post(url, body, {
                                timeout: 60000, // Tăng timeout lên 60s để xử lý response rất dài
                                headers: { "Content-Type": "application/json" },
                                maxContentLength: Infinity, // Không giới hạn độ dài response
                                maxBodyLength: Infinity
                            });

                            const candidate = response.data?.candidates?.[0];
                            const finishReason = candidate?.finishReason;
                            const safetyRatings = candidate?.safetyRatings;
                            aiResponse = candidate?.content?.parts?.[0]?.text || "";
                            
                            // Log chi tiết để debug
                            console.log(`[Gemini API] Model: ${model}, Response length: ${aiResponse.length}, FinishReason: ${finishReason}`);
                            if (safetyRatings) {
                                console.log(`[Gemini API] SafetyRatings:`, safetyRatings);
                            }
                            
                            // Kiểm tra xem response có bị cắt không
                            if (finishReason === "MAX_TOKENS") {
                                console.warn(`[Gemini API] Response bị cắt do MAX_TOKENS! Độ dài hiện tại: ${aiResponse.length} ký tự`);
                                // Nếu bị cắt do MAX_TOKENS, thử tăng maxOutputTokens hoặc thông báo
                                if (aiResponse && aiResponse.trim().length > 0) {
                                    aiResponse += "\n\n*(⚠️ Lưu ý: Phản hồi có thể bị cắt do giới hạn độ dài. Vui lòng hỏi cụ thể hơn hoặc chia nhỏ câu hỏi để nhận được thông tin đầy đủ.)";
                                }
                            } else if (finishReason === "OTHER") {
                                console.warn(`[Gemini API] Response có thể bị cắt. FinishReason: ${finishReason}`);
                                if (aiResponse && aiResponse.trim().length > 0) {
                                    aiResponse += "\n\n*(Lưu ý: Phản hồi có thể chưa hoàn chỉnh. Vui lòng thử lại nếu cần.)";
                                }
                            } else if (finishReason === "STOP") {
                                console.log(`[Gemini API] Response hoàn chỉnh. FinishReason: ${finishReason}, Độ dài: ${aiResponse.length} ký tự`);
                            } else {
                                console.log(`[Gemini API] FinishReason: ${finishReason}, Độ dài response: ${aiResponse.length} ký tự`);
                            }
                            
                            if (aiResponse && aiResponse.trim().length > 0) {
                                success = true;
                                console.log(`[Gemini API] ✅ Thành công với model: ${model}, endpoint: ${url.includes('v1beta') ? 'v1beta' : 'v1'}`);
                                break modelLoop; // Thành công, break khỏi cả 2 vòng lặp
                            }
                        } catch (err: any) {
                            lastError = err;
                            const statusCode = err.response?.status;
                            const errorMessage = err.response?.data?.error?.message || err.message;
                            
                            // Log chi tiết lỗi để debug
                            console.error(`[Gemini API] Model: ${model}, Endpoint: ${url.includes('v1beta') ? 'v1beta' : 'v1'}`);
                            console.error(`[Gemini API] Status: ${statusCode}, Error: ${errorMessage}`);
                            
                            // Nếu là 404 hoặc 400 (bad request), thử endpoint/model khác
                            if (statusCode === 404 || statusCode === 400) {
                                // Tiếp tục thử endpoint tiếp theo
                                continue;
                            }
                            // Lỗi khác (401, 403, 500...) có thể là vấn đề API key hoặc server
                            // Log và tiếp tục thử model khác
                        }
                    }
                }
                
                if (!success || !aiResponse || aiResponse.trim().length === 0) {
                    const errorMsg = lastError?.response?.data?.error?.message || lastError?.message || "Không thể kết nối với Gemini API";
                    console.error("[Gemini API] Tất cả model đều thất bại. Lỗi cuối cùng:", errorMsg);
                    throw lastError || new Error(`Không thể kết nối với Gemini API. ${errorMsg}. Vui lòng kiểm tra API key, enable API trong Google Cloud Console, và kết nối mạng.`);
                }
            } catch (llmError: any) {
                console.error("LLM API error:", llmError.message);
                // Fallback response nếu LLM fail
                if (hasDatabaseData) {
                    if (Object.keys(dbResults).length > 0) {
                        aiResponse = `Dựa trên dữ liệu hệ thống (quyền admin), đây là thông tin:\n\n${JSON.stringify(dbResults, null, 2)}`;
                    } else if (forecastData) {
                        aiResponse = `Dự báo nhu cầu toàn hệ thống:\n\n${JSON.stringify(forecastData, null, 2)}`;
                    }
                } else {
                    aiResponse = "Xin chào! Tôi đã nhận được câu hỏi của bạn. Tuy nhiên, hiện tại không thể kết nối với AI service để trả lời chi tiết. Vui lòng thử lại sau hoặc hỏi về các chủ đề cụ thể như: tồn kho, phân bổ, đặt hàng, sản phẩm, đại lý để tôi có thể truy vấn database trực tiếp.";
                }
            }
        } else {
            // Không có API key, trả về dữ liệu từ database
            if (hasDatabaseData) {
                if (Object.keys(dbResults).length > 0) {
                    aiResponse = `Dựa trên dữ liệu hệ thống (quyền admin):\n\n${JSON.stringify(dbResults, null, 2)}`;
                } else if (forecastData) {
                    aiResponse = `Dự báo nhu cầu toàn hệ thống:\n\n${JSON.stringify(forecastData, null, 2)}`;
                }
            } else {
                aiResponse = `Xin chào! Tôi là AI Chatbot của hệ thống SDN. Hiện tại chưa có API key để sử dụng AI service, nhưng tôi vẫn có thể truy vấn database trực tiếp.\n\nBạn có thể hỏi tôi về:\n- Tồn kho: "Tồn kho hiện tại là bao nhiêu?"\n- Phân bổ: "Danh sách phân bổ gần đây"\n- Đặt hàng: "Các đơn đặt hàng đang chờ duyệt"\n- Sản phẩm: "Danh sách sản phẩm"\n- Đại lý: "Danh sách đại lý"\n- Dự báo: "Dự báo nhu cầu sản xuất"\n\nĐể sử dụng đầy đủ tính năng AI, vui lòng cấu hình GEMINI_API_KEY trong file .env`;
            }
        }
        
        // Đảm bảo có response
        if (!aiResponse || aiResponse.trim().length === 0) {
            aiResponse = "Xin lỗi, tôi không thể tạo phản hồi cho câu hỏi này. Vui lòng thử lại với câu hỏi khác.";
        }

        return res.json({
            success: true,
            message: "Chatbot phản hồi thành công",
            data: {
                response: aiResponse,
                conversationId: conversationId || `conv_${Date.now()}`,
                hasData: Object.keys(dbResults).length > 0 || forecastData !== null,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error: any) {
        console.error("Chatbot error:", error);
        return res.status(500).json({
            success: false,
            message: "Đã có lỗi xảy ra, vui lòng thử lại sau!",
            error: error.message
        });
    }
};

