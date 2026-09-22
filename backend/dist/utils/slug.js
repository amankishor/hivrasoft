"use strict";
/* =========================================================
   CREATE CLEAN URL SLUG
========================================================= */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSlug = void 0;
const createSlug = (value) => {
    const slug = value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return slug || "category";
};
exports.createSlug = createSlug;
//# sourceMappingURL=slug.js.map