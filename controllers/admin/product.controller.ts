import { Request, Response } from 'express';
import CategoryProduct from '../../models/category-product.model';
import slugify from 'slugify';
import { buildCategoryTree } from '../../helpers/category.helper';
import { pathAdmin } from '../../configs/variable.config';
import Product from '../../models/product.model';
import { logAdminAction } from '../../helpers/log.helper';
import AttributeProduct from '../../models/attribute-product.model';

export const category = async (req: Request, res: Response) => {
    const find: {
        deleted: boolean,
        search?: RegExp
    } = {
        deleted: false
    }

    // Tìm kiếm
    if (req.query.keyword) {
        const keyword = slugify(`${req.query.keyword}`, {
            replacement: " ",
            lower: true
        });

        const keywordRegex = new RegExp(keyword, "i");
        find.search = keywordRegex;
    }
    // Hết Tìm kiếm

    // Phân trang
    const limitItems = 20;
    let page = 1;
    if (req.query.page && parseInt(`${req.query.page}`) > 0) {
        page = parseInt(`${req.query.page}`);
    }

    const totalRecords = await CategoryProduct.countDocuments(find);
    const totalPages = Math.ceil(totalRecords / limitItems);
    const skip = (page - 1) * limitItems;

    const pagination = {
        totalRecords: totalRecords,
        totalPages: totalPages,
        skip: skip
    }
    // Hết Phân trang

    const recordList: any = await CategoryProduct
        .find(find)
        .sort({
            createdAt: "desc"
        })
        .limit(limitItems)
        .skip(skip);

    for (const item of recordList) {
        if (item.parent) {
            const parent = await CategoryProduct.findOne({
                _id: item.parent
            })

            item["parentName"] = parent?.name;
        }
    }

    res.render('admin/pages/product-category', {
        pageTitle: "Quản lý danh mục sản phẩm",
        recordList: recordList,
        pagination: pagination
    });
}

export const createCategory = async (req: Request, res: Response) => {
    const categoryList = await CategoryProduct.find({
        deleted: false
    });

    const categoryTree = buildCategoryTree(categoryList);

    res.render('admin/pages/product-create-category', {
        pageTitle: "Tạo danh mục sản phẩm",
        categoryList: categoryTree
    });
}

export const createCategoryPost = async (req: Request, res: Response) => {
    try {
        const existSlug = await CategoryProduct.findOne({
            slug: req.body.slug
        });

        if (existSlug) {
            res.json({
                code: "error",
                message: "Đường dẫn đã tồn tại!"
            });

            return;
        }

        req.body.search = slugify(`${req.body.name}`, {
            replacement: " ",
            lower: true
        })

        const newRecord = new CategoryProduct(req.body);
        await newRecord.save();

        res.json({
            code: "success",
            message: "Tạo danh mục thành công"
        })
    } catch (error) {
        res.json({
            code: "error",
            message: "Dữ liệu không hợp lệ!"
        })
    }
}

export const editCategory = async (req: Request, res: Response) => {
    try {
        const categoryList = await CategoryProduct.find({
            deleted: false
        });

        const categoryTree = buildCategoryTree(categoryList);

        const id = req.params.id;

        const categoryDetail = await CategoryProduct.findOne({
            _id: id,
            deleted: false
        });

        if (!categoryDetail) {
            res.redirect(`/${pathAdmin}/product/category`);
            return;
        }

        res.render('admin/pages/product-edit-category', {
            pageTitle: "Chỉnh sửa danh mục sản phẩm",
            categoryList: categoryTree,
            categoryDetail: categoryDetail
        });
    } catch (error) {
        res.redirect(`/${pathAdmin}/product/category`);
    }
}

export const editCategoryPatch = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        const existSlug = await CategoryProduct.findOne({
            _id: { $ne: id }, // Loại trừ bản ghi có _id trùng với id truyền vào
            slug: req.body.slug
        });

        if (existSlug) {
            res.json({
                code: "error",
                message: "Đường dẫn đã tồn tại!"
            });

            return;
        }

        req.body.search = slugify(`${req.body.name}`, {
            replacement: " ",
            lower: true
        })

        await CategoryProduct.updateOne({
            _id: id,
            deleted: false
        }, req.body)

        res.json({
            code: "success",
            message: "Cập nhật thành công!"
        })
    } catch (error) {
        res.json({
            code: "error",
            message: "Dữ liệu không hợp lệ!"
        })
    }
}

export const deleteCategoryPatch = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        await CategoryProduct.updateOne({
            _id: id,
        }, {
            deleted: true,
            deletedAt: Date.now()
        })

        res.json({
            code: "success",
            message: "Xóa danh mục thành công!"
        })
    } catch (error) {
        res.json({
            code: "error",
            message: "Id không hợp lệ!"
        })
    }
}

export const create = async (req: Request, res: Response) => {
    const categoryList = await CategoryProduct.find({
        deleted: false
    });

    const categoryTree = buildCategoryTree(categoryList);

    const attributeList = await AttributeProduct.find({
        deleted: false
    })

    res.render("admin/pages/product-create", {
        pageTitle: "Tạo sản phẩm",
        categoryList: categoryTree,
        attributeList: attributeList
    })
}

export const createPost = async (req: Request, res: Response) => {
    try {
        const existSlug = await Product.findOne({
            slug: req.body.slug
        });

        if (existSlug) {
            res.json({
                code: "error",
                message: "Đường dẫn đã tồn tại!"
            });

            return;
        }

        if (req.body.position) {
            req.body.position = parseInt(req.body.position)
        } else {
            // Nếu không truyền position -> lấy position lớn nhất + 1
            const recordMaxPosition = await Product
                .findOne({})
                .sort({
                    position: "desc"
                })

            if (recordMaxPosition && recordMaxPosition.position) {
                req.body.position = recordMaxPosition.position + 1;
            }
            else {
                req.body.position = 1;
            }
        }

        req.body.category = JSON.parse(req.body.category);

        req.body.images = JSON.parse(req.body.images);

        req.body.search = slugify(`${req.body.name}`, {
            replacement: " ",
            lower: true
        })

        if (req.body.priceOld) {
            req.body.priceOld = parseInt(req.body.priceOld);
        }

        if (req.body.priceNew) {
            req.body.priceNew = parseInt(req.body.priceNew);
        } else {
            req.body.priceNew = req.body.priceOld;
        }

        if (req.body.stock) {
            req.body.stock = parseInt(req.body.stock);
        }

        req.body.attributes = JSON.parse(req.body.attributes);

        req.body.variants = JSON.parse(req.body.variants);

        req.body.tags = JSON.parse(req.body.tags);

        const newRecord = new Product(req.body);
        await newRecord.save();

        logAdminAction(req, `Đã tạo sản phẩm: ${req.body.name} (Id: ${newRecord.id})`);

        res.json({
            code: "success",
            message: "Tạo sản phẩm thành công!"
        })
    } catch (error) {
        res.json({
            code: "error",
            message: "Dữ liệu không hợp lệ!"
        })
    }
}

export const attribute = async (req: Request, res: Response) => {
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
    const totalRecord = await AttributeProduct.countDocuments(find);
    const totalPage = Math.ceil(totalRecord / limitItems);
    const skip = (page - 1) * limitItems;
    const pagination = {
        skip: skip,
        totalRecord: totalRecord,
        totalPage: totalPage
    };
    // Hết Phân trang

    const recordList: any = await AttributeProduct
        .find(find)
        .limit(limitItems)
        .skip(skip)
        .sort({
            createdAt: "desc"
        });

    res.render("admin/pages/product-attribute", {
        pageTitle: "Quản lý thuộc tính sản phẩm",
        recordList: recordList,
        pagination: pagination
    });
}

export const createAttribute = async (req: Request, res: Response) => {
    res.render("admin/pages/product-create-attribute", {
        pageTitle: "Tạo thuộc tính sản phẩm"
    });
}

export const createAttributePost = async (req: Request, res: Response) => {
    try {
        req.body.options = JSON.parse(req.body.options);

        req.body.search = slugify(`${req.body.name}`, {
            replacement: " ",
            lower: true
        });

        const newRecord = new AttributeProduct(req.body);
        await newRecord.save();

        res.json({
            code: "success",
            message: "Tạo thuộc tính thành công!"
        })
    } catch (error) {
        console.error(error);
        res.json({
            code: "error",
            message: "Dữ liệu không hợp lệ!"
        })
    }
}

export const editAttribute = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        const attributeDetail = await AttributeProduct.findOne({
            _id: id,
            deleted: false
        })

        if (!attributeDetail) {
            res.redirect(`/${pathAdmin}/product/attribute`);
            return;
        }

        res.render("admin/pages/product-edit-attribute", {
            pageTitle: "Chỉnh sửa thuộc tính sản phẩm",
            attributeDetail: attributeDetail
        });
    } catch (error) {
        console.log(error);
        res.redirect(`/${pathAdmin}/product/attribute`);
    }
}

export const editAttributePatch = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        req.body.options = JSON.parse(req.body.options);

        req.body.search = slugify(req.body.name, {
            replacement: ' ',
            lower: true,
        })

        await AttributeProduct.updateOne({
            _id: id,
            deleted: false
        }, req.body);

        res.json({
            code: "success",
            message: "Cập nhật thuộc tính thành công!"
        })
    } catch (error) {
        console.log(error);
        res.json({
            code: "error",
            message: "Dữ liệu không hợp lệ!"
        })
    }
}

export const deleteAttributePatch = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        await AttributeProduct.updateOne({
            _id: id
        }, {
            deleted: true,
            deletedAt: Date.now(),
        });

        res.json({
            code: "success",
            message: "Xóa thuộc tính thành công!"
        })
    } catch (error) {
        console.log(error);
        res.json({
            code: "error",
            message: "Id không hợp lệ!"
        })
    }
}
