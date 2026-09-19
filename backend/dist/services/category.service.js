"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoryTree = exports.deleteCategory = exports.updateCategory = exports.getCategoryBySlug = exports.getCategoryById = exports.getActiveCategories = exports.getAllCategories = exports.createCategory = void 0;
const mongoose_1 = require("mongoose");
const Category_model_1 = __importDefault(require("../models/Category.model"));
const slug_1 = require("../utils/slug");
/* =========================================================
   UNIQUE SLUG
========================================================= */
const generateUniqueSlug = async (name, excludeId) => {
    const baseSlug = (0, slug_1.createSlug)(name);
    let slug = baseSlug;
    let counter = 2;
    while (true) {
        const query = {
            slug,
        };
        if (excludeId) {
            query._id = {
                $ne: excludeId,
            };
        }
        const existing = await Category_model_1.default.findOne(query)
            .select("_id")
            .lean();
        if (!existing) {
            return slug;
        }
        slug =
            `${baseSlug}-${counter}`;
        counter += 1;
    }
};
/* =========================================================
   PARENT INFORMATION
========================================================= */
const getParentInformation = async (parentId) => {
    if (!parentId) {
        return {
            parent: null,
            ancestors: [],
            level: 0,
        };
    }
    if (!mongoose_1.Types.ObjectId.isValid(parentId)) {
        throw new Error("Invalid parent category ID.");
    }
    const parent = await Category_model_1.default.findById(parentId);
    if (!parent) {
        throw new Error("Parent category not found.");
    }
    return {
        parent: parent._id,
        ancestors: [
            ...parent.ancestors,
            parent._id,
        ],
        level: parent.level + 1,
    };
};
/* =========================================================
   CREATE CATEGORY
========================================================= */
const createCategory = async (input) => {
    const name = input.name.trim();
    if (!name) {
        throw new Error("Category name is required.");
    }
    const slug = await generateUniqueSlug(name);
    const parentInfo = await getParentInformation(input.parentId);
    const category = await Category_model_1.default.create({
        name,
        slug,
        description: input.description
            ?.trim() ||
            "",
        parent: parentInfo.parent,
        ancestors: parentInfo.ancestors,
        level: parentInfo.level,
        image: input.image || {
            url: "",
            publicId: "",
        },
        isActive: input.isActive ??
            true,
        sortOrder: input.sortOrder ??
            0,
    });
    return category;
};
exports.createCategory = createCategory;
/* =========================================================
   GET ALL CATEGORIES
========================================================= */
const getAllCategories = async () => {
    return Category_model_1.default.find()
        .sort({
        level: 1,
        sortOrder: 1,
        name: 1,
    })
        .lean();
};
exports.getAllCategories = getAllCategories;
/* =========================================================
   GET ACTIVE CATEGORIES
========================================================= */
const getActiveCategories = async () => {
    return Category_model_1.default.find({
        isActive: true,
    })
        .sort({
        level: 1,
        sortOrder: 1,
        name: 1,
    })
        .lean();
};
exports.getActiveCategories = getActiveCategories;
/* =========================================================
   GET CATEGORY BY ID
========================================================= */
const getCategoryById = async (categoryId) => {
    if (!mongoose_1.Types.ObjectId.isValid(categoryId)) {
        throw new Error("Invalid category ID.");
    }
    const category = await Category_model_1.default.findById(categoryId);
    if (!category) {
        throw new Error("Category not found.");
    }
    return category;
};
exports.getCategoryById = getCategoryById;
/* =========================================================
   GET CATEGORY BY SLUG
========================================================= */
const getCategoryBySlug = async (slug) => {
    const category = await Category_model_1.default.findOne({
        slug: slug
            .trim()
            .toLowerCase(),
    });
    if (!category) {
        throw new Error("Category not found.");
    }
    return category;
};
exports.getCategoryBySlug = getCategoryBySlug;
/* =========================================================
   REBUILD DESCENDANTS

   Parent category change hone par children ke
   ancestors + level automatically update honge.
========================================================= */
const rebuildDescendants = async (categoryId) => {
    const descendants = await Category_model_1.default.find({
        ancestors: new mongoose_1.Types.ObjectId(categoryId),
    }).sort({
        level: 1,
    });
    for (const descendant of descendants) {
        if (!descendant.parent) {
            descendant.ancestors =
                [];
            descendant.level =
                0;
            await descendant.save();
            continue;
        }
        const parent = await Category_model_1.default.findById(descendant.parent);
        if (!parent) {
            continue;
        }
        descendant.ancestors =
            [
                ...parent.ancestors,
                parent._id,
            ];
        descendant.level =
            parent.level + 1;
        await descendant.save();
    }
};
/* =========================================================
   UPDATE CATEGORY
========================================================= */
const updateCategory = async (categoryId, input) => {
    if (!mongoose_1.Types.ObjectId.isValid(categoryId)) {
        throw new Error("Invalid category ID.");
    }
    const category = await Category_model_1.default.findById(categoryId);
    if (!category) {
        throw new Error("Category not found.");
    }
    /* NAME */
    if (input.name !==
        undefined) {
        const name = input.name.trim();
        if (!name) {
            throw new Error("Category name cannot be empty.");
        }
        category.name =
            name;
        category.slug =
            await generateUniqueSlug(name, categoryId);
    }
    /* DESCRIPTION */
    if (input.description !==
        undefined) {
        category.description =
            input.description.trim();
    }
    /* IMAGE */
    if (input.image !==
        undefined) {
        category.image =
            input.image;
    }
    /* ACTIVE */
    if (input.isActive !==
        undefined) {
        category.isActive =
            input.isActive;
    }
    /* SORT ORDER */
    if (input.sortOrder !==
        undefined) {
        category.sortOrder =
            input.sortOrder;
    }
    /* =====================================
       PARENT CHANGE
    ===================================== */
    let hierarchyChanged = false;
    if (input.parentId !==
        undefined) {
        if (input.parentId ===
            categoryId) {
            throw new Error("Category cannot be its own parent.");
        }
        if (input.parentId) {
            if (!mongoose_1.Types.ObjectId.isValid(input.parentId)) {
                throw new Error("Invalid parent category ID.");
            }
            const newParent = await Category_model_1.default.findById(input.parentId);
            if (!newParent) {
                throw new Error("Parent category not found.");
            }
            const isDescendant = newParent.ancestors.some((ancestorId) => String(ancestorId) ===
                categoryId);
            if (isDescendant) {
                throw new Error("A child category cannot become the parent of its own ancestor.");
            }
            category.parent =
                newParent._id;
            category.ancestors =
                [
                    ...newParent.ancestors,
                    newParent._id,
                ];
            category.level =
                newParent.level +
                    1;
        }
        else {
            category.parent =
                null;
            category.ancestors =
                [];
            category.level =
                0;
        }
        hierarchyChanged =
            true;
    }
    await category.save();
    if (hierarchyChanged) {
        await rebuildDescendants(categoryId);
    }
    return category;
};
exports.updateCategory = updateCategory;
/* =========================================================
   DELETE CATEGORY
========================================================= */
const deleteCategory = async (categoryId) => {
    if (!mongoose_1.Types.ObjectId.isValid(categoryId)) {
        throw new Error("Invalid category ID.");
    }
    const category = await Category_model_1.default.findById(categoryId);
    if (!category) {
        throw new Error("Category not found.");
    }
    const childCategory = await Category_model_1.default.findOne({
        parent: category._id,
    })
        .select("_id")
        .lean();
    if (childCategory) {
        throw new Error("Delete or move child categories before deleting this category.");
    }
    await Category_model_1.default.deleteOne({
        _id: category._id,
    });
    return {
        message: "Category deleted successfully.",
    };
};
exports.deleteCategory = deleteCategory;
/* =========================================================
   CATEGORY TREE
========================================================= */
const getCategoryTree = async (activeOnly = false) => {
    const filter = activeOnly
        ? {
            isActive: true,
        }
        : {};
    const categories = await Category_model_1.default.find(filter).sort({
        level: 1,
        sortOrder: 1,
        name: 1,
    });
    const map = new Map();
    const roots = [];
    for (const category of categories) {
        const id = String(category._id);
        map.set(id, {
            id,
            name: category.name,
            slug: category.slug,
            description: category.description ||
                "",
            parent: category.parent
                ? String(category.parent)
                : null,
            ancestors: category.ancestors.map((ancestor) => String(ancestor)),
            level: category.level,
            image: {
                url: category.image
                    ?.url ||
                    "",
                publicId: category.image
                    ?.publicId ||
                    "",
            },
            isActive: category.isActive,
            sortOrder: category.sortOrder,
            children: [],
        });
    }
    for (const category of categories) {
        const id = String(category._id);
        const node = map.get(id);
        if (!node) {
            continue;
        }
        if (category.parent) {
            const parentNode = map.get(String(category.parent));
            if (parentNode) {
                parentNode.children.push(node);
                continue;
            }
        }
        roots.push(node);
    }
    return roots;
};
exports.getCategoryTree = getCategoryTree;
//# sourceMappingURL=category.service.js.map