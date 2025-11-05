// Khởi tạo TinyMCE
const initialTinyMCE = () => {
    tinymce.init({
        selector: '[textarea-mce]',
        plugins: [
            'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'link', 'lists', 'media', 'searchreplace', 'table', 'visualblocks', 'wordcount', 'checklist', 'casechange', 'formatpainter', 'pageembed', 'a11ychecker', 'tinymcespellchecker', 'permanentpen', 'powerpaste', 'advtable', 'advcode', 'advtemplate', 'mentions', 'tableofcontents', 'footnotes', 'mergetags', 'autocorrect', 'typography', 'inlinecss', 'markdown', 'importword', 'exportword', 'exportpdf', 'image'
        ],
        toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat | image',
        init_instance_callback: (editor) => {
            editor.on("OpenWindow", () => {
                const title = document.querySelector(".tox .tox-dialog__title")?.innerHTML;
                if (title === "Insert/Edit Media" || title === "Insert/Edit Image") {
                    const inputSource = document.querySelector(`.tox input.tox-textfield[type="url"]`);
                    inputSource.value = domainCDN;
                }
            })
        }
    });
}

initialTinyMCE();
// Hết Khởi tạo TinyMCE

// Notify
var notyf = new Notyf({
    duration: 3000,
    ripple: true,
    position: {
        x: 'right',
        y: 'top'
    },
    dismissible: true
});

const notifyData = sessionStorage.getItem("notify");
if (notifyData) {
    const { type, message } = JSON.parse(notifyData);

    if (type === "error") {
        notyf.error(message);
    } else if (type === "success") {
        notyf.success(message);
    }

    sessionStorage.removeItem("notify");
}

const drawNotify = (type, message) => {
    sessionStorage.setItem("notify", JSON.stringify({
        type,
        message
    }));
}
// End Notify

// Swal
const confirmMessage = (action, entity) => {
    const entityHTML = `<span class="swal-entity">${entity}</span>`;
    switch (action) {
        case "delete": return `Bạn có chắc muốn xóa ${entityHTML} này không?`;
        case "destroy": return `Bạn có chắc muốn xóa vĩnh viễn ${entityHTML} này không? Hành động này sẽ không thể khôi phục.`;
        case "undo": return `Bạn có muốn khôi phục ${entityHTML} này không?`;
        default: return "Bạn có chắc chắn chưa?";
    }
};

const drwaSwal = (action, entity, callback) => {
    Swal.fire({
        title: confirmMessage(action, entity),
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Có",
        cancelButtonText: `Không`,
        customClass: {
            popup: 'my-swal-popup'
        }
    }).then((result) => {
        if (result.isConfirmed && typeof callback === "function") {
            callback();
        }
    });
}
// End Swal

// articleCreateCategoryForm
const articleCreateCategoryForm = document.querySelector("#articleCreateCategoryForm");

if (articleCreateCategoryForm) {
    const validator = new JustValidate('#articleCreateCategoryForm');

    validator
        .addField('#name', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập tên danh mục',
            }
        ])
        .addField('#slug', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập đường dẫn!',
            }
        ])
        .onSuccess((event) => {
            const name = event.target.name.value;
            const slug = event.target.slug.value;
            const parent = event.target.parent.value;
            const status = event.target.status.value;
            const avatar = event.target.avatar.value;
            const description = tinymce.get("description").getContent();

            // Tạo formData
            const formData = new FormData();
            formData.append("name", name);
            formData.append("slug", slug);
            formData.append("parent", parent);
            formData.append("status", status);
            formData.append("avatar", avatar);
            formData.append("description", description);

            fetch(`/${pathAdmin}/article/category/create`, {
                method: "POST",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code === "error") {
                        notyf.error(data.message);
                    }
                    else if (data.code === "success") {
                        drawNotify(data.code, data.message);
                        location.reload();
                    }
                })
        });
}
// End articleCreateCategoryForm

// articleEditCategoryForm
const articleEditCategoryForm = document.querySelector("#articleEditCategoryForm");

if (articleEditCategoryForm) {
    const validator = new JustValidate('#articleEditCategoryForm');

    validator
        .addField('#name', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập tên danh mục',
            }
        ])
        .addField('#slug', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập đường dẫn!',
            }
        ])
        .onSuccess((event) => {
            const id = event.target.id.value;
            const name = event.target.name.value;
            const slug = event.target.slug.value;
            const parent = event.target.parent.value;
            const status = event.target.status.value;
            const avatar = event.target.avatar.value;
            const description = tinymce.get("description").getContent();

            // Tạo formData
            const formData = new FormData();
            formData.append("name", name);
            formData.append("slug", slug);
            formData.append("parent", parent);
            formData.append("status", status);
            formData.append("avatar", avatar);
            formData.append("description", description);

            fetch(`/${pathAdmin}/article/category/edit/${id}`, {
                method: "PATCH",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code === "error") {
                        notyf.error(data.message);
                    }
                    else if (data.code === "success") {
                        notyf.success(data.message);
                    }
                })
        });
}
// End articleEditCategoryForm

// btn-generate-slug
const buttonGenerateSlug = document.querySelector("[btn-generate-slug]");
if (buttonGenerateSlug) {
    buttonGenerateSlug.addEventListener("click", () => {
        const modelName = buttonGenerateSlug.getAttribute("btn-generate-slug");
        const from = buttonGenerateSlug.getAttribute("from");
        const to = buttonGenerateSlug.getAttribute("to");
        const includeVersion = buttonGenerateSlug.getAttribute("include-version") === "true";

        let string = document.querySelector(`[name="${from}"]`).value;
        
        // Nếu có include-version, thêm version vào string
        if (includeVersion) {
            const versionInput = document.querySelector(`[name="version"]`);
            if (versionInput && versionInput.value) {
                string = `${string} ${versionInput.value}`;
            }
        }

        const dataFinal = {
            string: string,
            modelName: modelName
        };

        fetch(`/${pathAdmin}/helper/generate-slug`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataFinal)
        })
            .then(res => res.json())
            .then(data => {
                if (data.code === "error") {
                    notyf.error(data.message);
                }
                else if (data.code === "success") {
                    document.querySelector(`[name="${to}"]`).value = data.slug;
                }
            })
    })
}

// Tự động generate slug khi name hoặc version thay đổi (nếu có include-version)
const productForm = document.querySelector("#productCreateForm") || document.querySelector("#productEditForm");
if (productForm) {
    const nameInput = productForm.querySelector('[name="name"]');
    const versionInput = productForm.querySelector('[name="version"]');
    const slugInput = productForm.querySelector('[name="slug"]');
    const autoSlugBtn = productForm.querySelector('[btn-generate-slug][include-version="true"]');
    
    if (autoSlugBtn && nameInput && versionInput && slugInput) {
        // Tự động generate slug khi name hoặc version thay đổi
        const autoGenerateSlug = () => {
            const name = nameInput.value.trim();
            const version = versionInput.value.trim();
            
            if (name && version) {
                const modelName = autoSlugBtn.getAttribute("btn-generate-slug");
                const string = `${name} ${version}`;
                
                const dataFinal = {
                    string: string,
                    modelName: modelName
                };

                fetch(`/${pathAdmin}/helper/generate-slug`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(dataFinal)
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.code === "success") {
                            slugInput.value = data.slug;
                        }
                    })
                    .catch(() => {
                        // Silent fail để không làm phiền user
                    });
            }
        };
        
        // Debounce để tránh gọi quá nhiều
        let timeoutId = null;
        const debouncedGenerate = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(autoGenerateSlug, 500);
        };
        
        nameInput.addEventListener('input', debouncedGenerate);
        versionInput.addEventListener('input', debouncedGenerate);
    }
}
// End btn-generate-slug

// button-api
const listButtonApi = document.querySelectorAll("[button-api]");
if (listButtonApi.length > 0) {
    listButtonApi.forEach(button => {
        button.addEventListener("click", () => {
            const method = button.getAttribute("data-method");
            const api = button.getAttribute("data-api");

            const stringButton = button.getAttribute("button-api").split('-');
            const action = stringButton[0];
            const entity = stringButton[1];

            drwaSwal(action, entity, () => {
                fetch(api, {
                    method: method || "GET"
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.code === "error") {
                            notyf.error(data.message);
                        }

                        if (data.code === "success") {
                            drawNotify(data.code, data.message);
                            location.reload();
                        }
                    })
            });
        })
    })
}
// End button-api

// form-search
const formSearch = document.querySelector("[form-search]");
if (formSearch) {
    const url = new URL(window.location.href);

    formSearch.addEventListener("submit", (e) => {
        e.preventDefault();
        const value = e.target.keyword.value;
        if (value) {
            url.searchParams.set("keyword", value);
        }
        else {
            url.searchParams.delete("keyword");
        }
        window.location.href = url.href;
    })

    // Hiển thị giá trị mặc định
    const valueCurrent = url.searchParams.get("keyword");
    if (valueCurrent) {
        formSearch.keyword.value = valueCurrent;
    }
}
// End form-search

// Pagination
const pagination = document.querySelector("[pagination]");
if (pagination) {
    const url = new URL(window.location.href);

    pagination.addEventListener("change", (e) => {
        const value = pagination.value;
        if (value) {
            url.searchParams.set("page", value);
        }
        else {
            url.searchParams.delete("page");
        }

        window.location.href = url.href;
    })

    // Hiển thị giá trị mặc định
    const valueCurrent = url.searchParams.get("page");
    if (valueCurrent) {
        pagination.value = valueCurrent > 0 ? valueCurrent : 1;
    }
}
// End Pagination

// button-copy
const listButtonCopy = document.querySelectorAll("[button-copy]");
if (listButtonCopy.length > 0) {
    listButtonCopy.forEach(button => {
        button.addEventListener("click", () => {
            const content = button.getAttribute("data-content");
            navigator.clipboard.writeText(content);
            notyf.success("Đã copy!");
        })
    })
}
// End button-copy

// Modal Preview File
const modalPreviewFile = document.querySelector("#modalPreviewFile");
if (modalPreviewFile) {
    const innerPreview = modalPreviewFile.querySelector(".inner-preview");

    // Sự kiện click button
    let buttonClicked = null;

    const listButtonPreviewFiles = document.querySelectorAll("[button-preview-file]");
    listButtonPreviewFiles.forEach(button => {
        button.addEventListener("click", () => {
            buttonClicked = button;
        })
    })

    // Sự kiện đóng modal
    modalPreviewFile.addEventListener("hidden.bs.modal", event => {
        buttonClicked = null;
        innerPreview.innerHTML = "";
    })

    // Sự kiện mở modal
    modalPreviewFile.addEventListener("shown.bs.modal", event => {
        const file = buttonClicked.getAttribute("data-file");
        const mimetype = buttonClicked.getAttribute("data-mimetype");

        // Nếu là file ảnh
        if (mimetype.includes("image")) {
            innerPreview.innerHTML = `
                <img src="${file}" width="100%" />
            `
        }
        else if (mimetype.includes("audio")) {
            innerPreview.innerHTML = `
                <audio controls>
                    <source src="${file}"/>
                </audio>
            `
        }
        else if (mimetype.includes("video")) {
            innerPreview.innerHTML = `
                <video controls width="100%">
                    <source src="${file}"/>
                </video>
            `
        }
        else if (mimetype.includes("application/pdf")) {
            innerPreview.innerHTML = `
                <iframe src="${file}" width="100%" height="600px"></iframe>
            `
        }
    })
}
// End Modal Preview File

// Modal Change File Name
const modalChangeFileName = document.querySelector("#modalChangeFileName");
if (modalChangeFileName) {
    const form = modalChangeFileName.querySelector("form");

    // Sự kiện click button
    let buttonClicked = null;

    const listButtonsChangeFileName = document.querySelectorAll("[button-change-file-name]");
    listButtonsChangeFileName.forEach(button => {
        button.addEventListener("click", () => {
            buttonClicked = button;
        })
    })

    // Sự kiện đóng modal
    modalChangeFileName.addEventListener("hidden.bs.modal", event => {
        buttonClicked = null;
        form.fileId.value = "";
        form.fileName.value = "";
    })

    // Sự kiện mở modal
    modalChangeFileName.addEventListener("shown.bs.modal", event => {
        const fileName = buttonClicked.getAttribute("data-file-name");
        form.fileName.value = fileName;
    })

    // Sự kiện submit form
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const fileId = buttonClicked.getAttribute("data-file-id");
        const fileName = form.fileName.value;

        if (!fileName) {
            notyf.error("Vui lòng nhập tên file");
            return;
        }

        if (fileId) {
            // Tạo formData
            const formData = new FormData();
            formData.append("fileName", fileName);

            fetch(`/${pathAdmin}/file-manager/change-file-name/${fileId}`, {
                method: "PATCH",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code === "error") {
                        notyf.error(data.message);
                    }

                    if (data.code === "success") {
                        drawNotify(data.code, data.message);
                        location.reload();
                    }
                })
        }
    })
}
// End Modal Change File Name

// Buton Delete File
const listButtonDeleteFile = document.querySelectorAll("[button-delete-file]");
if (listButtonDeleteFile.length > 0) {
    listButtonDeleteFile.forEach(button => {
        button.addEventListener("click", () => {
            const fileId = button.getAttribute("data-file-id");
            const fileName = button.getAttribute("data-file-name");

            drwaSwal("delete", `file: ${fileName}`, () => {
                fetch(`/${pathAdmin}/file-manager/delete-file/${fileId}`, {
                    method: "DELETE"
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.code === "error") {
                            notyf.error(data.message);
                        }

                        if (data.code === "success") {
                            drawNotify(data.code, data.message);
                            location.reload();
                        }
                    })
            })
        })
    })
}
// End Buton Delete File

// Form Create Folder
const formCreateFolder = document.querySelector("[form-create-folder]");
if (formCreateFolder) {
    formCreateFolder.addEventListener("submit", (e) => {
        e.preventDefault();
        const folderName = e.target.folderName.value;
        if (!folderName) {
            notyf.error("Vui lòng nhập tên thư mục!");
        }

        // Tạo formData
        const formData = new FormData();
        formData.append("folderName", folderName);

        const urlParams = new URLSearchParams(window.location.search);
        const folderPath = urlParams.get("folderPath");
        if (folderPath) {
            formData.append("folderPath", folderPath);
        }

        fetch(`/${pathAdmin}/file-manager/folder/create`, {
            method: "POST",
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                if (data.code === "error") {
                    notyf.error(data.message);
                }

                if (data.code === "success") {
                    drawNotify(data.code, data.message);
                    location.reload();
                }
            })
    })
}
// End Form Create Folder

// Button To Folder
const listButtonFolder = document.querySelectorAll("[button-to-folder]");
if (listButtonFolder.length > 0) {
    const url = new URL(window.location.href);

    listButtonFolder.forEach(button => {
        button.addEventListener("click", () => {
            let folderPath = button.getAttribute("data-folder-path");
            if (folderPath) {
                const urlParams = new URLSearchParams(window.location.search);
                const folderPathCurrent = urlParams.get("folderPath");

                if (folderPathCurrent) {
                    folderPath = `${folderPathCurrent}/${folderPath}`
                }

                url.searchParams.set("folderPath", folderPath);
            }
            else {
                url.searchParams.delete("folderPath");
            }
            window.location.href = url.href;
        })
    })
}
// End Button To Folder

// Breadcrumb Folder
const breadcrumbFolder = document.querySelector("[breadcrumb-folder]");
if (breadcrumbFolder) {
    const urlParams = new URLSearchParams(window.location.search);
    const folderPath = urlParams.get("folderPath") || "";
    const listFolder = folderPath.split("/") || [];

    let htmls = `
        <li class="list-group-item bg-white">
            <a href="/${pathAdmin}/file-manager">
                <i class="la la-angle-double-right text-info me-2"></i>
                Media
            </a>
        </li>
    `;

    let path = "";
    listFolder.forEach((item, index) => {
        path += (index > 0 ? "/" : "") + listFolder[index];

        htmls += `
            <li class="list-group-item bg-white">
                <a href="/${pathAdmin}/file-manager?folderPath=${path}">
                    <i class="la la-angle-double-right text-info me-2"></i>
                    ${item}
                </a>
            </li>
        `
    })

    breadcrumbFolder.innerHTML = htmls;
}
// Breadcrumb Folder

// Button Delete Folder
const listButtonDeleteFolder = document.querySelectorAll("[button-delete-folder]");
if (listButtonDeleteFolder.length > 0) {
    listButtonDeleteFolder.forEach(button => {
        button.addEventListener("click", () => {
            const urlParams = new URLSearchParams(window.location.search);
            const folderPath = urlParams.get("folderPath") || "";
            const folderName = button.getAttribute("data-folder-name");

            let folderFinal = "/media";
            if (folderPath) {
                folderFinal += `/${folderPath}`;
            }
            if (folderName) {
                folderFinal += `/${folderName}`;
            }

            drwaSwal("destroy", `thư mục: ${folderName}`, () => {
                fetch(`/${pathAdmin}/file-manager/folder/delete?folderPath=${folderFinal}`, {
                    method: "DELETE"
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.code === "error") {
                            notyf.error(data.message);
                        }

                        if (data.code === "success") {
                            drawNotify(data.code, data.message);
                            location.reload();
                        }
                    })
            })
        })
    })
}
// End Button Delete Folder

// Form Group File
const formGroupFile = document.querySelector("[form-group-file]");
if (formGroupFile) {
    const inputFile = formGroupFile.querySelector("[input-file]");
    const preivewFile = formGroupFile.querySelector("[preview-file]");

    inputFile.addEventListener("input", () => {
        const value = inputFile.value;
        preivewFile.querySelector("img").src = `${value}`;
    })

    // Hiển thị ảnh mặc định
    if (inputFile.value) {
        const value = inputFile.value;
        if (value) {
            preivewFile.querySelector("img").src = `${value}`;
        }
    }
}
// End Form Group File

// Checkbox List
const getCheckboxList = (name) => {
    const checkboxList = document.querySelector(`[checkbox-list="${name}"]`);
    const inputList = checkboxList.querySelectorAll(`input[type="checkbox"]:checked`);

    const idList = [];
    inputList.forEach(input => {
        const id = input.value;
        if (id) {
            idList.push(id);
        }
    })
    return idList;
}
// End Checkbox List

// Get Multi File
const getMultiFile = (name) => {
    const boxMultiFile = document.querySelector(`[multi-file="${name}"]`);
    const listImages = boxMultiFile.querySelectorAll(`img[src-relative]`);

    const listLink = [];
    listImages.forEach(image => {
        const link = image.getAttribute("src-relative");
        if (link) {
            listLink.push(link);
        }
    })
    return listLink;
}
// End Get Multi File

// Option List
const getOptionList = (name) => {
    const optionList = document.querySelectorAll(`[box-option="${name}"] .option-list .option-item`);
    const dataFinal = [];

    optionList.forEach(item => {
        const label = item.querySelector(".option-label").value;
        const value = item.querySelector(".option-value").value;
        if (label && value) {
            dataFinal.push({
                label: label,
                value: value
            })
        }
    })

    return dataFinal;
}
// End Option List

// Article Create Form
const articleCreateForm = document.querySelector("#articleCreateForm");

if (articleCreateForm) {
    const validator = new JustValidate('#articleCreateForm');

    validator
        .addField('#name', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập tên bài viết',
            }
        ])
        .addField('#slug', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập đường dẫn!',
            }
        ])
        .onSuccess((event) => {
            const name = event.target.name.value;
            const slug = event.target.slug.value;
            const category = getCheckboxList("category");
            const status = event.target.status.value;
            const avatar = event.target.avatar.value;
            const description = tinymce.get("description").getContent();
            const content = tinymce.get("content").getContent();

            // Tạo formData
            const formData = new FormData();
            formData.append("name", name);
            formData.append("slug", slug);
            formData.append("category", JSON.stringify(category));
            formData.append("status", status);
            formData.append("avatar", avatar);
            formData.append("description", description);
            formData.append("content", content);

            fetch(`/${pathAdmin}/article/create`, {
                method: "POST",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code === "error") {
                        notyf.error(data.message);
                    }
                    else if (data.code === "success") {
                        drawNotify(data.code, data.message);
                        location.reload();
                    }
                })
        });
}
// End Article Create Form

// Article Edit Form
const articleEditForm = document.querySelector("#articleEditForm");

if (articleEditForm) {
    const validator = new JustValidate('#articleEditForm');

    validator
        .addField('#name', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập tên bài viết',
            }
        ])
        .addField('#slug', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập đường dẫn!',
            }
        ])
        .onSuccess((event) => {
            const id = event.target.id.value;
            const name = event.target.name.value;
            const slug = event.target.slug.value;
            const category = getCheckboxList("category");
            const status = event.target.status.value;
            const avatar = event.target.avatar.value;
            const description = tinymce.get("description").getContent();
            const content = tinymce.get("content").getContent();

            // Tạo formData
            const formData = new FormData();
            formData.append("name", name);
            formData.append("slug", slug);
            formData.append("category", JSON.stringify(category));
            formData.append("status", status);
            formData.append("avatar", avatar);
            formData.append("description", description);
            formData.append("content", content);

            fetch(`/${pathAdmin}/article/edit/${id}`, {
                method: "PATCH",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code === "error") {
                        notyf.error(data.message);
                    }
                    else if (data.code === "success") {
                        notyf.success(data.message);
                    }
                })
        });
}
// End Article Edit Form

// Role Create Form
const roleCreateForm = document.querySelector("#roleCreateForm");
if (roleCreateForm) {
    const validation = new JustValidate('#roleCreateForm');

    validation
        .addField('#name', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập tên nhóm quyền!'
            }
        ])
        .onSuccess((event) => {
            const name = event.target.name.value;
            const description = event.target.description.value;
            const permissions = getCheckboxList("permissions");
            const status = event.target.status.value;

            // Tạo FormData
            const formData = new FormData();
            formData.append("name", name);
            formData.append("description", description);
            formData.append("permissions", JSON.stringify(permissions));
            formData.append("status", status);

            fetch(`/${pathAdmin}/role/create`, {
                method: "POST",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code == "error") {
                        notyf.error(data.message);
                    }

                    if (data.code == "success") {
                        drawNotify("success", data.message);
                        location.reload();
                    }
                })
        })
        ;
}
// End Role Create Form

// Role Edit Form
const roleEditForm = document.querySelector("#roleEditForm");
if (roleEditForm) {
    const validation = new JustValidate('#roleEditForm');

    validation
        .addField('#name', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập tên nhóm quyền!'
            }
        ])
        .onSuccess((event) => {
            const id = event.target.id.value;
            const name = event.target.name.value;
            const description = event.target.description.value;
            const permissions = getCheckboxList("permissions");
            const status = event.target.status.value;

            // Tạo FormData
            const formData = new FormData();
            formData.append("name", name);
            formData.append("description", description);
            formData.append("permissions", JSON.stringify(permissions));
            formData.append("status", status);

            fetch(`/${pathAdmin}/role/edit/${id}`, {
                method: "PATCH",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code == "error") {
                        notyf.error(data.message);
                    }
                    if (data.code == "success") {
                        notyf.success(data.message);
                    }
                })
        })
        ;
}
// End Role Edit Form

// Account Admin Create Form
const accountAdminCreateForm = document.querySelector("#accountAdminCreateForm");
if (accountAdminCreateForm) {
    const validation = new JustValidate('#accountAdminCreateForm');

    validation
        .addField('#fullName', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập họ tên!'
            },
            {
                rule: 'minLength',
                value: 5,
                errorMessage: 'Họ tên phải có ít nhất 5 ký tự!',
            },
            {
                rule: 'maxLength',
                value: 50,
                errorMessage: 'Họ tên không được vượt quá 50 ký tự!',
            },
        ])
        .addField('#email', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập email của bạn!',
            },
            {
                rule: 'email',
                errorMessage: 'Email không đúng định dạng!',
            },
        ])
        .addField('#password', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập mật khẩu!',
            },
            {
                validator: (value) => value.length >= 8,
                errorMessage: 'Mật khẩu phải chứa ít nhất 8 ký tự!',
            },
            {
                validator: (value) => /[A-Z]/.test(value),
                errorMessage: 'Mật khẩu phải chứa ít nhất một chữ cái in hoa!',
            },
            {
                validator: (value) => /[a-z]/.test(value),
                errorMessage: 'Mật khẩu phải chứa ít nhất một chữ cái thường!',
            },
            {
                validator: (value) => /\d/.test(value),
                errorMessage: 'Mật khẩu phải chứa ít nhất một chữ số!',
            },
            {
                validator: (value) => /[@$!%*?&]/.test(value),
                errorMessage: 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt!',
            },
        ])
        .onSuccess((event) => {
            const fullName = event.target.fullName.value;
            const email = event.target.email.value;
            const password = event.target.password.value;
            const status = event.target.status.value;
            const roles = getCheckboxList("roles");

            // Tạo FormData
            const formData = new FormData();
            formData.append("fullName", fullName);
            formData.append("email", email);
            formData.append("password", password);
            formData.append("status", status);
            formData.append("roles", JSON.stringify(roles));

            fetch(`/${pathAdmin}/account-admin/create`, {
                method: "POST",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code == "error") {
                        notyf.error(data.message);
                    }

                    if (data.code == "success") {
                        drawNotify("success", data.message);
                        location.reload();
                    }
                })
        })
        ;
}
// End Account Admin Create Form

// Account Admin Edit Form
const accountAdminEditForm = document.querySelector("#accountAdminEditForm");
if (accountAdminEditForm) {
    const validation = new JustValidate('#accountAdminEditForm');

    validation
        .addField('#fullName', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập họ tên!'
            },
            {
                rule: 'minLength',
                value: 5,
                errorMessage: 'Họ tên phải có ít nhất 5 ký tự!',
            },
            {
                rule: 'maxLength',
                value: 50,
                errorMessage: 'Họ tên không được vượt quá 50 ký tự!',
            },
        ])
        .addField('#email', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập email của bạn!',
            },
            {
                rule: 'email',
                errorMessage: 'Email không đúng định dạng!',
            },
        ])
        .onSuccess((event) => {
            const id = event.target.id.value;
            const fullName = event.target.fullName.value;
            const email = event.target.email.value;
            const status = event.target.status.value;
            const roles = getCheckboxList("roles");

            // Tạo FormData
            const formData = new FormData();
            formData.append("fullName", fullName);
            formData.append("email", email);
            formData.append("status", status);
            formData.append("roles", JSON.stringify(roles));

            fetch(`/${pathAdmin}/account-admin/edit/${id}`, {
                method: "PATCH",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code == "error") {
                        notyf.error(data.message);
                    }

                    if (data.code == "success") {
                        notyf.success(data.message);
                    }
                })
        })
        ;
}
// End Account Admin Edit Form

// Account Admin Change Password Form
const accountAdminChangePasswordForm = document.querySelector("#accountAdminChangePasswordForm");
if (accountAdminChangePasswordForm) {
    const validation = new JustValidate('#accountAdminChangePasswordForm');

    validation
        .addField('#password', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập mật khẩu!',
            },
            {
                validator: (value) => value.length >= 8,
                errorMessage: 'Mật khẩu phải chứa ít nhất 8 ký tự!',
            },
            {
                validator: (value) => /[A-Z]/.test(value),
                errorMessage: 'Mật khẩu phải chứa ít nhất một chữ cái in hoa!',
            },
            {
                validator: (value) => /[a-z]/.test(value),
                errorMessage: 'Mật khẩu phải chứa ít nhất một chữ cái thường!',
            },
            {
                validator: (value) => /\d/.test(value),
                errorMessage: 'Mật khẩu phải chứa ít nhất một chữ số!',
            },
            {
                validator: (value) => /[@$!%*?&]/.test(value),
                errorMessage: 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt!',
            },
        ])
        .onSuccess((event) => {
            const id = event.target.id.value;
            const password = event.target.password.value;

            // Tạo FormData
            const formData = new FormData();
            formData.append("password", password);

            fetch(`/${pathAdmin}/account-admin/change-password/${id}`, {
                method: "PATCH",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code == "error") {
                        notyf.error(data.message);
                    }

                    if (data.code == "success") {
                        notyf.success(data.message);
                    }
                })
        })
        ;
}
// End Account Admin Change Password Form

// Account Login Form
const accountLoginForm = document.querySelector("#accountLoginForm");
if (accountLoginForm) {
    const validation = new JustValidate('#accountLoginForm');

    validation
        .addField('#email', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập email của bạn!',
            },
            {
                rule: 'email',
                errorMessage: 'Email không đúng định dạng!',
            },
        ])
        .addField('#password', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập mật khẩu!',
            }
        ])
        .onSuccess((event) => {
            const email = event.target.email.value;
            const password = event.target.password.value;
            const rememberPassword = event.target.rememberPassword.checked;

            // Tạo FormData
            const formData = new FormData();
            formData.append("email", email);
            formData.append("password", password);
            formData.append("rememberPassword", rememberPassword);

            fetch(`/${pathAdmin}/account/login`, {
                method: "POST",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code == "error") {
                        notyf.error(data.message);
                    }

                    if (data.code == "success") {
                        drawNotify("success", data.message);
                        location.href = `/${pathAdmin}/dashboard`;
                    }
                })
        })
        ;
}
// End Account Login Form

// Dealer Create Form
const dealerCreateForm = document.querySelector("#dealerCreateForm");
if (dealerCreateForm) {
    const validation = new JustValidate('#dealerCreateForm');

    validation
        .addField('#name', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập tên đại lý!'
            }
        ])
        .addField('#code', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập mã đại lý!'
            }
        ])
        .addField('#email', [
            {
                rule: 'email',
                errorMessage: 'Email không đúng định dạng!'
            }
        ])
        .onSuccess((event) => {
            event.preventDefault();
            
            const name = event.target.name.value;
            const code = event.target.code.value;
            const address = event.target.address.value;
            const phone = event.target.phone.value;
            const email = event.target.email.value;
            const accountId = event.target.accountId.value;
            const status = event.target.status.value;
            const contractNumber = event.target.contractNumber.value;
            const contractType = event.target.contractType.value;
            const contractDate = event.target.contractDate.value;
            const expiryDate = event.target.expiryDate.value;
            const contractValue = event.target.contractValue.value;
            const contractDescription = event.target.contractDescription.value;
            const creditLimit = event.target.creditLimit.value;

            // Tạo FormData
            const formData = new FormData();
            formData.append("name", name);
            formData.append("code", code);
            formData.append("address", address);
            formData.append("phone", phone);
            formData.append("email", email);
            formData.append("accountId", accountId);
            formData.append("status", status);
            formData.append("contractNumber", contractNumber);
            formData.append("contractType", contractType);
            formData.append("contractDate", contractDate);
            formData.append("expiryDate", expiryDate);
            formData.append("contractValue", contractValue);
            formData.append("contractDescription", contractDescription);
            formData.append("creditLimit", creditLimit);

            fetch(`/${pathAdmin}/dealer/create`, {
                method: "POST",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code == "error") {
                        notyf.error(data.message);
                    }

                    if (data.code == "success") {
                        drawNotify("success", data.message);
                        location.reload();
                    }
                })
        })
}
// End Dealer Create Form

// Dealer Edit Form
const dealerEditForm = document.querySelector("#dealerEditForm");
if (dealerEditForm) {
    const validation = new JustValidate('#dealerEditForm');

    validation
        .addField('#name', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập tên đại lý!'
            }
        ])
        .addField('#code', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập mã đại lý!'
            }
        ])
        .addField('#email', [
            {
                rule: 'email',
                errorMessage: 'Email không đúng định dạng!'
            }
        ])
        .onSuccess((event) => {
            event.preventDefault();
            
            const id = event.target.id.value;
            const name = event.target.name.value;
            const code = event.target.code.value;
            const address = event.target.address.value;
            const phone = event.target.phone.value;
            const email = event.target.email.value;
            const accountId = event.target.accountId.value;
            const status = event.target.status.value;
            const contractNumber = event.target.contractNumber.value;
            const contractType = event.target.contractType.value;
            const contractDate = event.target.contractDate.value;
            const expiryDate = event.target.expiryDate.value;
            const contractValue = event.target.contractValue.value;
            const contractDescription = event.target.contractDescription.value;
            const creditLimit = event.target.creditLimit.value;

            // Tạo FormData
            const formData = new FormData();
            formData.append("name", name);
            formData.append("code", code);
            formData.append("address", address);
            formData.append("phone", phone);
            formData.append("email", email);
            formData.append("accountId", accountId);
            formData.append("status", status);
            formData.append("contractNumber", contractNumber);
            formData.append("contractType", contractType);
            formData.append("contractDate", contractDate);
            formData.append("expiryDate", expiryDate);
            formData.append("contractValue", contractValue);
            formData.append("contractDescription", contractDescription);
            formData.append("creditLimit", creditLimit);

            fetch(`/${pathAdmin}/dealer/edit/${id}`, {
                method: "PATCH",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code == "error") {
                        notyf.error(data.message);
                    }

                    if (data.code == "success") {
                        notyf.success(data.message);
                    }
                })
        })
}
// End Dealer Edit Form

// Target Sales Create Form
const targetSalesCreateForm = document.querySelector("#targetSalesCreateForm");
if (targetSalesCreateForm) {
    const validation = new JustValidate('#targetSalesCreateForm');

    validation
        .addField('#year', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn năm!'
            }
        ])
        .addField('#yearlyTarget', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập chỉ tiêu năm!'
            }
        ])
        .onSuccess((event) => {
            event.preventDefault();

            const year = event.target.year.value;
            const yearlyTarget = event.target.yearlyTarget.value;
            const quarter1 = event.target.quarter1.value || 0;
            const quarter2 = event.target.quarter2.value || 0;
            const quarter3 = event.target.quarter3.value || 0;
            const quarter4 = event.target.quarter4.value || 0;
            const note = event.target.note.value;

            // Lấy số chiếc theo tháng
            const monthlyTargets = {};
            for (let i = 1; i <= 12; i++) {
                const monthValue = event.target[`month${i}`]?.value || 0;
                monthlyTargets[i] = monthValue;
            }

            // Tạo FormData
            const formData = new FormData();
            formData.append("year", year);
            formData.append("yearlyTarget", yearlyTarget);
            formData.append("quarterlyTargets", JSON.stringify({
                1: quarter1,
                2: quarter2,
                3: quarter3,
                4: quarter4
            }));
            formData.append("monthlyTargets", JSON.stringify(monthlyTargets));
            formData.append("note", note);

            // Lấy dealerId từ URL
            const pathParts = window.location.pathname.split('/');
            const dealerIdIndex = pathParts.indexOf('dealer') + 1;
            const dealerId = pathParts[dealerIdIndex];

            fetch(`/${pathAdmin}/dealer/${dealerId}/target-sales/create`, {
                method: "POST",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code == "error") {
                        notyf.error(data.message);
                    }

                    if (data.code == "success") {
                        drawNotify("success", data.message);
                        window.location.href = `/${pathAdmin}/dealer/${dealerId}/target-sales/list`;
                    }
                })
        })
}
// End Target Sales Create Form

// Target Sales Edit Form
const targetSalesEditForm = document.querySelector("#targetSalesEditForm");
if (targetSalesEditForm) {
    const validation = new JustValidate('#targetSalesEditForm');

    validation
        .addField('#yearlyTarget', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập chỉ tiêu năm!'
            }
        ])
        .onSuccess((event) => {
            event.preventDefault();

            const id = event.target.id.value;
            const dealerId = event.target.dealerId.value;
            const yearlyTarget = event.target.yearlyTarget.value;
            const quarter1 = event.target.quarter1.value || 0;
            const quarter2 = event.target.quarter2.value || 0;
            const quarter3 = event.target.quarter3.value || 0;
            const quarter4 = event.target.quarter4.value || 0;
            const note = event.target.note.value;

            // Lấy số chiếc theo tháng
            const monthlyTargets = {};
            for (let i = 1; i <= 12; i++) {
                const monthValue = event.target[`month${i}`]?.value || 0;
                monthlyTargets[i] = monthValue;
            }

            // Tạo FormData
            const formData = new FormData();
            formData.append("yearlyTarget", yearlyTarget);
            formData.append("quarterlyTargets", JSON.stringify({
                1: quarter1,
                2: quarter2,
                3: quarter3,
                4: quarter4
            }));
            formData.append("monthlyTargets", JSON.stringify(monthlyTargets));
            formData.append("note", note);

            fetch(`/${pathAdmin}/dealer/${dealerId}/target-sales/edit/${id}`, {
                method: "PATCH",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code == "error") {
                        notyf.error(data.message);
                    }

                    if (data.code == "success") {
                        drawNotify("success", data.message);
                        window.location.href = `/${pathAdmin}/dealer/${dealerId}/target-sales/list`;
                    }
                })
        })
}
// End Target Sales Edit Form

// Allocation Create Form
const allocationCreateForm = document.querySelector("#allocationCreateForm");
if (allocationCreateForm) {
    const validation = new JustValidate('#allocationCreateForm');

    validation
        .addField('#dealerId', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn đại lý!'
            }
        ])
        .addField('#productId', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn sản phẩm!'
            }
        ])
        .addField('#variantIndex', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn biến thể!'
            }
        ])
        .addField('#quantity', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập số lượng!'
            }
        ])
        .onSuccess((event) => {
            event.preventDefault();

            const dealerId = event.target.dealerId.value;
            const productId = event.target.productId.value;
            const variantIndex = event.target.variantIndex.value;
            const quantity = event.target.quantity.value;
            const notes = event.target.notes.value;

            // Tạo FormData
            const formData = new FormData();
            formData.append("dealerId", dealerId);
            formData.append("productId", productId);
            formData.append("variantIndex", variantIndex);
            formData.append("quantity", quantity);
            formData.append("notes", notes);

            fetch(`/${pathAdmin}/dealer/allocation/create`, {
                method: "POST",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code == "error") {
                        notyf.error(data.message);
                    }

                    if (data.code == "success") {
                        drawNotify("success", data.message);
                        window.location.href = `/${pathAdmin}/dealer/allocation/list`;
                    }
                })
        })

    // Load variants khi chọn product
    const productSelect = document.getElementById('productId');
    const variantSelect = document.getElementById('variantIndex');
    const quantityInput = document.getElementById('quantity');
    const stockInfo = document.getElementById('stockInfo');
    const allocatedInfo = document.getElementById('allocatedInfo');

    if (productSelect && variantSelect) {
        productSelect.addEventListener('change', async function() {
            const productId = this.value;
            
            if (!productId) {
                variantSelect.innerHTML = '<option value="">-- Chọn sản phẩm trước --</option>';
                variantSelect.disabled = true;
                stockInfo.textContent = '';
                if (allocatedInfo) allocatedInfo.style.display = 'none';
                return;
            }

            variantSelect.disabled = true;
            variantSelect.innerHTML = '<option value="">Đang tải...</option>';

            try {
                const response = await fetch(`/${pathAdmin}/dealer/allocation/api/product-variants/${productId}`);
                const data = await response.json();

                if (data.code === "success" && data.variants) {
                    variantSelect.innerHTML = '<option value="">-- Chọn biến thể --</option>';
                    
                    data.variants.forEach((variant, index) => {
                        if (variant.status) {
                            const variantLabel = variant.attributeValue.map(a => a.label).join(' - ') || `Biến thể ${index + 1}`;
                            const stock = variant.stock || 0;
                            const option = document.createElement('option');
                            option.value = index;
                            option.textContent = `${variantLabel} (Tồn kho: ${stock.toLocaleString('vi-VN')} chiếc)`;
                            variantSelect.appendChild(option);
                        }
                    });

                    variantSelect.disabled = false;
                } else {
                    variantSelect.innerHTML = '<option value="">Không có biến thể</option>';
                    stockInfo.textContent = '';
                }
            } catch (error) {
                console.error(error);
                variantSelect.innerHTML = '<option value="">Lỗi khi tải biến thể</option>';
                stockInfo.textContent = '';
            }
        });

        // Cập nhật thông tin tồn kho khi chọn variant
        variantSelect.addEventListener('change', async function() {
            const productId = productSelect.value;
            const variantIndex = this.value;

            if (!productId || !variantIndex) {
                stockInfo.textContent = '';
                allocatedInfo.style.display = 'none';
                return;
            }

            try {
                const response = await fetch(`/${pathAdmin}/dealer/allocation/api/product-variants/${productId}`);
                const data = await response.json();

                if (data.code === "success" && data.variants[variantIndex]) {
                    const variant = data.variants[variantIndex];
                    const stock = variant.stock || 0;
                    stockInfo.textContent = `Tồn kho hiện tại: ${stock.toLocaleString('vi-VN')} chiếc`;
                    
                    if (quantityInput) {
                        quantityInput.max = stock;
                    }
                    
                    allocatedInfo.style.display = 'none';
                }
            } catch (error) {
                console.error(error);
            }
        });
    }
}
// End Allocation Create Form

// Allocation Edit Form
const allocationEditForm = document.querySelector("#allocationEditForm");
if (allocationEditForm) {
    const validation = new JustValidate('#allocationEditForm');

    // Định nghĩa hàm submit trước
    const submitAllocationForm = function(id, quantity, status, notes) {
        const formData = new FormData();
        formData.append("quantity", quantity);
        formData.append("status", status);
        formData.append("notes", notes);

        fetch(`/${pathAdmin}/dealer/allocation/edit/${id}`, {
            method: "PATCH",
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                if (data.code == "error") {
                    notyf.error(data.message);
                }

                if (data.code == "success") {
                    drawNotify("success", data.message);
                    window.location.href = `/${pathAdmin}/dealer/allocation/list`;
                }
            })
    }

    validation
        .addField('#quantity', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập số lượng!'
            }
        ])
        .addField('#status', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn trạng thái!'
            }
        ])
        .onSuccess((event) => {
            event.preventDefault();

            const id = event.target.id.value;
            const quantity = event.target.quantity.value;
            const status = event.target.status.value;
            const notes = event.target.notes.value;
            const currentStatus = document.getElementById('currentStatus')?.value || '';

            // Kiểm tra nếu đang chọn "delivered" hoặc "cancelled"
            if ((status === "delivered" || status === "cancelled") && currentStatus !== status) {
                const statusText = status === "delivered" ? "Đã nhận" : "Đã hủy";
                const warningText = status === "delivered" 
                    ? "Sau khi xác nhận trạng thái <strong>Đã nhận</strong>, bạn sẽ không thể thay đổi lại trạng thái này. Đại lý đã nhận hàng và công nợ sẽ được tính toán."
                    : "Sau khi xác nhận trạng thái <strong>Đã hủy</strong>, bạn sẽ không thể thay đổi lại trạng thái này. Tồn kho sẽ được hoàn trả.";
                
                Swal.fire({
                    title: 'Xác nhận thay đổi trạng thái',
                    html: `${warningText}<br><br><strong>Bạn có chắc chắn muốn chuyển sang trạng thái "${statusText}" không?</strong>`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Xác nhận',
                    cancelButtonText: 'Hủy',
                    confirmButtonColor: '#dc3545',
                    cancelButtonColor: '#6c757d'
                }).then((result) => {
                    if (result.isConfirmed) {
                        // Tiếp tục submit form
                        submitAllocationForm(id, quantity, status, notes);
                    }
                });
            } else {
                // Submit bình thường nếu không phải delivered/cancelled
                submitAllocationForm(id, quantity, status, notes);
            }
        })
}
// End Allocation Edit Form

// VIN Create Form
const vinCreateForm = document.querySelector("#vinCreateForm");
if (vinCreateForm) {
    const validation = new JustValidate('#vinCreateForm');
    
    // Lấy số lượng VIN cần thiết từ data attribute hoặc placeholder
    const vinsTextarea = document.getElementById('vins');
    const requiredVins = parseInt(vinsTextarea?.dataset?.requiredVins || vinsTextarea?.placeholder?.match(/\d+/)?.[0]) || 0;

    validation
        .addField('#vins', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập VIN!'
            },
            {
                validator: (value) => {
                    if (!value) return true; // required đã xử lý
                    const vins = value.split('\n')
                        .map((vin) => vin.trim().toUpperCase())
                        .filter((vin) => vin.length > 0);
                    return vins.length === requiredVins;
                },
                errorMessage: `Bạn phải nhập đúng ${requiredVins} VIN!`
            }
        ])
        .onSuccess((event) => {
            event.preventDefault();

            const vins = event.target.vins.value;
            
            // Validate lại số lượng VIN
            const vinArray = vins.split('\n')
                .map((vin) => vin.trim().toUpperCase())
                .filter((vin) => vin.length > 0);
            
            if (vinArray.length !== requiredVins) {
                notyf.error(`Bạn phải nhập đúng ${requiredVins} VIN! Bạn đã nhập ${vinArray.length} VIN.`);
                return;
            }

            // Lấy allocationId từ URL
            const pathParts = window.location.pathname.split('/');
            const allocationIdIndex = pathParts.indexOf('allocation') + 1;
            const allocationId = pathParts[allocationIdIndex];

            // Tạo FormData
            const formData = new FormData();
            formData.append("vins", vins);

            fetch(`/${pathAdmin}/dealer/allocation/${allocationId}/vins/create`, {
                method: "POST",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code == "error") {
                        notyf.error(data.message);
                    }

                    if (data.code == "success") {
                        drawNotify("success", data.message);
                        window.location.href = `/${pathAdmin}/dealer/allocation/${allocationId}/vins/list`;
                    }
                })
        })
}
// End VIN Create Form

// VIN Edit Form
const vinEditForm = document.querySelector("#vinEditForm");
if (vinEditForm) {
    const validation = new JustValidate('#vinEditForm');

    validation
        .addField('#vin', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập mã VIN!'
            }
        ])
        .onSuccess((event) => {
            event.preventDefault();

            const id = event.target.id.value;
            const vin = event.target.vin.value;
            const notes = event.target.notes.value;

            // Lấy allocationId từ URL
            const pathParts = window.location.pathname.split('/');
            const allocationIdIndex = pathParts.indexOf('allocation') + 1;
            const allocationId = pathParts[allocationIdIndex];

            // Tạo FormData
            const formData = new FormData();
            formData.append("vin", vin);
            formData.append("notes", notes);

            fetch(`/${pathAdmin}/dealer/allocation/${allocationId}/vins/edit/${id}`, {
                method: "PATCH",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code == "error") {
                        notyf.error(data.message);
                    }

                    if (data.code == "success") {
                        drawNotify("success", data.message);
                        window.location.href = `/${pathAdmin}/dealer/allocation/${allocationId}/vins/list`;
                    }
                })
        })
}
// End VIN Edit Form

// Product Create Category Form
const productCreateCategoryForm = document.querySelector("#productCreateCategoryForm");
if (productCreateCategoryForm) {
    const validation = new JustValidate('#productCreateCategoryForm');

    validation
        .addField('#name', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập tên danh mục!'
            }
        ])
        .addField('#slug', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập đường dẫn!'
            }
        ])
        .onSuccess((event) => {
            const name = event.target.name.value;
            const slug = event.target.slug.value;
            const parent = event.target.parent.value;
            const status = event.target.status.value;
            const description = tinymce.get("description").getContent();

            // Tạo FormData
            const formData = new FormData();
            formData.append("name", name);
            formData.append("slug", slug);
            formData.append("parent", parent);
            formData.append("status", status);
            formData.append("description", description);

            fetch(`/${pathAdmin}/product/category/create`, {
                method: "POST",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code == "error") {
                        notyf.error(data.message);
                    }

                    if (data.code == "success") {
                        drawNotify("success", data.message);
                        location.reload();
                    }
                })
        })
}
// End Product Create Category Form

// productEditCategoryForm
const productEditCategoryForm = document.querySelector("#productEditCategoryForm");

if (productEditCategoryForm) {
    const validator = new JustValidate('#productEditCategoryForm');

    validator
        .addField('#name', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập tên danh mục',
            }
        ])
        .addField('#slug', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập đường dẫn!',
            }
        ])
        .onSuccess((event) => {
            const id = event.target.id.value;
            const name = event.target.name.value;
            const slug = event.target.slug.value;
            const parent = event.target.parent.value;
            const status = event.target.status.value;
            const description = tinymce.get("description").getContent();

            // Tạo formData
            const formData = new FormData();
            formData.append("name", name);
            formData.append("slug", slug);
            formData.append("parent", parent);
            formData.append("status", status);
            formData.append("description", description);

            fetch(`/${pathAdmin}/product/category/edit/${id}`, {
                method: "PATCH",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code === "error") {
                        notyf.error(data.message);
                    }
                    else if (data.code === "success") {
                        notyf.success(data.message);
                    }
                })
        });
}
// End productEditCategoryForm

// Product Create Form
const productCreateForm = document.querySelector("#productCreateForm");
if (productCreateForm) {
    const validation = new JustValidate('#productCreateForm');

    validation
        .addField('#name', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập tên sản phẩm!'
            }
        ])
        .addField('#version', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập phiên bản!'
            }
        ])
        .addField('#slug', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập đường dẫn!'
            }
        ])
        .onSuccess(async (event) => {
            event.preventDefault(); // Ngăn form submit mặc định
            
            const name = event.target.name.value;
            const version = event.target.version.value;
            const slug = event.target.slug.value;
            const position = event.target.position.value;
            const status = event.target.status.value;
            const category = getCheckboxList("category");
            
            // Lấy content từ tinymce
            let content = '';
            const contentEditor = tinymce.get("content");
            if (contentEditor) {
                content = contentEditor.getContent();
            }
            
            const basePrice = event.target.basePrice.value;
            const rangeKm = event.target.rangeKm.value;
            const batteryKWh = event.target.batteryKWh.value;
            const maxPowerHP = event.target.maxPowerHP.value;
            const attributes = getCheckboxList("attributes");

            // variants
            const variants = [];
            const listTr = document.querySelectorAll("[variant-table] tbody tr");
            listTr.forEach(tr => {
                const status = tr.querySelector("input.form-check-input").checked;
                const attributeValue = JSON.parse(tr.querySelector("[attribute-value]").value);
                let priceOld = tr.querySelector("[price-old]").value;
                if (priceOld) {
                    priceOld = parseInt(priceOld);
                }
                let priceNew = tr.querySelector("[price-new]").value;
                if (priceNew) {
                    priceNew = parseInt(priceNew);
                } else {
                    priceNew = priceOld;
                }
                let stock = tr.querySelector("[stock]").value;
                if (stock) {
                    stock = parseInt(stock);
                } else {
                    stock = 0;
                }

                variants.push({
                    status: status,
                    attributeValue: attributeValue,
                    priceOld: priceOld,
                    priceNew: priceNew,
                    stock: stock
                });
            })
            // End Variants

            // Upload ảnh lên Cloudinary trước (nhiều ảnh)
            let imageUrls = [...existingImages]; // Bắt đầu với ảnh cũ
            
            if (selectedImageFiles.length > 0) {
                try {
                    // Hiển thị loading
                    const submitBtn = event.target.querySelector('button[type="submit"]');
                    const originalText = submitBtn ? submitBtn.innerHTML : '';
                    if (submitBtn) {
                        submitBtn.disabled = true;
                        submitBtn.innerHTML = `<i class="la la-spinner la-spin"></i> Đang upload ${selectedImageFiles.length} ảnh...`;
                    }

                    // Upload từng ảnh
                    const uploadPromises = selectedImageFiles.map(async (file) => {
                        const uploadFormData = new FormData();
                        uploadFormData.append("image", file);
                        
                        const uploadResponse = await fetch(`/${pathAdmin}/product/api/upload-image`, {
                            method: "POST",
                            body: uploadFormData
                        });
                        
                        const uploadData = await uploadResponse.json();
                        if (uploadData.code === "success") {
                            return uploadData.url;
                        } else {
                            throw new Error(uploadData.message || "Upload ảnh thất bại!");
                        }
                    });
                    
                    const uploadedUrls = await Promise.all(uploadPromises);
                    imageUrls = [...existingImages, ...uploadedUrls]; // Giữ nguyên thứ tự

                    // Restore button
                    if (submitBtn) {
                        submitBtn.innerHTML = originalText;
                    }
                } catch (error) {
                    console.error("Upload image error:", error);
                    notyf.error(error.message || "Upload ảnh thất bại!");
                    const submitBtn = event.target.querySelector('button[type="submit"]');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText || 'Submit';
                    }
                    return;
                }
            }

            // Tạo FormData để gửi lên BE
            const formData = new FormData();
            formData.append("name", name);
            formData.append("version", version);
            formData.append("slug", slug);
            formData.append("position", position);
            formData.append("status", status);
            formData.append("category", JSON.stringify(category));
            formData.append("content", content);
            formData.append("images", JSON.stringify(imageUrls));
            formData.append("basePrice", basePrice);
            if (rangeKm) formData.append("rangeKm", rangeKm);
            if (batteryKWh) formData.append("batteryKWh", batteryKWh);
            if (maxPowerHP) formData.append("maxPowerHP", maxPowerHP);
            formData.append("attributes", JSON.stringify(attributes));
            formData.append("variants", JSON.stringify(variants));

            // Hiển thị loading
            const submitBtn = event.target.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="la la-spinner la-spin"></i> Đang lưu...';
            }

            fetch(`/${pathAdmin}/product/create`, {
                method: "POST",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;
                    }

                    if (data.code == "error") {
                        notyf.error(data.message);
                    }

                    if (data.code == "success") {
                        drawNotify("success", data.message);
                        location.reload();
                    }
                })
                .catch(error => {
                    console.error("Error:", error);
                    notyf.error("Có lỗi xảy ra!");
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;
                    }
                });
        })
}
// End Product Create Form

// Preview ảnh sản phẩm (input#images) - nhiều ảnh
const productImagesInput = document.querySelector('#images');
let selectedImageFiles = []; // Mảng các file mới
let existingImages = []; // Mảng các URL ảnh cũ (Edit mode)

// Khởi tạo với ảnh cũ nếu có (Edit mode)
if (typeof window.productExistingImages !== 'undefined' && Array.isArray(window.productExistingImages)) {
    existingImages = [...window.productExistingImages];
}

const syncFileInputFromSelected = () => {
    if (!productImagesInput) return;
    const dt = new DataTransfer();
    selectedImageFiles.forEach(file => {
        dt.items.add(file);
    });
    productImagesInput.files = dt.files;
    // Cập nhật hiển thị số lượng tệp đã chọn
    const totalCount = existingImages.length + selectedImageFiles.length;
    const inlineText = document.querySelector('#imagesSelectedText');
    if (inlineText) {
        inlineText.value = totalCount > 0 ? `${totalCount} tệp đã chọn` : 'Không có tệp nào được chọn';
    }
};

if (productImagesInput) {
    const previewContainer = document.querySelector('#imagesPreview');
    let sortableInstance = null; // Lưu instance Sortable
    
    // Khởi tạo lại existing images từ DOM nếu có (cho edit mode)
    if (previewContainer && existingImages.length === 0) {
        const existingCols = previewContainer.querySelectorAll('[data-type="existing"]');
        existingImages = Array.from(existingCols).map(col => col.getAttribute('data-url'));
    }
    
    const addFiles = (files) => {
        if (!files || files.length === 0) return;
        
        Array.from(files).forEach(file => {
            if (file && file.type.startsWith('image/')) {
                // Kiểm tra trùng lặp theo tên file
                const isDuplicate = selectedImageFiles.some(f => f.name === file.name && f.size === file.size);
                if (!isDuplicate) {
                    selectedImageFiles.push(file);
                }
            }
        });
        
        syncFileInputFromSelected();
        renderPreviews();
        // Reset input để có thể chọn lại cùng file nếu muốn
        productImagesInput.value = '';
    };

    const renderPreviews = () => {
        if (!previewContainer) return;
        previewContainer.innerHTML = '';

        const maxSize = 5 * 1024 * 1024; // 5MB

        // Render ảnh cũ trước
        existingImages.forEach((url, index) => {
            const col = document.createElement('div');
            col.className = 'col-6 col-sm-4 col-md-3 col-lg-2';
            col.setAttribute('data-type', 'existing');
            col.setAttribute('data-url', url);
            col.setAttribute('data-index', index);

            const card = document.createElement('div');
            card.className = 'position-relative border rounded p-1 h-100 d-flex align-items-center justify-content-center bg-white';
            card.style.minHeight = '110px';

            const img = document.createElement('img');
            img.className = 'img-fluid';
            img.alt = 'Existing image';
            img.src = url;
            img.style.maxHeight = '100px';
            img.style.objectFit = 'cover';

            const btnRemove = document.createElement('button');
            btnRemove.type = 'button';
            btnRemove.className = 'btn btn-sm btn-danger position-absolute';
            btnRemove.style.top = '4px';
            btnRemove.style.right = '4px';
            btnRemove.innerHTML = '<i class="la la-trash"></i>';
            btnRemove.addEventListener('click', () => {
                existingImages = existingImages.filter((_, i) => i !== index);
                syncFileInputFromSelected();
                renderPreviews();
            });

            card.appendChild(img);
            card.appendChild(btnRemove);
            col.appendChild(card);
            previewContainer.appendChild(col);
        });

        // Render ảnh mới sau
        selectedImageFiles.forEach((file, index) => {
            const col = document.createElement('div');
            col.className = 'col-6 col-sm-4 col-md-3 col-lg-2';
            col.setAttribute('data-type', 'new');
            col.setAttribute('data-file-index', index);

            const card = document.createElement('div');
            card.className = 'position-relative border rounded p-1 h-100 d-flex align-items-center justify-content-center bg-white';
            card.style.minHeight = '110px';

            const img = document.createElement('img');
            img.className = 'img-fluid';
            img.alt = file.name;
            img.style.maxHeight = '100px';
            img.style.objectFit = 'cover';

            if (file.size > maxSize) {
                card.classList.add('border-danger');
                card.title = 'Ảnh vượt quá 5MB';
            }

            const btnRemove = document.createElement('button');
            btnRemove.type = 'button';
            btnRemove.className = 'btn btn-sm btn-danger position-absolute';
            btnRemove.style.top = '4px';
            btnRemove.style.right = '4px';
            btnRemove.innerHTML = '<i class="la la-trash"></i>';
            btnRemove.addEventListener('click', () => {
                selectedImageFiles = selectedImageFiles.filter((_, i) => i !== index);
                syncFileInputFromSelected();
                renderPreviews();
            });

            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);

            card.appendChild(img);
            card.appendChild(btnRemove);
            col.appendChild(card);
            previewContainer.appendChild(col);
        });

        // Khởi tạo Sortable để sắp xếp lại thứ tự
        if (sortableInstance) {
            sortableInstance.destroy();
        }
        sortableInstance = new Sortable(previewContainer, {
            animation: 150,
            onEnd: () => {
                // Cập nhật lại thứ tự sau khi sắp xếp
                const allCols = previewContainer.querySelectorAll('[data-type="existing"], [data-type="new"]');
                const newExistingImages = [];
                const newSelectedFiles = [];
                
                allCols.forEach((col, index) => {
                    const type = col.getAttribute('data-type');
                    if (type === 'existing') {
                        const url = col.getAttribute('data-url');
                        newExistingImages.push(url);
                    } else if (type === 'new') {
                        const fileIndex = parseInt(col.getAttribute('data-file-index'));
                        newSelectedFiles.push(selectedImageFiles[fileIndex]);
                    }
                });
                
                existingImages = newExistingImages;
                selectedImageFiles = newSelectedFiles;
                
                // Cập nhật lại data-index và data-file-index
                allCols.forEach((col, index) => {
                    const type = col.getAttribute('data-type');
                    if (type === 'existing') {
                        col.setAttribute('data-index', index);
                    } else if (type === 'new') {
                        col.setAttribute('data-file-index', index);
                    }
                });
            }
        });
    };

    // Render preview khi chọn file
    productImagesInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            addFiles(e.target.files);
        }
    });

    // Button mở hộp thoại chọn tệp
    const chooseBtn = document.querySelector('#imagesChooseBtn');
    if (chooseBtn) {
        chooseBtn.addEventListener('click', () => {
            productImagesInput.click();
        });
    }

    // Render preview ban đầu nếu có ảnh cũ
    if (existingImages.length > 0) {
        renderPreviews();
    }
}
// End preview ảnh sản phẩm

// Product Edit Form
const productEditForm = document.querySelector("#productEditForm");
if (productEditForm) {
    const validation = new JustValidate('#productEditForm');

    validation
        .addField('#name', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập tên sản phẩm!'
            }
        ])
        .addField('#version', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập phiên bản!'
            }
        ])
        .addField('#slug', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập đường dẫn!'
            }
        ])
        .onSuccess(async (event) => {
            event.preventDefault(); // Ngăn form submit mặc định
            
            const id = event.target.id.value;
            const name = event.target.name.value;
            const version = event.target.version.value;
            const slug = event.target.slug.value;
            const position = event.target.position.value;
            const status = event.target.status.value;
            const category = getCheckboxList("category");
            
            // Lấy content từ tinymce
            let content = '';
            const contentEditor = tinymce.get("content");
            if (contentEditor) {
                content = contentEditor.getContent();
            }
            
            const basePrice = event.target.basePrice ? event.target.basePrice.value : '';
            const rangeKm = event.target.rangeKm ? event.target.rangeKm.value : '';
            const batteryKWh = event.target.batteryKWh ? event.target.batteryKWh.value : '';
            const maxPowerHP = event.target.maxPowerHP ? event.target.maxPowerHP.value : '';
            const attributes = getCheckboxList("attributes");

            // variants
            const variants = [];
            const listTr = document.querySelectorAll("[variant-table] tbody tr");
            listTr.forEach(tr => {
                const status = tr.querySelector("input.form-check-input").checked;
                const attributeValue = JSON.parse(tr.querySelector("[attribute-value]").value);
                let priceOld = tr.querySelector("[price-old]").value;
                if (priceOld) {
                    priceOld = parseInt(priceOld);
                }
                let priceNew = tr.querySelector("[price-new]").value;
                if (priceNew) {
                    priceNew = parseInt(priceNew);
                } else {
                    priceNew = priceOld;
                }
                let stock = tr.querySelector("[stock]").value;
                if (stock) {
                    stock = parseInt(stock);
                } else {
                    stock = 0;
                }

                variants.push({
                    status: status,
                    attributeValue: attributeValue,
                    priceOld: priceOld,
                    priceNew: priceNew,
                    stock: stock
                });
            })
            // End Variants

            // Upload ảnh lên Cloudinary trước (nhiều ảnh)
            let imageUrls = []; // Mảng URL ảnh cuối cùng
            
            // Lấy thứ tự ảnh từ DOM (theo thứ tự trong preview)
            const previewContainer = document.querySelector('#imagesPreview');
            const submitBtnEdit = event.target.querySelector('button[type="submit"]');
            const originalTextEdit = submitBtnEdit ? submitBtnEdit.innerHTML : '';
            
            if (previewContainer) {
                const allCols = previewContainer.querySelectorAll('[data-type="existing"], [data-type="new"]');
                
                // Upload ảnh mới và lấy URL
                const uploadPromises = Array.from(allCols).map(async (col) => {
                    const type = col.getAttribute('data-type');
                    
                    if (type === 'existing') {
                        // Ảnh cũ: lấy URL trực tiếp
                        return col.getAttribute('data-url');
                    } else if (type === 'new') {
                        // Ảnh mới: cần upload
                        const fileIndex = parseInt(col.getAttribute('data-file-index'));
                        const file = selectedImageFiles[fileIndex];
                        
                        if (file) {
                            const uploadFormData = new FormData();
                            uploadFormData.append("image", file);
                            
                            const uploadResponse = await fetch(`/${pathAdmin}/product/api/upload-image`, {
                                method: "POST",
                                body: uploadFormData
                            });
                            
                            const uploadData = await uploadResponse.json();
                            if (uploadData.code === "success") {
                                return uploadData.url;
                            } else {
                                throw new Error(uploadData.message || "Upload ảnh thất bại!");
                            }
                        }
                    }
                    return null;
                });
                
                try {
                    // Hiển thị loading nếu có ảnh mới cần upload
                    const hasNewImages = previewContainer.querySelectorAll('[data-type="new"]').length > 0;
                    if (hasNewImages) {
                        if (submitBtnEdit) {
                            submitBtnEdit.disabled = true;
                            submitBtnEdit.innerHTML = '<i class="la la-spinner la-spin"></i> Đang upload ảnh...';
                        }
                        
                        imageUrls = await Promise.all(uploadPromises);
                        imageUrls = imageUrls.filter(url => url !== null); // Lọc bỏ null
                        
                        // Restore button
                        if (submitBtnEdit) {
                            submitBtnEdit.innerHTML = originalTextEdit;
                        }
                    } else {
                        // Chỉ có ảnh cũ, lấy URL trực tiếp
                        imageUrls = Array.from(allCols)
                            .map(col => col.getAttribute('data-url'))
                            .filter(url => url !== null);
                    }
                } catch (error) {
                    console.error("Upload image error:", error);
                    notyf.error(error.message || "Upload ảnh thất bại!");
                    if (submitBtnEdit) {
                        submitBtnEdit.disabled = false;
                        submitBtnEdit.innerHTML = originalTextEdit || 'Submit';
                    }
                    return;
                }
            }

            // tags
            let tags = [];
            const selectTag = document.querySelector(`select[name="tags"]`);
            if (selectTag) {
                // Nếu dùng Selectr, lấy từ Selectr instance
                const selectrInstance = selectTag.selectr;
                if (selectrInstance) {
                    tags = selectrInstance.getValue() || [];
                } else {
                    // Fallback: lấy từ selectedOptions
                    tags = Array.from(selectTag.selectedOptions).map(option => option.value);
                }
            }
            // End tags

            // Tạo FormData để gửi lên BE
            const formData = new FormData();
            formData.append("name", name);
            formData.append("version", version);
            formData.append("slug", slug);
            formData.append("position", position);
            formData.append("status", status);
            formData.append("category", JSON.stringify(category));
            formData.append("content", content);
            formData.append("images", JSON.stringify(imageUrls));
            if (basePrice) formData.append("basePrice", basePrice);
            if (rangeKm) formData.append("rangeKm", rangeKm);
            if (batteryKWh) formData.append("batteryKWh", batteryKWh);
            if (maxPowerHP) formData.append("maxPowerHP", maxPowerHP);
            formData.append("attributes", JSON.stringify(attributes));
            formData.append("variants", JSON.stringify(variants));

            // Hiển thị loading
            if (submitBtnEdit) {
                submitBtnEdit.disabled = true;
                submitBtnEdit.innerHTML = '<i class="la la-spinner la-spin"></i> Đang lưu...';
            }

            fetch(`/${pathAdmin}/product/edit/${id}`, {
                method: "PATCH",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (submitBtnEdit) {
                        submitBtnEdit.disabled = false;
                        submitBtnEdit.innerHTML = originalTextEdit;
                    }

                    if (data.code == "error") {
                        notyf.error(data.message);
                    }

                    if (data.code == "success") {
                        notyf.success(data.message);
                    }
                })
                .catch(error => {
                    console.error("Error:", error);
                    notyf.error("Có lỗi xảy ra!");
                    if (submitBtnEdit) {
                        submitBtnEdit.disabled = false;
                        submitBtnEdit.innerHTML = originalTextEdit;
                    }
                });
        })
}
// End Product Edit Form

// Checkbox Multi
const listCheckboxInput = document.querySelectorAll(".checkbox-input");
if (listCheckboxInput.length > 0) {
    const inputCheckboxAll = document.querySelector(".checkbox-all");

    inputCheckboxAll.addEventListener("change", () => {
        listCheckboxInput.forEach(input => {
            input.checked = inputCheckboxAll.checked;
        })
    })

    listCheckboxInput.forEach(input => {
        input.addEventListener("change", () => {
            const listCheckboxInputChecked = document.querySelectorAll(".checkbox-input:checked");
            if (listCheckboxInputChecked.length === listCheckboxInput.length) {
                inputCheckboxAll.checked = true;
            }
            else {
                inputCheckboxAll.checked = false;
            }
        })
    })
}
// End Checkbox Multi

// Button Copy Multi
const buttonCopyMulti = document.querySelector("[button-copy-multi]");
if (buttonCopyMulti) {
    buttonCopyMulti.addEventListener("click", () => {
        const listCheckboxInputChecked = document.querySelectorAll(".checkbox-input:checked");
        const listLink = [];
        listCheckboxInputChecked.forEach(input => {
            listLink.push(input.value);
        });
        navigator.clipboard.writeText(JSON.stringify(listLink));
        notyf.success("Đã copy!");
    })
}
// End Button Copy Multi

// Button Paste
const listButtonPaste = document.querySelectorAll("[button-paste]");
if (listButtonPaste.length > 0) {
    listButtonPaste.forEach(buttonPaste => {
        const elementListImage = buttonPaste.closest(".form-multi-file").querySelector(".inner-list-image");

        buttonPaste.addEventListener("click", async () => {
            const listLinkJson = await navigator.clipboard.readText();
            const listLink = JSON.parse(listLinkJson);
            for (const link of listLink) {
                elementListImage.insertAdjacentHTML("beforeend", `
                <div class="inner-image">
                    <img src="${link}" alt="" src-relative="${link}">
                    <span class="inner-remove">x</span>
                </div>    
            `);
            }
        })

        new Sortable(elementListImage, {
            animation: 150
        });
    })
}
// End Button Paste

// Button Remove Image
const listElementListImage = document.querySelectorAll(".form-multi-file .inner-list-image");
if (listElementListImage.length > 0) {
    listElementListImage.forEach(elementListImage => {
        elementListImage.addEventListener("click", (e) => {
            if (e.target.closest(".inner-remove")) {
                const parentItem = e.target.closest(".inner-image");
                if (parentItem) {
                    parentItem.remove();
                }
            }
        })
    })
}
// End Button Remove Image

// box-option
const boxOption = document.querySelector("[box-option]");
if (boxOption) {
    const optionList = boxOption.querySelector(".option-list");
    const optionCreate = boxOption.querySelector(".option-create");

    // Tạo option
    optionCreate.addEventListener("click", () => {
        const newItem = `
            <div class="option-item">
                <span class="btn btn-secondary option-move">
                    <i class="fa-solid fa-up-down-left-right"></i>
                </span>
                <input class="form-control option-label" type="text" placeholder="Nhãn">
                <input class="form-control option-value" type="text" placeholder="Giá trị">
                <span class="btn btn-danger option-remove">Xóa</span>
            </div>
        `;

        optionList.insertAdjacentHTML("beforeend", newItem);
    });

    // Xóa option
    optionList.addEventListener("click", (e) => {
        if (e.target.closest(".option-remove")) {
            const parentItem = e.target.closest(".option-item");
            if (parentItem) {
                parentItem.remove();
            }
        }
    })

    // Sắp xếp
    new Sortable(optionList, {
        animation: 150,
        handle: '.option-move'
    })
}
// End box-option

// Product Create Attribute Form
const productCreateAttributeForm = document.querySelector("#productCreateAttributeForm");
if (productCreateAttributeForm) {
    const validation = new JustValidate('#productCreateAttributeForm');

    validation
        .addField('#name', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập tên thuộc tính!'
            }
        ])
        .onSuccess((event) => {
            const name = event.target.name.value;
            const type = event.target.type.value;
            const options = getOptionList("options");

            // Tạo FormData
            const formData = new FormData();
            formData.append("name", name);
            formData.append("type", type);
            formData.append("options", JSON.stringify(options));

            fetch(`/${pathAdmin}/product/attribute/create`, {
                method: "POST",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code == "error") {
                        notyf.error(data.message);
                    }

                    if (data.code == "success") {
                        drawNotify("success", data.message);
                        location.reload();
                    }
                })
        })
}
// End Product Create Attribute Form

// Product Edit Attribute Form
const productEditAttributeForm = document.querySelector("#productEditAttributeForm");
if (productEditAttributeForm) {
    const validation = new JustValidate('#productEditAttributeForm');

    validation
        .addField('#name', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập tên thuộc tính!'
            }
        ])
        .onSuccess((event) => {
            const id = event.target.id.value;
            const name = event.target.name.value;
            const type = event.target.type.value;
            const options = getOptionList("options");

            // Tạo FormData
            const formData = new FormData();
            formData.append("name", name);
            formData.append("type", type);
            formData.append("options", JSON.stringify(options));

            fetch(`/${pathAdmin}/product/attribute/edit/${id}`, {
                method: "PATCH",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code == "error") {
                        notyf.error(data.message);
                    }

                    if (data.code == "success") {
                        notyf.success(data.message);
                    }
                })
        })
        ;
}
// End Product Edit Attribute Form

// button-render-variant
const generateVariants = (attributes) => {
    // Bước 1: Lấy ra danh sách các lựa chọn (options) cho từng thuộc tính
    const optionList = attributes.map(attribute =>
        attribute.options.map(option => ({
            attrId: attribute._id,
            attrType: attribute.type,
            label: option.label,
            value: option.value
        }))
    );

    // Bước 2: Tạo ra tổ hợp các biến thể
    const variantList = optionList.reduce((a, b) => a.flatMap(x => b.map(y => [...x, y])), [[]]);

    return variantList;
}

const buttonRenderVariant = document.querySelector("[button-render-variant]");
if (buttonRenderVariant) {
    buttonRenderVariant.addEventListener("click", () => {
        const attr = buttonRenderVariant.getAttribute("button-render-variant");
        const idList = getCheckboxList(attr);
        const attributeListChecked = attributeList.filter(item => idList.includes(item._id));
        const variantList = generateVariants(attributeListChecked);

        // Lấy ra bảng
        const variantTable = document.querySelector("[variant-table]");

        // Hiển thị tiêu đề cột
        const variantHead = variantTable.querySelector("thead tr");
        let variantHeadHTML = "";
        variantHeadHTML += `
            <th scope="col">Trạng thái</th>
        `;
        attributeListChecked.forEach(item => {
            variantHeadHTML += `
                <th scope="col">${item.name}</th>
            `;
        })
        variantHeadHTML += `
            <th scope="col">Giá niêm yết</th>
            <th scope="col">Giá sau chi phí phụ</th>
            <th scope="col">Còn lại</th>
        `;
        variantHead.innerHTML = variantHeadHTML;

        // Hiển thị các hàng
        const variantBody = variantTable.querySelector("tbody");
        const basePrice = document.querySelector(`[name="basePrice"]`).value;

        let variantBodyHTML = "";
        variantList.forEach(variant => {
            const variantJSON = JSON.stringify(variant).replaceAll(`"`, `&quot;`);
            let tr = "<tr>";
            tr += `
                <td>
                    <div class="form-check form-switch form-switch-success">
                        <input class="form-check-input" type="checkbox" checked="">
                    </div>
                    <input class="d-none" attribute-value value="${variantJSON}" />
                </td>
            `;
            variant.forEach(item => {
                tr += `
                    <td>${item.label}</td>
                `
            });
            tr += `
                <td>
                    <input class="form-control" type="number" value="${basePrice}" price-old>
                </td>
                <td>
                    <input class="form-control" type="number" value="${basePrice}" price-new>
                </td>
                <td>
                    <input class="form-control" type="number" stock>
                </td>
            `;
            tr += "</tr>";
            variantBodyHTML += tr;
        });
        variantBody.innerHTML = variantBodyHTML;
    })
}
// End button-render-variant

// Pricing Create Form
const pricingCreateForm = document.querySelector("#pricingCreateForm");
if (pricingCreateForm) {
    const validation = new JustValidate('#pricingCreateForm');

    validation
        .addField('#productId', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn sản phẩm!'
            }
        ])
        .addField('#variantIndex', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn biến thể!'
            }
        ])
        .addField('#wholesalePrice', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập giá sỉ!'
            }
        ])
        .addField('#effectiveDate', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn ngày hiệu lực!'
            }
        ])
        .onSuccess((event) => {
            event.preventDefault();

            const pathParts = window.location.pathname.split('/');
            const dealerIdIndex = pathParts.indexOf('dealer') + 1;
            const dealerId = pathParts[dealerIdIndex];

            const formData = new FormData(event.target);

            fetch(`/${pathAdmin}/dealer/${dealerId}/pricing/create`, {
                method: "POST",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code == "error") {
                        notyf.error(data.message);
                    }

                    if (data.code == "success") {
                        drawNotify("success", data.message);
                        window.location.href = `/${pathAdmin}/dealer/${dealerId}/pricing/list`;
                    }
                })
        })
}
// End Pricing Create Form

// Pricing Edit Form
const pricingEditForm = document.querySelector("#pricingEditForm");
if (pricingEditForm) {
    const validation = new JustValidate('#pricingEditForm');

    validation
        .addField('#variantIndex', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn biến thể!'
            }
        ])
        .addField('#wholesalePrice', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập giá sỉ!'
            }
        ])
        .addField('#effectiveDate', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn ngày hiệu lực!'
            }
        ])
        .onSuccess((event) => {
            event.preventDefault();

            const pathParts = window.location.pathname.split('/');
            const dealerIdIndex = pathParts.indexOf('dealer') + 1;
            const dealerId = pathParts[dealerIdIndex];
            const pricingId = event.target.id.value;

            const formData = new FormData(event.target);

            fetch(`/${pathAdmin}/dealer/${dealerId}/pricing/edit/${pricingId}`, {
                method: "PATCH",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code == "error") {
                        notyf.error(data.message);
                    }

                    if (data.code == "success") {
                        drawNotify("success", data.message);
                        window.location.href = `/${pathAdmin}/dealer/${dealerId}/pricing/list`;
                    }
                })
        })
}
// End Pricing Edit Form


// End Pricing Edit Form

// Discount Create Form
const discountCreateForm = document.querySelector("#discountCreateForm");
if (discountCreateForm) {
    const validation = new JustValidate('#discountCreateForm');

    validation
        .addField('#discountType', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn loại chiết khấu!'
            }
        ])
        .addField('#discountValue', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập giá trị chiết khấu!'
            }
        ])
        .addField('#applyTo', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn phạm vi áp dụng!'
            }
        ])
        .addField('#effectiveDate', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn ngày hiệu lực!'
            }
        ])
        .onSuccess((event) => {
            event.preventDefault();

            const pathParts = window.location.pathname.split('/');
            const dealerIdIndex = pathParts.indexOf('dealer') + 1;
            const dealerId = pathParts[dealerIdIndex];

            const formData = new FormData(event.target);
            
            // Xử lý productIds và categoryIds
            const productIds = formData.getAll('productIds');
            const categoryIds = formData.get('categoryIds');
            if (categoryIds) {
                formData.set('categoryIds', categoryIds.split(',').map(id => id.trim()));
            }

            fetch(`/${pathAdmin}/dealer/${dealerId}/discount/create`, {
                method: "POST",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code == "error") {
                        notyf.error(data.message);
                    }

                    if (data.code == "success") {
                        drawNotify("success", data.message);
                        window.location.href = `/${pathAdmin}/dealer/${dealerId}/discount/list`;
                    }
                })
        })
}
// End Discount Create Form

// Discount Edit Form
const discountEditForm = document.querySelector("#discountEditForm");
if (discountEditForm) {
    const validation = new JustValidate('#discountEditForm');

    validation
        .addField('#discountType', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn loại chiết khấu!'
            }
        ])
        .addField('#discountValue', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập giá trị chiết khấu!'
            }
        ])
        .addField('#applyTo', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn phạm vi áp dụng!'
            }
        ])
        .addField('#effectiveDate', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn ngày hiệu lực!'
            }
        ])
        .onSuccess((event) => {
            event.preventDefault();

            const pathParts = window.location.pathname.split('/');
            const dealerIdIndex = pathParts.indexOf('dealer') + 1;
            const dealerId = pathParts[dealerIdIndex];
            const discountId = event.target.id.value;

            const formData = new FormData(event.target);
            
            // Xử lý productIds và categoryIds
            const productIds = formData.getAll('productIds');
            const categoryIds = formData.get('categoryIds');
            if (categoryIds) {
                formData.set('categoryIds', categoryIds.split(',').map(id => id.trim()));
            }

            fetch(`/${pathAdmin}/dealer/${dealerId}/discount/edit/${discountId}`, {
                method: "PATCH",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code == "error") {
                        notyf.error(data.message);
                    }

                    if (data.code == "success") {
                        drawNotify("success", data.message);
                        window.location.href = `/${pathAdmin}/dealer/${dealerId}/discount/list`;
                    }
                })
        })
}
// End Discount Edit Form

// Promotion Create Form
const promotionCreateForm = document.querySelector("#promotionCreateForm");
if (promotionCreateForm) {
    const validation = new JustValidate('#promotionCreateForm');

    validation
        .addField('#promotionName', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập tên chương trình khuyến mãi!'
            }
        ])
        .addField('#promotionType', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn loại khuyến mãi!'
            }
        ])
        .addField('#promotionValue', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập giá trị khuyến mãi!'
            }
        ])
        .addField('#applyTo', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn phạm vi áp dụng!'
            }
        ])
        .addField('#startDate', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn ngày bắt đầu!'
            }
        ])
        .addField('#endDate', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn ngày kết thúc!'
            }
        ])
        .onSuccess((event) => {
            event.preventDefault();

            const pathParts = window.location.pathname.split('/');
            const dealerIdIndex = pathParts.indexOf('dealer') + 1;
            const dealerId = pathParts[dealerIdIndex];

            const formData = new FormData(event.target);
            
            // Xử lý productIds
            const productIds = formData.getAll('productIds');

            fetch(`/${pathAdmin}/dealer/${dealerId}/promotion/create`, {
                method: "POST",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code == "error") {
                        notyf.error(data.message);
                    }

                    if (data.code == "success") {
                        drawNotify("success", data.message);
                        window.location.href = `/${pathAdmin}/dealer/${dealerId}/promotion/list`;
                    }
                })
        })
}
// End Promotion Create Form

// Promotion Edit Form
const promotionEditForm = document.querySelector("#promotionEditForm");
if (promotionEditForm) {
    const validation = new JustValidate('#promotionEditForm');

    validation
        .addField('#promotionName', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập tên chương trình khuyến mãi!'
            }
        ])
        .addField('#promotionType', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn loại khuyến mãi!'
            }
        ])
        .addField('#promotionValue', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng nhập giá trị khuyến mãi!'
            }
        ])
        .addField('#applyTo', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn phạm vi áp dụng!'
            }
        ])
        .addField('#startDate', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn ngày bắt đầu!'
            }
        ])
        .addField('#endDate', [
            {
                rule: 'required',
                errorMessage: 'Vui lòng chọn ngày kết thúc!'
            }
        ])
        .onSuccess((event) => {
            event.preventDefault();

            const pathParts = window.location.pathname.split('/');
            const dealerIdIndex = pathParts.indexOf('dealer') + 1;
            const dealerId = pathParts[dealerIdIndex];
            const promotionId = event.target.id.value;

            const formData = new FormData(event.target);
            
            // Xử lý productIds
            const productIds = formData.getAll('productIds');

            fetch(`/${pathAdmin}/dealer/${dealerId}/promotion/edit/${promotionId}`, {
                method: "PATCH",
                body: formData
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code == "error") {
                        notyf.error(data.message);
                    }

                    if (data.code == "success") {
                        drawNotify("success", data.message);
                        window.location.href = `/${pathAdmin}/dealer/${dealerId}/promotion/list`;
                    }
                })
        })
}
// End Promotion Edit Form


