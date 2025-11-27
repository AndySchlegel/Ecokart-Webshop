"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const router = (0, express_1.Router)();
// GET /api/products - Get all products
router.get('/', productController_1.getAllProducts);
// GET /api/products/:id - Get single product
router.get('/:id', productController_1.getProductById);
// POST /api/products - Create new product
router.post('/', productController_1.createProduct);
// PUT /api/products/:id - Update product
router.put('/:id', productController_1.updateProduct);
// DELETE /api/products/:id - Delete product
router.delete('/:id', productController_1.deleteProduct);
exports.default = router;
