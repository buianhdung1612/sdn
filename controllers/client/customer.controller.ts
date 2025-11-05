import { Response } from 'express';
import Customer from '../../models/customer.model';
import mongoose from 'mongoose';
import { RequestClient } from '../../interfaces/request.interface';
import { convertToSlug } from '../../helpers/format.helper';

// [POST] /api/client/customers/register - Đăng ký khách hàng mới (dealer tạo)
export const register = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req["dealerId"];
        const { fullName, phone, email, address, idCard, dateOfBirth, gender, customerType, companyName, taxCode, notes, source } = req.body;

        // Validate required fields
        if (!fullName || !phone) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ họ tên và số điện thoại!"
            });
        }

        // Check phone đã tồn tại chưa
        const existingCustomer = await Customer.findOne({
            phone: phone,
            deleted: false
        });

        if (existingCustomer) {
            return res.status(400).json({
                success: false,
                message: "Số điện thoại đã được đăng ký!",
                data: {
                    existingCustomerId: existingCustomer._id
                }
            });
        }

        // Tạo search field
        const search = convertToSlug(`${fullName} ${phone} ${email || ''} ${idCard || ''}`);

        // Tạo customer mới
        const customer = new Customer({
            fullName,
            phone,
            email,
            address,
            idCard,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            gender,
            customerType: customerType || "individual",
            companyName,
            taxCode,
            notes,
            source: source || "walk-in",
            dealerId: new mongoose.Types.ObjectId(dealerId),
            search,
            status: "active"
        });

        await customer.save();

        return res.status(201).json({
            success: true,
            message: "Đăng ký khách hàng thành công!",
            data: {
                customer: {
                    id: customer._id,
                    fullName: customer.fullName,
                    phone: customer.phone,
                    email: customer.email
                }
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

// [GET] /api/client/customers - Lấy danh sách khách hàng của dealer
export const getCustomerList = async (req: RequestClient, res: Response) => {
    try {
        const dealerId = req["dealerId"];
        const { page = 1, limit = 20, keyword = "", status = "", customerType = "" } = req.query;

        const pageNumber = parseInt(page as string);
        const limitNumber = parseInt(limit as string);
        const skip = (pageNumber - 1) * limitNumber;

        // Build query
        const query: any = {
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        };

        // Filter by keyword
        if (keyword) {
            query.search = new RegExp(convertToSlug(keyword as string), 'i');
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by customer type
        if (customerType) {
            query.customerType = customerType;
        }

        // Get total count
        const totalRecords = await Customer.countDocuments(query);

        // Get customers
        const customers = await Customer.find(query)
            .select('-deleted -deletedAt -search -__v')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber)
            .lean();

        return res.json({
            success: true,
            message: "Lấy danh sách khách hàng thành công!",
            data: {
                customers,
                pagination: {
                    page: pageNumber,
                    limit: limitNumber,
                    totalRecords,
                    totalPages: Math.ceil(totalRecords / limitNumber)
                }
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

// [GET] /api/client/customers/:id - Lấy chi tiết khách hàng
export const getCustomerDetail = async (req: RequestClient, res: Response) => {
    try {
        const customerId = req.params.id;
        const dealerId = req["dealerId"];

        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json({
                success: false,
                message: "ID khách hàng không hợp lệ!"
            });
        }

        const customer = await Customer.findOne({
            _id: customerId,
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        })
            .select('-deleted -deletedAt -search -__v')
            .populate('dealerId', 'name code')
            .lean();

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy khách hàng!"
            });
        }

        return res.json({
            success: true,
            message: "Lấy thông tin khách hàng thành công!",
            data: {
                customer
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

// [PATCH] /api/client/customers/:id - Cập nhật thông tin khách hàng
export const updateCustomer = async (req: RequestClient, res: Response) => {
    try {
        const customerId = req.params.id;
        const dealerId = req["dealerId"];
        const { fullName, phone, email, address, idCard, dateOfBirth, gender, customerType, companyName, taxCode, notes, source, status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json({
                success: false,
                message: "ID khách hàng không hợp lệ!"
            });
        }

        const customer = await Customer.findOne({
            _id: customerId,
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy khách hàng!"
            });
        }

        // Check phone trùng với khách khác
        if (phone && phone !== (customer as any).phone) {
            const existingCustomer = await Customer.findOne({
                phone: phone,
                _id: { $ne: customerId },
                deleted: false
            });

            if (existingCustomer) {
                return res.status(400).json({
                    success: false,
                    message: "Số điện thoại đã được sử dụng bởi khách hàng khác!"
                });
            }
        }

        // Update fields
        if (fullName !== undefined) (customer as any).fullName = fullName;
        if (phone !== undefined) (customer as any).phone = phone;
        if (email !== undefined) (customer as any).email = email;
        if (address !== undefined) (customer as any).address = address;
        if (idCard !== undefined) (customer as any).idCard = idCard;
        if (dateOfBirth !== undefined) (customer as any).dateOfBirth = new Date(dateOfBirth);
        if (gender !== undefined) (customer as any).gender = gender;
        if (customerType !== undefined) (customer as any).customerType = customerType;
        if (companyName !== undefined) (customer as any).companyName = companyName;
        if (taxCode !== undefined) (customer as any).taxCode = taxCode;
        if (notes !== undefined) (customer as any).notes = notes;
        if (source !== undefined) (customer as any).source = source;
        if (status !== undefined) (customer as any).status = status;

        // Update search field
        (customer as any).search = convertToSlug(`${(customer as any).fullName} ${(customer as any).phone} ${(customer as any).email || ''} ${(customer as any).idCard || ''}`);

        await customer.save();

        return res.json({
            success: true,
            message: "Cập nhật thông tin khách hàng thành công!",
            data: {
                customer
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

// [DELETE] /api/client/customers/:id - Xóa khách hàng (soft delete)
export const deleteCustomer = async (req: RequestClient, res: Response) => {
    try {
        const customerId = req.params.id;
        const dealerId = req["dealerId"];

        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json({
                success: false,
                message: "ID khách hàng không hợp lệ!"
            });
        }

        const customer = await Customer.findOne({
            _id: customerId,
            dealerId: new mongoose.Types.ObjectId(dealerId),
            deleted: false
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy khách hàng!"
            });
        }

        // Soft delete
        (customer as any).deleted = true;
        (customer as any).deletedAt = new Date();
        (customer as any).status = "inactive";
        await customer.save();

        return res.json({
            success: true,
            message: "Xóa khách hàng thành công!",
            data: {
                customerId: customer._id
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

