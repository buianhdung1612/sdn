import { Request, Response } from 'express';
import { permissionList } from '../configs/variable.config';
import slugify from 'slugify';
import Role from '../models/role.model';

export const create = (req: Request, res: Response) => {
    res.render('pages/role-create', {
        pageTitle: "Tạo nhóm quyền",
        permissionList: permissionList
    });
}

export const createPost = async (req: Request, res: Response) => {
    try {
        req.body.permissions = JSON.parse(req.body.permissions);

        req.body.search = slugify(`${req.body.name}`, {
            replacement: " ",
            lower: true
        })

        const newRecord = new Role(req.body);
        await newRecord.save();

        res.json({
            code: "success",
            message: "Tạo nhóm quyền thành công!"
        })
    } catch (error) {
        console.log(error);
        res.json({
            code: "error",
            message: "Dữ liệu không hợp lệ!"
        })
    }
}

export const list = async (req: Request, res: Response) => {
    const find: {
        deleted: boolean,
        search?: RegExp
    } = {
        deleted: false
    };

    if (req.query.keyword) {
        const keyword = slugify(`${req.query.keyword}`, {
            replacement: ' ',
            lower: true, // Chữ thường
        })
        const keywordRegex = new RegExp(keyword, "i");
        find.search = keywordRegex;
    }

    // Phân trang
    const limitItems = 20;
    let page = 1;
    if (req.query.page) {
        const currentPage = parseInt(`${req.query.page}`);
        if (currentPage > 0) {
            page = currentPage;
        }
    }
    const totalRecords = await Role.countDocuments(find);
    const totalPages = Math.ceil(totalRecords / limitItems);
    const skip = (page - 1) * limitItems;
    const pagination = {
        skip: skip,
        totalRecords: totalRecords,
        totalPages: totalPages
    };
    // Hết Phân trang

    const recordList: any = await Role
        .find(find)
        .limit(limitItems)
        .skip(skip)
        .sort({
            createdAt: "desc"
        });

    res.render("pages/role-list", {
        pageTitle: "Danh sách nhóm quyền",
        recordList: recordList,
        pagination: pagination
    });
}

export const edit = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        const roleDetail = await Role.findOne({
            _id: id,
            deleted: false
        })

        if (!roleDetail) {
            res.redirect(`/role/list`);
            return;
        }

        res.render('pages/role-edit', {
            pageTitle: "Chỉnh sửa nhóm quyền",
            roleDetail: roleDetail,
            permissionList: permissionList
        });

    } catch (error) {
        console.log(error);
        res.redirect(`/role/list`);
    }
}

export const editPatch = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        const roleDetail = await Role.findOne({
            _id: id,
            deleted: false
        })

        if (!roleDetail) {
            res.json({
                code: "error",
                message: "Nhóm quyền không tồn tại!"
            })
            return;
        }

        req.body.permissions = JSON.parse(req.body.permissions);

        req.body.search = slugify(req.body.name, {
            replacement: ' ',
            lower: true, // Chữ thường
        })

        await Role.updateOne({
            _id: id,
            deleted: false
        }, req.body);

        res.json({
            code: "success",
            message: "Cập nhật thành công!"
        })
    } catch (error) {
        console.log(error);
        res.json({
            code: "error",
            message: "Id không hợp lệ!"
        })
    }
}

export const deletePatch = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        await Role.updateOne({
            _id: id,
        }, {
            deleted: true,
            deletedAt: Date.now()
        })

        res.json({
            code: "success",
            message: "Xóa nhóm quyền thành công!"
        })
    } catch (error) {
        console.log(error);
        res.json({
            code: "error",
            message: "Id không hợp lệ!"
        })
    }
}
