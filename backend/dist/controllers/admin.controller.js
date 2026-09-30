"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLogin = adminLogin;
exports.getAdminDashboard = getAdminDashboard;
exports.getAdminCustomers = getAdminCustomers;
exports.createAdminCustomer = createAdminCustomer;
exports.updateAdminCustomer = updateAdminCustomer;
exports.updateAdminCustomerLastActive = updateAdminCustomerLastActive;
exports.adminAddCustomerCartItem = adminAddCustomerCartItem;
exports.adminUpdateCustomerCartItem = adminUpdateCustomerCartItem;
exports.adminRemoveCustomerCartItem = adminRemoveCustomerCartItem;
exports.adminClearCustomerCart = adminClearCustomerCart;
exports.adminAddCustomerWishlistItem = adminAddCustomerWishlistItem;
exports.adminRemoveCustomerWishlistItem = adminRemoveCustomerWishlistItem;
exports.adminClearCustomerWishlist = adminClearCustomerWishlist;
exports.getAdminCustomerDetails = getAdminCustomerDetails;
exports.getAdminCustomerActivity = getAdminCustomerActivity;
exports.updateAdminCustomerStatus = updateAdminCustomerStatus;
exports.getAdminOrders = getAdminOrders;
exports.updateAdminOrderStatus = updateAdminOrderStatus;
exports.getAdminCoupons = getAdminCoupons;
exports.getAdminPages = getAdminPages;
exports.getAdminSystemStatus = getAdminSystemStatus;
exports.getAdminUserCart = getAdminUserCart;
exports.getAdminUserWishlist = getAdminUserWishlist;
exports.getAdminUserOrders = getAdminUserOrders;
exports.getAdminUserNotifications = getAdminUserNotifications;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importStar(require("mongoose"));
const User_model_1 = __importDefault(require("../models/User.model"));
const Product_model_1 = __importDefault(require("../models/Product.model"));
const Category_model_1 = __importDefault(require("../models/Category.model"));
const Banner_model_1 = __importDefault(require("../models/Banner.model"));
const Order_model_1 = __importDefault(require("../models/Order.model"));
const Cart_model_1 = __importDefault(require("../models/Cart.model"));
const Wishlist_model_1 = __importDefault(require("../models/Wishlist.model"));
const address_model_1 = __importDefault(require("../models/user/address.model"));
const account_model_1 = __importDefault(require("../models/user/account.model"));
const password_1 = require("../utils/password");
const activity_service_1 = require("../services/activity.service");
const Notification_model_1 = __importDefault(require("../models/Notification.model"));
const customer_admin_service_1 = require("../services/customer-admin.service");
const cart_service_1 = require("../services/cart.service");
const wishlist_service_1 = require("../services/wishlist.service");
const dummyHash = (0, password_1.hashPassword)("invalid-admin-login");
async function adminLogin(req, res) {
    const { username, password } = req.body || {};
    if (typeof username !== "string" ||
        typeof password !== "string" ||
        username.length > 100 ||
        password.length > 256) {
        return res.status(400).json({ message: "Enter your login ID and password." });
    }
    try {
        const user = await User_model_1.default.findOne({ username: username.trim() }).select("+passwordHash");
        const valid = await (0, password_1.verifyPassword)(password, user?.passwordHash || (await dummyHash));
        if (!valid || !user?.isActive || !["admin", "super_admin"].includes(user.role)) {
            return res.status(401).json({ message: "Incorrect login ID or password." });
        }
        if (!process.env.JWT_SECRET)
            throw new Error("JWT secret missing");
        const token = jsonwebtoken_1.default.sign({ id: String(user._id), role: user.role }, process.env.JWT_SECRET, { expiresIn: "8h" });
        res.cookie("accessToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 8 * 60 * 60 * 1000,
        });
        return res.json({ success: true });
    }
    catch {
        return res.status(503).json({ message: "Login is unavailable. Please try again." });
    }
}
function getDb() {
    const db = mongoose_1.default.connection.db;
    if (!db)
        throw new Error("Database is not connected.");
    return db;
}
async function collectionExists(name) {
    const db = getDb();
    const result = await db.listCollections({ name }, { nameOnly: true }).toArray();
    return result.length > 0;
}
async function safeCollectionCount(name) {
    if (!(await collectionExists(name)))
        return 0;
    return getDb().collection(name).countDocuments({});
}
/**
 * GET /api/admin/dashboard
 * One request for all cards/status data used by the admin dashboard.
 */
async function getAdminDashboard(_req, res) {
    try {
        const db = getDb();
        const hasOrders = await collectionExists("orders");
        const [products, categories, banners, customers, orders] = await Promise.all([
            Product_model_1.default.countDocuments({}),
            Category_model_1.default.countDocuments({}),
            Banner_model_1.default.countDocuments({}),
            User_model_1.default.countDocuments({ role: "customer" }),
            hasOrders ? db.collection("orders").countDocuments({}) : Promise.resolve(0),
        ]);
        let revenue = 0;
        if (hasOrders) {
            const revenueRows = await db
                .collection("orders")
                .aggregate([
                {
                    $match: {
                        status: { $nin: ["cancelled", "canceled"] },
                    },
                },
                {
                    $group: {
                        _id: null,
                        revenue: {
                            $sum: {
                                $convert: {
                                    input: {
                                        $ifNull: [
                                            "$grandTotal",
                                            { $ifNull: ["$total", { $ifNull: ["$totalAmount", 0] }] },
                                        ],
                                    },
                                    to: "double",
                                    onError: 0,
                                    onNull: 0,
                                },
                            },
                        },
                    },
                },
            ])
                .toArray();
            revenue = Number(revenueRows[0]?.revenue || 0);
        }
        return res.status(200).json({
            success: true,
            stats: { products, orders, customers, revenue, categories, banners },
            status: {
                backend: "connected",
                mongodb: mongoose_1.default.connection.readyState === 1 ? "connected" : "disconnected",
                productsApi: "ready",
                categoriesApi: "ready",
                bannersApi: "ready",
                cloudinary: process.env.CLOUDINARY_CLOUD_NAME &&
                    process.env.CLOUDINARY_API_KEY &&
                    process.env.CLOUDINARY_API_SECRET
                    ? "ready"
                    : "pending",
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unable to load dashboard.",
        });
    }
}
/** GET /api/admin/customers - backend-driven search, filters and pagination. */
async function getAdminCustomers(req, res) {
    try {
        const result = await (0, customer_admin_service_1.listAdminCustomers)(req.query);
        return res.status(200).json({
            success: true,
            count: result.customers.length,
            customers: result.customers,
            pagination: result.pagination,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unable to load customers.",
        });
    }
}
/** POST /api/admin/customers - create a customer for Postman/admin testing. */
async function createAdminCustomer(req, res) {
    try {
        const name = String(req.body?.name || "").trim();
        const email = String(req.body?.email || "").trim().toLowerCase();
        const phone = String(req.body?.phone || "").trim();
        if (!name || !email || !phone) {
            return res.status(400).json({ success: false, message: "name, email and phone are required." });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: "Enter a valid email address." });
        }
        const existing = await User_model_1.default.findOne({ $or: [{ email }, { phone }] }).select("_id").lean();
        if (existing)
            return res.status(409).json({ success: false, message: "Email or phone is already in use." });
        const requestedStatus = String(req.body?.accountStatus || "active").toLowerCase();
        const accountStatus = (["active", "inactive", "blocked"].includes(requestedStatus) ? requestedStatus : "active");
        const customer = await User_model_1.default.create({
            name, email, phone, role: "customer", emailVerified: Boolean(req.body?.emailVerified),
            isActive: accountStatus === "active", accountStatus, lastActiveAt: req.body?.lastActiveAt || null,
        });
        await account_model_1.default.updateOne({ user: customer._id }, { $setOnInsert: { user: customer._id, role: "customer", emailVerified: customer.emailVerified }, $set: { isActive: accountStatus === "active", isBlocked: accountStatus === "blocked" } }, { upsert: true });
        await (0, activity_service_1.trackUserActivity)({ userId: String(customer._id), type: "register", metadata: { source: "admin_postman" } });
        return res.status(201).json({ success: true, message: "Customer created.", data: customer });
    }
    catch (error) {
        const duplicate = error?.code === 11000;
        return res.status(duplicate ? 409 : 400).json({ success: false, message: duplicate ? "Email or phone is already in use." : (error instanceof Error ? error.message : "Unable to create customer.") });
    }
}
/** PATCH /api/admin/customers/:id - update basic customer fields. */
async function updateAdminCustomer(req, res) {
    try {
        const id = String(req.params.id || "");
        if (!mongoose_1.Types.ObjectId.isValid(id))
            return res.status(400).json({ success: false, message: "Invalid customer id." });
        const update = {};
        if (req.body?.name !== undefined)
            update.name = String(req.body.name).trim();
        if (req.body?.email !== undefined)
            update.email = String(req.body.email).trim().toLowerCase();
        if (req.body?.phone !== undefined)
            update.phone = String(req.body.phone).trim();
        if (req.body?.emailVerified !== undefined)
            update.emailVerified = Boolean(req.body.emailVerified);
        if (Object.values(update).some((value) => value === ""))
            return res.status(400).json({ success: false, message: "Updated fields cannot be empty." });
        const customer = await User_model_1.default.findOneAndUpdate({ _id: id, role: "customer" }, { $set: update }, { new: true, runValidators: true })
            .select("name email phone emailVerified isActive accountStatus lastActiveAt createdAt updatedAt");
        if (!customer)
            return res.status(404).json({ success: false, message: "Customer not found." });
        return res.json({ success: true, message: "Customer updated.", data: customer });
    }
    catch (error) {
        return res.status(error?.code === 11000 ? 409 : 400).json({ success: false, message: error?.code === 11000 ? "Email or phone is already in use." : (error instanceof Error ? error.message : "Unable to update customer.") });
    }
}
/** PATCH /api/admin/customers/:id/last-active */
async function updateAdminCustomerLastActive(req, res) {
    try {
        const id = String(req.params.id || "");
        if (!mongoose_1.Types.ObjectId.isValid(id))
            return res.status(400).json({ success: false, message: "Invalid customer id." });
        const value = req.body?.lastActiveAt ? new Date(req.body.lastActiveAt) : new Date();
        if (Number.isNaN(value.getTime()))
            return res.status(400).json({ success: false, message: "Invalid lastActiveAt date." });
        const customer = await User_model_1.default.findOneAndUpdate({ _id: id, role: "customer" }, { $set: { lastActiveAt: value } }, { new: true })
            .select("name email phone lastActiveAt");
        if (!customer)
            return res.status(404).json({ success: false, message: "Customer not found." });
        return res.json({ success: true, message: "Last active updated.", data: customer });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to update last active." });
    }
}
/** Admin/Postman cart mutation helpers. */
async function adminAddCustomerCartItem(req, res) {
    try {
        const userId = String(req.params.id || "");
        let cart = await (0, cart_service_1.addItemToCart)(userId, { productId: String(req.body?.productId || ""), colorId: String(req.body?.colorId || req.body?.variantId || ""), sizeId: String(req.body?.sizeId || ""), quantity: req.body?.quantity });
        if (req.body?.addedAt) {
            const addedAt = new Date(req.body.addedAt);
            if (Number.isNaN(addedAt.getTime()))
                return res.status(400).json({ success: false, message: "Invalid addedAt date." });
            await Cart_model_1.default.updateOne({ user: userId, items: { $elemMatch: { product: req.body.productId, colorId: req.body?.colorId || req.body?.variantId, sizeId: req.body?.sizeId } } }, { $set: { "items.$.addedAt": addedAt, "items.$.updatedAt": addedAt } });
            cart = await (0, cart_service_1.getUserCart)(userId);
        }
        return res.status(201).json({ success: true, message: "Product added to cart", data: cart });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to add cart item." });
    }
}
async function adminUpdateCustomerCartItem(req, res) {
    try {
        const cart = await (0, cart_service_1.updateCartItem)(String(req.params.id || ""), String(req.params.itemId || ""), { quantity: Number(req.body?.quantity) });
        return res.json({ success: true, message: "Cart quantity updated", data: cart });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to update cart item." });
    }
}
async function adminRemoveCustomerCartItem(req, res) {
    try {
        const cart = await (0, cart_service_1.removeCartItem)(String(req.params.id || ""), String(req.params.itemId || ""));
        return res.json({ success: true, message: "Cart item removed", data: cart });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to remove cart item." });
    }
}
async function adminClearCustomerCart(req, res) {
    try {
        const cart = await (0, cart_service_1.clearUserCart)(String(req.params.id || ""));
        return res.json({ success: true, message: "Cart cleared", data: cart });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to clear cart." });
    }
}
async function adminAddCustomerWishlistItem(req, res) {
    try {
        const userId = String(req.params.id || "");
        const productId = String(req.body?.productId || "");
        const colorId = req.body?.colorId || req.body?.variantId || null;
        const sizeId = req.body?.sizeId || null;
        const result = await (0, wishlist_service_1.addProductToWishlist)(userId, productId, { colorId, sizeId });
        let wishlist = result.wishlist;
        if (req.body?.addedAt) {
            const addedAt = new Date(req.body.addedAt);
            if (Number.isNaN(addedAt.getTime()))
                return res.status(400).json({ success: false, message: "Invalid addedAt date." });
            await Wishlist_model_1.default.updateOne({ user: userId, items: { $elemMatch: { product: productId, colorId: colorId || null, sizeId: sizeId || null } } }, { $set: { "items.$.addedAt": addedAt, "items.$.updatedAt": addedAt } });
            wishlist = await (0, wishlist_service_1.getUserWishlist)(userId);
        }
        return res.status(result.alreadyExists ? 200 : 201).json({ success: true, message: result.alreadyExists ? "Product already in wishlist" : "Product added to wishlist", data: wishlist });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to add wishlist item." });
    }
}
async function adminRemoveCustomerWishlistItem(req, res) {
    try {
        const wishlist = await (0, wishlist_service_1.removeProductFromWishlist)(String(req.params.id || ""), String(req.params.itemId || ""));
        return res.json({ success: true, message: "Wishlist item removed", data: wishlist });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to remove wishlist item." });
    }
}
async function adminClearCustomerWishlist(req, res) {
    try {
        const wishlist = await (0, wishlist_service_1.clearUserWishlist)(String(req.params.id || ""));
        return res.json({ success: true, message: "Wishlist cleared", data: wishlist });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to clear wishlist." });
    }
}
/** GET /api/admin/customers/:id - complete customer 360 view for admin. */
async function getAdminCustomerDetails(req, res) {
    try {
        const rawCustomerId = req.params.userId ?? req.params.id;
        const customerId = Array.isArray(rawCustomerId) ? rawCustomerId[0] : rawCustomerId;
        if (!customerId || !mongoose_1.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json({ success: false, message: "Invalid customer id." });
        }
        const userObjectId = new mongoose_1.Types.ObjectId(customerId);
        const customer = await User_model_1.default.findOne({ _id: userObjectId, role: "customer" })
            .select("name username email phone role emailVerified isActive accountStatus lastActiveAt avatar createdAt updatedAt")
            .lean();
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found." });
        }
        const [account, addresses, orders, cart, wishlist, activities, notificationCount] = await Promise.all([
            account_model_1.default.findOne({ user: userObjectId })
                .select("role emailVerified phoneVerified isActive isBlocked createdAt updatedAt")
                .lean(),
            address_model_1.default.find({ user: userObjectId }).sort({ isDefault: -1, createdAt: -1 }).lean(),
            Order_model_1.default.find({ user: userObjectId }).sort({ createdAt: -1 }).lean(),
            Cart_model_1.default.findOne({ user: userObjectId }).lean(),
            Wishlist_model_1.default.findOne({ user: userObjectId }).lean(),
            (0, activity_service_1.getUserActivities)(customerId, 100),
            Notification_model_1.default.countDocuments({
                isActive: true,
                $or: [
                    { audience: "all" },
                    { audience: { $in: ["selected", "filtered"] }, userIds: userObjectId },
                ],
            }),
        ]);
        const productIds = Array.from(new Set([
            ...((cart?.items || []).map((item) => String(item.product || ""))),
            ...((wishlist?.items || []).map((item) => String(item.product || ""))),
        ].filter((id) => mongoose_1.Types.ObjectId.isValid(id))));
        const products = productIds.length
            ? await Product_model_1.default.find({ _id: { $in: productIds.map((id) => new mongoose_1.Types.ObjectId(id)) } })
                .populate({ path: "categories", select: "name slug" })
                .lean()
            : [];
        const productMap = new Map(products.map((product) => [String(product._id), product]));
        const pickColor = (product, colorId) => {
            const colors = Array.isArray(product?.colors) ? product.colors : [];
            if (!colors.length)
                return null;
            const requested = String(colorId || "");
            const byId = requested
                ? colors.find((color) => String(color?._id || "") === requested)
                : null;
            return byId || colors.find((color) => color?.isDefault === true) || colors[0] || null;
        };
        const pickSize = (color, sizeId) => {
            const sizes = Array.isArray(color?.sizes) ? color.sizes : [];
            const requested = String(sizeId || "");
            return ((requested ? sizes.find((size) => String(size?._id || "") === requested) : null) ||
                sizes.find((size) => size?.isActive !== false) ||
                sizes[0] ||
                null);
        };
        const productView = (product, colorId, sizeId) => {
            if (!product)
                return null;
            const color = pickColor(product, colorId);
            const size = pickSize(color, sizeId);
            const images = Array.isArray(color?.images) ? color.images : [];
            const mainImages = Array.isArray(product?.mainImages) ? product.mainImages : [];
            const image = images.find((item) => item?.isDefault === true) ||
                images[0] ||
                mainImages.find((item) => item?.isDefault === true) ||
                mainImages[0] ||
                null;
            const categoryList = Array.isArray(product?.categories) ? product.categories : [];
            const colorStock = (Array.isArray(color?.sizes) ? color.sizes : []).reduce((sum, item) => sum + Math.max(0, Number(item?.stock || 0)), 0);
            const stock = color ? colorStock : Math.max(0, Number(product?.stock || 0));
            return {
                _id: String(product._id),
                name: String(color?.nameProduct || product?.name || "Product"),
                slug: String(color?.slugProduct || product?.slug || ""),
                colorName: String(color?.nameColor || ""),
                colorHex: String(color?.hex || ""),
                size: String(size?.size || ""),
                originalPrice: Number(size?.originalPrice ?? color?.originalPrice ?? product?.compareAtPrice ?? product?.price ?? 0),
                showPrice: Number(size?.showPrice ?? color?.showPrice ?? product?.price ?? 0),
                stock,
                image: image?.url ? { url: String(image.url), publicId: String(image.publicId || "") } : null,
                categories: categoryList.map((category) => ({
                    _id: String(category?._id || category || ""),
                    name: String(category?.name || ""),
                    slug: String(category?.slug || ""),
                })),
                isActive: product?.isActive !== false,
            };
        };
        const purchasedAfter = (productId, addedAt) => {
            if (!productId || !addedAt)
                return false;
            const addedTime = new Date(addedAt).getTime();
            if (!Number.isFinite(addedTime))
                return false;
            return orders.some((order) => {
                const status = String(order?.status || "").toLowerCase();
                if (["cancelled", "canceled"].includes(status))
                    return false;
                const orderTime = new Date(order?.createdAt || 0).getTime();
                if (!Number.isFinite(orderTime) || orderTime < addedTime)
                    return false;
                return (Array.isArray(order?.items) ? order.items : []).some((orderItem) => String(orderItem?.product?._id || orderItem?.product || "") === productId);
            });
        };
        const cartItems = (cart?.items || []).map((item) => {
            const product = productMap.get(String(item.product || ""));
            const view = productView(product, item.colorId, item.sizeId);
            const quantity = Math.max(0, Number(item.quantity || 0));
            const unitPrice = Number(view?.showPrice || 0);
            return {
                _id: String(item._id || ""),
                product: view,
                quantity,
                unitPrice,
                lineTotal: Number((unitPrice * quantity).toFixed(2)),
                addedAt: item.addedAt || null,
                ageMs: item.addedAt ? Math.max(0, Date.now() - new Date(item.addedAt).getTime()) : 0,
                updatedAt: item.updatedAt || item.addedAt || null,
                purchasedAfterAdded: purchasedAfter(String(item.product || ""), item.addedAt),
            };
        });
        const wishlistItems = (wishlist?.items || []).map((item) => {
            const product = productMap.get(String(item.product || ""));
            return {
                _id: String(item._id || ""),
                product: productView(product, item.colorId, item.sizeId),
                colorId: item.colorId ? String(item.colorId) : null,
                sizeId: item.sizeId ? String(item.sizeId) : null,
                addedAt: item.addedAt || null,
                updatedAt: item.updatedAt || item.addedAt || null,
                ageMs: item.addedAt ? Math.max(0, Date.now() - new Date(item.addedAt).getTime()) : 0,
                purchasedAfterAdded: purchasedAfter(String(item.product || ""), item.addedAt),
            };
        });
        const normalizedOrders = orders.map((order) => ({
            _id: String(order._id),
            orderNumber: String(order.orderNumber || order._id),
            status: String(order.status || "pending").toLowerCase(),
            paymentStatus: String(order.paymentStatus || "pending").toLowerCase(),
            paymentMethod: String(order.paymentMethod || ""),
            subtotal: Number(order.subtotal || 0),
            automaticDiscount: Number(order.automaticDiscount || 0),
            codeDiscount: Number(order.codeDiscount || 0),
            discount: Number(order.discount || 0),
            discountCode: String(order.discountCode || ""),
            shipping: Number(order.shipping || 0),
            tax: Number(order.tax || 0),
            taxName: String(order.taxName || ""),
            taxPercentage: Number(order.taxPercentage || 0),
            total: Number(order.total ?? order.grandTotal ?? order.totalAmount ?? 0),
            items: Array.isArray(order.items) ? order.items : [],
            shippingAddress: order.shippingAddress || null,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        }));
        const deliveredOrders = normalizedOrders.filter((order) => order.status === "delivered");
        const cancelledOrders = normalizedOrders.filter((order) => ["cancelled", "canceled"].includes(order.status));
        const openOrders = normalizedOrders.filter((order) => order.status !== "delivered" && !["cancelled", "canceled"].includes(order.status));
        const paidOrders = normalizedOrders.filter((order) => order.paymentStatus === "paid");
        const cartQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        const cartSubtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
        const totalOrderValue = normalizedOrders
            .filter((order) => !["cancelled", "canceled"].includes(order.status))
            .reduce((sum, order) => sum + order.total, 0);
        const deliveredValue = deliveredOrders.reduce((sum, order) => sum + order.total, 0);
        const totalDiscount = normalizedOrders.reduce((sum, order) => sum + order.discount, 0);
        return res.status(200).json({
            success: true,
            customer: {
                ...customer,
                _id: String(customer._id),
            },
            account: account
                ? {
                    ...account,
                    _id: String(account._id),
                }
                : null,
            summary: {
                totalOrders: normalizedOrders.length,
                deliveredOrders: deliveredOrders.length,
                openOrders: openOrders.length,
                cancelledOrders: cancelledOrders.length,
                paidOrders: paidOrders.length,
                totalOrderValue: Number(totalOrderValue.toFixed(2)),
                deliveredValue: Number(deliveredValue.toFixed(2)),
                totalDiscount: Number(totalDiscount.toFixed(2)),
                averageOrderValue: normalizedOrders.length > 0
                    ? Number((totalOrderValue / normalizedOrders.length).toFixed(2))
                    : 0,
                cartQuantity,
                cartSubtotal: Number(cartSubtotal.toFixed(2)),
                wishlistItems: wishlistItems.length,
                addresses: addresses.length,
                lastOrderAt: normalizedOrders[0]?.createdAt || null,
                notifications: notificationCount,
                activities: activities.length,
                lastActivityAt: activities[0]?.createdAt || null,
            },
            cart: {
                _id: cart?._id ? String(cart._id) : null,
                discountCode: String(cart?.discountCode || ""),
                items: cartItems,
                totalItems: cartQuantity,
                subtotal: Number(cartSubtotal.toFixed(2)),
                updatedAt: cart?.updatedAt || null,
            },
            wishlist: {
                _id: wishlist?._id ? String(wishlist._id) : null,
                items: wishlistItems,
                count: wishlistItems.length,
                updatedAt: wishlist?.updatedAt || null,
            },
            addresses: addresses.map((address) => ({
                ...address,
                _id: String(address._id),
                user: String(address.user || customerId),
            })),
            activities: activities.map((activity) => ({
                ...activity,
                _id: String(activity._id),
                user: String(activity.user || customerId),
                product: activity.product
                    ? {
                        _id: String(activity.product._id),
                        name: String(activity.product?.colors?.find((color) => color?.isDefault)?.nameProduct ||
                            activity.product?.colors?.[0]?.nameProduct ||
                            "Product"),
                    }
                    : null,
                order: activity.order
                    ? {
                        _id: String(activity.order._id),
                        orderNumber: String(activity.order.orderNumber || activity.order._id),
                        status: String(activity.order.status || ""),
                        total: Number(activity.order.total || 0),
                    }
                    : null,
            })),
            orders: normalizedOrders,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unable to load customer details.",
        });
    }
}
/** GET /api/admin/customers/:id/activity */
async function getAdminCustomerActivity(req, res) {
    try {
        const rawCustomerId = req.params.userId ?? req.params.id;
        const customerId = Array.isArray(rawCustomerId) ? rawCustomerId[0] : rawCustomerId;
        if (!customerId || !mongoose_1.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json({ success: false, message: "Invalid customer id." });
        }
        const customer = await User_model_1.default.findOne({ _id: customerId, role: "customer" })
            .select("_id name email phone")
            .lean();
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found." });
        }
        const limit = Math.min(250, Math.max(1, Number(req.query.limit || 100)));
        const activities = await (0, activity_service_1.getUserActivities)(customerId, limit);
        return res.json({
            success: true,
            customer,
            count: activities.length,
            activities,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unable to load customer activity.",
        });
    }
}
/** PATCH /api/admin/customers/:id/status */
async function updateAdminCustomerStatus(req, res) {
    try {
        const id = String(req.params.id || "");
        if (!mongoose_1.Types.ObjectId.isValid(id))
            return res.status(400).json({ success: false, message: "Invalid customer id." });
        const rawStatus = req.body?.accountStatus !== undefined
            ? String(req.body.accountStatus).toLowerCase()
            : (typeof req.body?.isActive === "boolean" ? (req.body.isActive ? "active" : "inactive") : "");
        if (!["active", "inactive", "blocked"].includes(rawStatus)) {
            return res.status(400).json({ success: false, message: "accountStatus must be active, inactive or blocked." });
        }
        const isActive = rawStatus === "active";
        const customer = await User_model_1.default.findOneAndUpdate({ _id: id, role: "customer" }, { $set: { isActive, accountStatus: rawStatus } }, { new: true }).select("name email phone emailVerified isActive accountStatus lastActiveAt createdAt updatedAt");
        if (!customer)
            return res.status(404).json({ success: false, message: "Customer not found." });
        await account_model_1.default.updateOne({ user: customer._id }, { $set: { isActive, isBlocked: rawStatus === "blocked" }, $setOnInsert: { user: customer._id, role: "customer", emailVerified: customer.emailVerified } }, { upsert: true });
        return res.status(200).json({ success: true, message: "Customer status updated.", customer });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Unable to update customer.",
        });
    }
}
/** GET /api/admin/orders - read-only admin list, works with the existing Mongo orders collection. */
async function getAdminOrders(_req, res) {
    try {
        if (!(await collectionExists("orders"))) {
            return res.status(200).json({ success: true, count: 0, orders: [] });
        }
        const orders = await getDb().collection("orders").find({}).sort({ createdAt: -1 }).limit(250).toArray();
        return res.status(200).json({ success: true, count: orders.length, orders });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unable to load orders.",
        });
    }
}
/** PATCH /api/admin/orders/:id/status */
async function updateAdminOrderStatus(req, res) {
    try {
        const { status } = req.body || {};
        if (typeof status !== "string" || !status.trim()) {
            return res.status(400).json({ success: false, message: "Order status is required." });
        }
        const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!orderId || !mongoose_1.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ success: false, message: "Invalid order id." });
        }
        if (!(await collectionExists("orders"))) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }
        const result = await getDb().collection("orders").findOneAndUpdate({ _id: new mongoose_1.Types.ObjectId(orderId) }, { $set: { status: status.trim().toLowerCase(), updatedAt: new Date() } }, { returnDocument: "after" });
        const order = result?.value ?? result;
        if (!order)
            return res.status(404).json({ success: false, message: "Order not found." });
        const normalizedStatus = status.trim().toLowerCase();
        if (order.user && ["delivered", "cancelled", "canceled"].includes(normalizedStatus)) {
            await (0, activity_service_1.trackUserActivity)({
                userId: String(order.user),
                type: normalizedStatus === "delivered" ? "order_delivered" : "order_cancelled",
                orderId: String(order._id),
                metadata: {
                    orderNumber: String(order.orderNumber || order._id),
                    status: normalizedStatus,
                    total: Number(order.total || 0),
                },
            });
        }
        if (order.user && ["confirmed", "processing", "shipped", "delivered", "cancelled", "canceled"].includes(normalizedStatus)) {
            const orderNumber = String(order.orderNumber || order._id);
            const statusTitle = {
                confirmed: "Order Confirmed",
                processing: "Order Processing",
                shipped: "Order Shipped",
                delivered: "Order Delivered",
                cancelled: "Order Cancelled",
                canceled: "Order Cancelled",
            };
            await Notification_model_1.default.create({
                title: statusTitle[normalizedStatus] || "Order Update",
                message: `Your order ${orderNumber} is now ${normalizedStatus === "canceled" ? "cancelled" : normalizedStatus}.`,
                type: "order",
                audience: "selected",
                userIds: [order.user],
                link: "/account/orders",
                isActive: true,
                createdBy: req.user?._id || null,
            });
        }
        return res.status(200).json({ success: true, order });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Unable to update order.",
        });
    }
}
/** GET /api/admin/coupons */
async function getAdminCoupons(_req, res) {
    try {
        if (!(await collectionExists("coupons"))) {
            return res.status(200).json({ success: true, count: 0, coupons: [] });
        }
        const coupons = await getDb().collection("coupons").find({}).sort({ createdAt: -1 }).limit(250).toArray();
        return res.status(200).json({ success: true, count: coupons.length, coupons });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unable to load coupons.",
        });
    }
}
/** GET /api/admin/pages */
async function getAdminPages(_req, res) {
    try {
        const name = (await collectionExists("sitepages"))
            ? "sitepages"
            : (await collectionExists("pages"))
                ? "pages"
                : null;
        if (!name)
            return res.status(200).json({ success: true, count: 0, pages: [] });
        const pages = await getDb().collection(name).find({}).sort({ updatedAt: -1 }).limit(250).toArray();
        return res.status(200).json({ success: true, count: pages.length, pages });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unable to load pages.",
        });
    }
}
/** GET /api/admin/system-status */
async function getAdminSystemStatus(_req, res) {
    try {
        await getDb().command({ ping: 1 });
        const [orders, coupons, pages] = await Promise.all([
            safeCollectionCount("orders"),
            safeCollectionCount("coupons"),
            collectionExists("sitepages").then((exists) => exists ? safeCollectionCount("sitepages") : safeCollectionCount("pages")),
        ]);
        return res.status(200).json({
            success: true,
            services: {
                backend: "connected",
                mongodb: "connected",
                cloudinary: process.env.CLOUDINARY_CLOUD_NAME &&
                    process.env.CLOUDINARY_API_KEY &&
                    process.env.CLOUDINARY_API_SECRET
                    ? "configured"
                    : "not_configured",
            },
            collections: { orders, coupons, pages },
            environment: process.env.NODE_ENV || "development",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unable to load system status.",
        });
    }
}
/* =========================================================
   ADMIN USER RESOURCE APIS
   GET /api/admin/users/:userId/...
========================================================= */
function adminUserId(req) {
    const raw = req.params.userId ?? req.params.id;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value || !mongoose_1.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid customer id.");
    }
    return value;
}
async function ensureCustomer(userId) {
    const customer = await User_model_1.default.findOne({ _id: userId, role: "customer" })
        .select("_id name email phone isActive")
        .lean();
    if (!customer)
        throw new Error("Customer not found.");
    return customer;
}
async function getAdminUserCart(req, res) {
    try {
        const userId = adminUserId(req);
        const customer = await ensureCustomer(userId);
        const cart = await Cart_model_1.default.findOne({ user: userId })
            .populate({ path: "items.product", select: "colors isColor isActive categories" })
            .lean();
        const now = Date.now();
        const items = (cart?.items || []).map((item) => ({
            ...item,
            _id: String(item._id || ""),
            colorId: item.colorId ? String(item.colorId) : null,
            sizeId: item.sizeId ? String(item.sizeId) : null,
            addedAt: item.addedAt || null,
            updatedAt: item.updatedAt || item.addedAt || null,
            ageMs: item.addedAt ? Math.max(0, now - new Date(item.addedAt).getTime()) : 0,
        }));
        return res.json({
            success: true,
            customer,
            cart: {
                _id: cart?._id ? String(cart._id) : null,
                items,
                count: items.length,
                totalQuantity: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
                updatedAt: cart?.updatedAt || null,
            },
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load customer cart.";
        return res.status(message === "Customer not found." ? 404 : 400).json({ success: false, message });
    }
}
async function getAdminUserWishlist(req, res) {
    try {
        const userId = adminUserId(req);
        const customer = await ensureCustomer(userId);
        const wishlist = await Wishlist_model_1.default.findOne({ user: userId })
            .populate({ path: "items.product", select: "colors isColor isActive categories" })
            .lean();
        const now = Date.now();
        const items = (wishlist?.items || []).map((item) => ({
            ...item,
            _id: String(item._id || ""),
            colorId: item.colorId ? String(item.colorId) : null,
            sizeId: item.sizeId ? String(item.sizeId) : null,
            addedAt: item.addedAt || null,
            updatedAt: item.updatedAt || item.addedAt || null,
            ageMs: item.addedAt ? Math.max(0, now - new Date(item.addedAt).getTime()) : 0,
        }));
        return res.json({
            success: true,
            customer,
            wishlist: {
                _id: wishlist?._id ? String(wishlist._id) : null,
                items,
                count: items.length,
                updatedAt: wishlist?.updatedAt || null,
            },
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load customer wishlist.";
        return res.status(message === "Customer not found." ? 404 : 400).json({ success: false, message });
    }
}
async function getAdminUserOrders(req, res) {
    try {
        const userId = adminUserId(req);
        const customer = await ensureCustomer(userId);
        const orders = await Order_model_1.default.find({ user: userId }).sort({ createdAt: -1 }).lean();
        return res.json({ success: true, customer, count: orders.length, orders });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load customer orders.";
        return res.status(message === "Customer not found." ? 404 : 400).json({ success: false, message });
    }
}
async function getAdminUserNotifications(req, res) {
    try {
        const userId = adminUserId(req);
        const customer = await ensureCustomer(userId);
        const userObjectId = new mongoose_1.Types.ObjectId(userId);
        const notifications = await Notification_model_1.default.find({
            isActive: true,
            $or: [
                { audience: "all" },
                { audience: { $in: ["selected", "filtered"] }, userIds: userObjectId },
            ],
        })
            .sort({ createdAt: -1 })
            .limit(250)
            .lean();
        const items = notifications.map((notification) => ({
            ...notification,
            _id: String(notification._id),
            isRead: Array.isArray(notification.readBy)
                ? notification.readBy.some((id) => String(id) === userId)
                : false,
        }));
        return res.json({ success: true, customer, count: items.length, notifications: items });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load customer notifications.";
        return res.status(message === "Customer not found." ? 404 : 400).json({ success: false, message });
    }
}
//# sourceMappingURL=admin.controller.js.map