import { Request, Response } from 'express';
import { pathAdmin } from '../../configs/variable.config';
import slugify from 'slugify';
import Dealer from '../../models/dealer.model';
import AccountAdmin from '../../models/account-admin.model';
import DealerTargetSales from '../../models/dealer-target-sales.model';

export const list = async (req: Request, res: Response) => {
    const find: {
        deleted: boolean,
        search?: RegExp
    } = {
        deleted: false
    };

    // Tìm kiếm
    if (req.query.keyword) {
        const keyword = slugify(`${req.query.keyword}`, {
            replacement: ' ',
            lower: true,
        })
        const keywordRegex = new RegExp(keyword, "i");
        find.search = keywordRegex;
    }
    // Hết Tìm kiếm

    // Phân trang
    const limitItems = 20;
    let page = 1;
    if (req.query.page) {
        const currentPage = parseInt(`${req.query.page}`);
        if (currentPage > 0) {
            page = currentPage;
        }
    }
    const totalRecords = await Dealer.countDocuments(find);
    const totalPages = Math.ceil(totalRecords / limitItems);
    const skip = (page - 1) * limitItems;
    const pagination = {
        skip: skip,
        totalRecords: totalRecords,
        totalPages: totalPages
    };
    // Hết Phân trang

    const recordList: any = await Dealer
        .find(find)
        .limit(limitItems)
        .skip(skip)
        .sort({
            createdAt: "desc"
        });

    // Lấy thông tin tài khoản và chỉ tiêu cho mỗi đại lý
    const currentYear = new Date().getFullYear();
    for (const item of recordList) {
        if (item.accountId) {
            const account = await AccountAdmin.findOne({
                _id: item.accountId,
                deleted: false
            });
            item["accountInfo"] = account ? {
                fullName: account.fullName,
                email: account.email,
                status: account.status
            } : null;
        }
        
        // Lấy chỉ tiêu năm hiện tại
        const targetSales = await DealerTargetSales.findOne({
            dealerId: item._id,
            year: currentYear,
            status: "active",
            deleted: false
        });
        item["currentYearTarget"] = targetSales ? targetSales.yearlyTarget : 0;
    }

    res.render("admin/pages/dealer-list", {
        pageTitle: "Danh sách đại lý",
        recordList: recordList,
        pagination: pagination
    });
}

export const create = async (req: Request, res: Response) => {
    // Lấy danh sách tài khoản chưa gán cho đại lý nào
    const dealersWithAccounts = await Dealer.find({
        deleted: false,
        accountId: { $ne: null }
    }).select('accountId');
    
    const assignedAccountIds = dealersWithAccounts.map(d => d.accountId).filter(Boolean);
    
    const availableAccounts = await AccountAdmin.find({
        deleted: false,
        _id: { $nin: assignedAccountIds }
    }).select('fullName email');

    res.render('admin/pages/dealer-create', {
        pageTitle: "Tạo đại lý",
        availableAccounts: availableAccounts
    });
}

export const createPost = async (req: Request, res: Response) => {
    try {
        // Kiểm tra mã đại lý trùng
        const existCode = await Dealer.findOne({
            code: req.body.code,
            deleted: false
        });

        if (existCode) {
            res.json({
                code: "error",
                message: "Mã đại lý đã tồn tại!"
            });
            return;
        }

        // Kiểm tra accountId đã được sử dụng chưa
        if (req.body.accountId) {
            const existAccount = await Dealer.findOne({
                accountId: req.body.accountId,
                deleted: false
            });

            if (existAccount) {
                res.json({
                    code: "error",
                    message: "Tài khoản này đã được gán cho đại lý khác!"
                });
                return;
            }
        }

        // Tạo search string
        req.body.search = slugify(`${req.body.name} ${req.body.code}`, {
            replacement: ' ',
            lower: true,
        })

        // Xử lý contract
        if (req.body.contractNumber || req.body.contractDate) {
            req.body.contract = {
                contractNumber: req.body.contractNumber || '',
                contractDate: req.body.contractDate ? new Date(req.body.contractDate) : null,
                expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
                contractValue: req.body.contractValue ? parseInt(req.body.contractValue) : 0,
                contractType: req.body.contractType || '',
                description: req.body.contractDescription || ''
            };
        }

        // Xử lý debt
        req.body.debt = {
            currentDebt: 0,
            creditLimit: req.body.creditLimit ? parseInt(req.body.creditLimit) : 0,
            paymentHistory: []
        };

        // Xóa các trường không cần thiết
        delete req.body.contractNumber;
        delete req.body.contractDate;
        delete req.body.expiryDate;
        delete req.body.contractValue;
        delete req.body.contractType;
        delete req.body.contractDescription;
        delete req.body.creditLimit;

        const newRecord = new Dealer(req.body);
        await newRecord.save();

        res.json({
            code: "success",
            message: "Tạo đại lý thành công!"
        })
    } catch (error) {
        console.log(error);
        res.json({
            code: "error",
            message: "Dữ liệu không hợp lệ!"
        })
    }
}

export const edit = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        const dealerDetail = await Dealer.findOne({
            _id: id,
            deleted: false
        })

        if (!dealerDetail) {
            res.redirect(`/${pathAdmin}/dealer/list`);
            return;
        }

        // Lấy danh sách tài khoản chưa gán cho đại lý nào (hoặc đã gán cho đại lý này)
        const dealersWithAccounts = await Dealer.find({
            deleted: false,
            accountId: { $ne: null },
            _id: { $ne: id } // Loại trừ đại lý hiện tại
        }).select('accountId');
        
        const assignedAccountIds = dealersWithAccounts.map(d => d.accountId).filter(Boolean);
        
        const availableAccounts = await AccountAdmin.find({
            deleted: false,
            _id: { $nin: assignedAccountIds }
        }).select('fullName email');

        // Nếu đại lý đã có accountId, thêm account đó vào danh sách
        if (dealerDetail.accountId) {
            const currentAccount = await AccountAdmin.findOne({
                _id: dealerDetail.accountId,
                deleted: false
            }).select('fullName email');
            
            if (currentAccount) {
                availableAccounts.unshift(currentAccount);
            }
        }

        res.render('admin/pages/dealer-edit', {
            pageTitle: "Chỉnh sửa đại lý",
            dealerDetail: dealerDetail,
            availableAccounts: availableAccounts
        });

    } catch (error) {
        console.log(error);
        res.redirect(`/${pathAdmin}/dealer/list`);
    }
}

export const editPatch = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        const dealerDetail = await Dealer.findOne({
            _id: id,
            deleted: false
        })

        if (!dealerDetail) {
            res.json({
                code: "error",
                message: "Đại lý không tồn tại!"
            })
            return;
        }

        // Kiểm tra mã đại lý trùng (trừ đại lý hiện tại)
        const existCode = await Dealer.findOne({
            _id: { $ne: id },
            code: req.body.code,
            deleted: false
        });

        if (existCode) {
            res.json({
                code: "error",
                message: "Mã đại lý đã tồn tại!"
            });
            return;
        }

        // Kiểm tra accountId đã được sử dụng chưa (trừ đại lý hiện tại)
        if (req.body.accountId && req.body.accountId !== dealerDetail.accountId) {
            const existAccount = await Dealer.findOne({
                _id: { $ne: id },
                accountId: req.body.accountId,
                deleted: false
            });

            if (existAccount) {
                res.json({
                    code: "error",
                    message: "Tài khoản này đã được gán cho đại lý khác!"
                });
                return;
            }
        }

        // Tạo search string
        req.body.search = slugify(`${req.body.name} ${req.body.code}`, {
            replacement: ' ',
            lower: true,
        })

        // Xử lý contract
        if (req.body.contractNumber || req.body.contractDate) {
            req.body.contract = {
                contractNumber: req.body.contractNumber || dealerDetail.contract?.contractNumber || '',
                contractDate: req.body.contractDate ? new Date(req.body.contractDate) : dealerDetail.contract?.contractDate || null,
                expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : dealerDetail.contract?.expiryDate || null,
                contractValue: req.body.contractValue ? parseInt(req.body.contractValue) : dealerDetail.contract?.contractValue || 0,
                contractType: req.body.contractType || dealerDetail.contract?.contractType || '',
                description: req.body.contractDescription || dealerDetail.contract?.description || ''
            };
        }

        // Xử lý debt - chỉ cập nhật creditLimit, giữ nguyên currentDebt và paymentHistory
        if (req.body.creditLimit) {
            req.body.debt = {
                currentDebt: dealerDetail.debt?.currentDebt || 0,
                creditLimit: parseInt(req.body.creditLimit) || 0,
                paymentHistory: dealerDetail.debt?.paymentHistory || []
            };
        }

        // Xóa các trường không cần thiết
        delete req.body.contractNumber;
        delete req.body.contractDate;
        delete req.body.expiryDate;
        delete req.body.contractValue;
        delete req.body.contractType;
        delete req.body.contractDescription;
        delete req.body.creditLimit;

        await Dealer.updateOne({
            _id: id,
            deleted: false
        }, req.body);

        res.json({
            code: "success",
            message: "Cập nhật đại lý thành công!"
        })
    } catch (error) {
        console.log(error);
        res.json({
            code: "error",
            message: "Dữ liệu không hợp lệ!"
        })
    }
}

export const deletePatch = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        await Dealer.updateOne({
            _id: id,
        }, {
            deleted: true,
            deletedAt: Date.now()
        })

        res.json({
            code: "success",
            message: "Xóa đại lý thành công!"
        })
    } catch (error) {
        console.log(error);
        res.json({
            code: "error",
            message: "Id không hợp lệ!"
        })
    }
}

