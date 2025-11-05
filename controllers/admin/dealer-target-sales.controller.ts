import { Request, Response } from 'express';
import { pathAdmin } from '../../configs/variable.config';
import Dealer from '../../models/dealer.model';
import DealerTargetSales from '../../models/dealer-target-sales.model';

export const list = async (req: Request, res: Response) => {
    try {
        const dealerId = req.params.dealerId;

        // Kiểm tra đại lý có tồn tại không
        const dealer = await Dealer.findOne({
            _id: dealerId,
            deleted: false
        });

        if (!dealer) {
            res.redirect(`/${pathAdmin}/dealer/list`);
            return;
        }

        // Lấy danh sách chỉ tiêu
        const targetSalesList = await DealerTargetSales.find({
            dealerId: dealerId,
            deleted: false
        })
            .sort({ year: -1 }); // Sắp xếp theo năm giảm dần

        res.render("admin/pages/dealer-target-sales-list", {
            pageTitle: `Chỉ tiêu doanh số - ${dealer.name}`,
            dealer: dealer,
            targetSalesList: targetSalesList
        });
    } catch (error) {
        console.log(error);
        res.redirect(`/${pathAdmin}/dealer/list`);
    }
};

export const create = async (req: Request, res: Response) => {
    try {
        const dealerId = req.params.dealerId;

        // Kiểm tra đại lý có tồn tại không
        const dealer = await Dealer.findOne({
            _id: dealerId,
            deleted: false
        });

        if (!dealer) {
            res.redirect(`/${pathAdmin}/dealer/list`);
            return;
        }

        // Lấy danh sách các năm đã có chỉ tiêu
        const existingYears = await DealerTargetSales.find({
            dealerId: dealerId,
            deleted: false
        }).select('year');

        const usedYears = existingYears.map((item: any) => item.year);

        res.render('admin/pages/dealer-target-sales-create', {
            pageTitle: "Tạo chỉ tiêu doanh số",
            dealer: dealer,
            usedYears: usedYears
        });
    } catch (error) {
        console.log(error);
        res.redirect(`/${pathAdmin}/dealer/list`);
    }
};

export const createPost = async (req: Request, res: Response) => {
    try {
        const dealerId = req.params.dealerId;

        // Kiểm tra đại lý có tồn tại không
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

        const year = parseInt(req.body.year);
        const yearlyTarget = parseInt(req.body.yearlyTarget) || 0;

        // Kiểm tra năm đã có chỉ tiêu chưa
        const existingTarget = await DealerTargetSales.findOne({
            dealerId: dealerId,
            year: year,
            deleted: false
        });

        if (existingTarget) {
            res.json({
                code: "error",
                message: `Chỉ tiêu cho năm ${year} đã tồn tại!`
            });
            return;
        }

        // Tạo chỉ tiêu theo quý
        const quarterlyTarget = [];
        if (req.body.quarterlyTargets) {
            const quarterlyTargets = JSON.parse(req.body.quarterlyTargets);
            for (let i = 1; i <= 4; i++) {
                quarterlyTarget.push({
                    quarter: i,
                    target: quarterlyTargets[i] ? parseInt(quarterlyTargets[i]) : 0
                });
            }
        } else {
            for (let i = 1; i <= 4; i++) {
                quarterlyTarget.push({ quarter: i, target: 0 });
            }
        }

        // Tạo chỉ tiêu số chiếc theo tháng
        const monthlyTarget = [];
        if (req.body.monthlyTargets) {
            const monthlyTargets = JSON.parse(req.body.monthlyTargets);
            for (let i = 1; i <= 12; i++) {
                monthlyTarget.push({
                    month: i,
                    target: monthlyTargets[i] ? parseInt(monthlyTargets[i]) : 0
                });
            }
        } else {
            for (let i = 1; i <= 12; i++) {
                monthlyTarget.push({ month: i, target: 0 });
            }
        }

        const newTargetSales = new DealerTargetSales({
            dealerId: dealerId,
            year: year,
            yearlyTarget: yearlyTarget,
            quarterlyTarget: quarterlyTarget,
            monthlyTarget: monthlyTarget,
            note: req.body.note || '',
            createdBy: (req as any).user?.id || '',
            status: "active"
        });

        await newTargetSales.save();

        res.json({
            code: "success",
            message: "Tạo chỉ tiêu thành công!"
        });
    } catch (error) {
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
        const targetSalesId = req.params.id;

        // Kiểm tra đại lý có tồn tại không
        const dealer = await Dealer.findOne({
            _id: dealerId,
            deleted: false
        });

        if (!dealer) {
            res.redirect(`/${pathAdmin}/dealer/list`);
            return;
        }

        // Lấy chỉ tiêu
        const targetSales = await DealerTargetSales.findOne({
            _id: targetSalesId,
            dealerId: dealerId,
            deleted: false
        });

        if (!targetSales) {
            res.redirect(`/${pathAdmin}/dealer/${dealerId}/target-sales/list`);
            return;
        }

        res.render('admin/pages/dealer-target-sales-edit', {
            pageTitle: "Chỉnh sửa chỉ tiêu doanh số",
            dealer: dealer,
            targetSales: targetSales
        });
    } catch (error) {
        console.log(error);
        res.redirect(`/${pathAdmin}/dealer/list`);
    }
};

export const editPatch = async (req: Request, res: Response) => {
    try {
        const dealerId = req.params.dealerId;
        const targetSalesId = req.params.id;

        // Kiểm tra đại lý có tồn tại không
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

        // Kiểm tra chỉ tiêu có tồn tại không
        const targetSales = await DealerTargetSales.findOne({
            _id: targetSalesId,
            dealerId: dealerId,
            deleted: false
        });

        if (!targetSales) {
            res.json({
                code: "error",
                message: "Chỉ tiêu không tồn tại!"
            });
            return;
        }

        const yearlyTarget = parseInt(req.body.yearlyTarget) || 0;

        // Cập nhật chỉ tiêu theo quý
        if (req.body.quarterlyTargets) {
            const quarterlyTargets = JSON.parse(req.body.quarterlyTargets);
            // Xóa tất cả phần tử hiện có
            targetSales.quarterlyTarget.splice(0, targetSales.quarterlyTarget.length);
            // Thêm phần tử mới
            for (let i = 1; i <= 4; i++) {
                targetSales.quarterlyTarget.push({
                    quarter: i,
                    target: quarterlyTargets[i] ? parseInt(quarterlyTargets[i]) : 0
                });
            }
        }

        // Cập nhật chỉ tiêu số chiếc theo tháng
        if (req.body.monthlyTargets) {
            const monthlyTargets = JSON.parse(req.body.monthlyTargets);
            // Xóa tất cả phần tử hiện có
            targetSales.monthlyTarget.splice(0, targetSales.monthlyTarget.length);
            // Thêm phần tử mới
            for (let i = 1; i <= 12; i++) {
                targetSales.monthlyTarget.push({
                    month: i,
                    target: monthlyTargets[i] ? parseInt(monthlyTargets[i]) : 0
                });
            }
        }

        targetSales.yearlyTarget = yearlyTarget;
        targetSales.note = req.body.note || '';
        targetSales.updatedBy = (req as any).user?.id || '';

        await targetSales.save();

        res.json({
            code: "success",
            message: "Cập nhật chỉ tiêu thành công!"
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
        const targetSalesId = req.params.id;

        await DealerTargetSales.updateOne({
            _id: targetSalesId,
            dealerId: dealerId
        }, {
            deleted: true,
            deletedAt: Date.now()
        });

        res.json({
            code: "success",
            message: "Xóa chỉ tiêu thành công!"
        });
    } catch (error) {
        console.log(error);
        res.json({
            code: "error",
            message: "Id không hợp lệ!"
        });
    }
};

