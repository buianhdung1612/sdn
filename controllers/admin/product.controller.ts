import { Request, Response } from 'express';
import CategoryProduct from '../../models/category-product.model';
import slugify from 'slugify';
import { buildCategoryTree } from '../../helpers/category.helper';
import { pathAdmin } from '../../configs/variable.config';
import Product from '../../models/product.model';
import AttributeProduct from '../../models/attribute-product.model';
import { streamUpload } from '../../helpers/streamUpload.helper';

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

export const uploadImage = async (req: Request, res: Response) => {
    try {
        const file = (req as any).file as Express.Multer.File | undefined;
        if (!file) {
            res.json({
                code: "error",
                message: "Không có file được upload!"
            });
            return;
        }

        const result = await streamUpload(file.buffer) as { url: string };
        
        res.json({
            code: "success",
            url: result.url
        });
    } catch (error) {
        console.error("Upload image error:", error);
        res.json({
            code: "error",
            message: "Upload ảnh thất bại!"
        });
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

        // images đã được upload từ FE, là mảng URL
        if (typeof req.body.images === 'string') {
            try { 
                req.body.images = JSON.parse(req.body.images); 
            } catch (e) { 
                req.body.images = []; 
            }
        }
        if (!Array.isArray(req.body.images)) {
            req.body.images = [];
        }

        req.body.search = slugify(`${req.body.name}`, {
            replacement: " ",
            lower: true
        })

        if (req.body.basePrice) {
            req.body.basePrice = parseInt(req.body.basePrice);
        }

        if (req.body.rangeKm) {
            req.body.rangeKm = parseInt(req.body.rangeKm);
        }

        if (req.body.batteryKWh) {
            req.body.batteryKWh = parseInt(req.body.batteryKWh);
        }

        if (req.body.maxPowerHP) {
            req.body.maxPowerHP = parseInt(req.body.maxPowerHP);
        }

        req.body.attributes = JSON.parse(req.body.attributes);

        req.body.variants = JSON.parse(req.body.variants);

        const newRecord = new Product(req.body);
        await newRecord.save();

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
    const totalRecord = await Product.countDocuments(find);
    const totalPage = Math.ceil(totalRecord / limitItems);
    const skip = (page - 1) * limitItems;
    const pagination = {
        skip: skip,
        totalRecord: totalRecord,
        totalPage: totalPage
    };
    // Hết Phân trang

    const recordList: any = await Product
        .find(find)
        .limit(limitItems)
        .skip(skip)
        .sort({
            position: "desc"
        });

    res.render("admin/pages/product-list", {
        pageTitle: "Quản lý sản phẩm",
        recordList: recordList,
        pagination: pagination
    });
}

export const detail = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        const productDetail = await Product.findOne({
            _id: id,
            deleted: false
        }).lean();

        if (!productDetail) {
            res.redirect(`/${pathAdmin}/product/list`);
            return;
        }

        // Lấy thông tin category
        const categoryIds = productDetail.category || [];
        const categories = await CategoryProduct.find({
            _id: { $in: categoryIds },
            deleted: false
        }).lean();

        // Lấy thông tin attributes
        const attributeIds = productDetail.attributes || [];
        const attributes = await AttributeProduct.find({
            _id: { $in: attributeIds },
            deleted: false
        }).lean();

        // Format variants để dễ hiển thị hơn
        const formattedVariants = (productDetail.variants || []).map((variant: any) => {
            const formattedVariant: any = {
                ...variant,
                attributeValueMap: {} // Map để dễ truy cập attributeValue theo attributeId
            };

            // Tạo map attributeValue theo attributeId
            if (variant.attributeValue && Array.isArray(variant.attributeValue)) {
                variant.attributeValue.forEach((av: any) => {
                    if (typeof av === 'object' && av !== null && av.attributeId) {
                        const attrId = typeof av.attributeId === 'string' ? av.attributeId : av.attributeId.toString();
                        formattedVariant.attributeValueMap[attrId] = av;
                    }
                });
            }

            return formattedVariant;
        });

        res.render("admin/pages/product-detail", {
            pageTitle: "Chi tiết sản phẩm",
            productDetail: {
                ...productDetail,
                variants: formattedVariants
            },
            categories: categories,
            attributes: attributes
        })
    } catch (error) {
        console.log(error)
        res.redirect(`/${pathAdmin}/product/list`);
    }
}

export const edit = async (req: Request, res: Response) => {
    try {
        const categoryList = await CategoryProduct.find({
            deleted: false
        });

        const categoryTree = buildCategoryTree(categoryList);

        const attributeList = await AttributeProduct.find({
            deleted: false
        });

        const id = req.params.id;

        const productDetail = await Product.findOne({
            _id: id,
            deleted: false
        });

        if (!productDetail) {
            res.redirect(`/${pathAdmin}/product/list`);
            return;
        }

        // Thuộc tính đã chọn
        const attributeNameList: string[] = [];
        productDetail.attributes.forEach(attrId => {
            const attributeInfo = attributeList.find(item => item.id === attrId);
            if (attributeInfo) {
                attributeNameList.push(`${attributeInfo.name}`);
            }
        });

        res.render("admin/pages/product-edit", {
            pageTitle: "Chỉnh sửa sản phẩm",
            categoryList: categoryTree,
            attributeList: attributeList,
            productDetail: productDetail,
            attributeNameList: attributeNameList
        })
    } catch (error) {
        console.log(error)
        res.redirect(`/${pathAdmin}/product/list`);
    }
}

export const editPatch = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        const productDetail = await Product.findOne({
            _id: id,
            deleted: false
        });

        if (!productDetail) {
            res.json({
                code: 'error',
                message: "Sản phẩm không tồn tại!"
            })
            return;
        }

        const existSlug = await Product.findOne({
            _id: { $ne: id },
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

        // images đã được upload từ FE, là mảng URL đầy đủ (existing + new)
        if (typeof req.body.images === 'string') {
            try { 
                req.body.images = JSON.parse(req.body.images); 
            } catch (e) { 
                req.body.images = []; 
            }
        }
        if (!Array.isArray(req.body.images)) {
            req.body.images = [];
        }

        req.body.search = slugify(`${req.body.name}`, {
            replacement: " ",
            lower: true
        })

        if (req.body.basePrice) {
            req.body.basePrice = parseInt(req.body.basePrice);
        }

        if (req.body.rangeKm) {
            req.body.rangeKm = parseInt(req.body.rangeKm);
        }

        if (req.body.batteryKWh) {
            req.body.batteryKWh = parseInt(req.body.batteryKWh);
        }

        if (req.body.maxPowerHP) {
            req.body.maxPowerHP = parseInt(req.body.maxPowerHP);
        }

        req.body.attributes = JSON.parse(req.body.attributes);

        req.body.variants = JSON.parse(req.body.variants);

        await Product.updateOne({
            _id: id,
            deleted: false
        }, req.body)

        res.json({
            code: "success",
            message: "Cập nhật sản phẩm thành công!"
        })
    } catch (error) {
        console.log(error)
        res.json({
            code: 'error',
            message: "Dữ liệu không hợp lệ!"
        })
    }
}

export const deletePatch = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        await Product.updateOne({
            _id: id
        }, {
            deleted: true,
            deletedAt: Date.now(),
        });

        res.json({
            code: "success",
            message: "Xóa sản phẩm thành công!"
        })
    } catch (error) {
        console.log(error);
        res.json({
            code: "error",
            message: "Id không hợp lệ!"
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