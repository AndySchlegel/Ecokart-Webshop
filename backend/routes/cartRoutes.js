"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cartController_1 = require("../controllers/cartController");
const cognitoJwtAuth_1 = require("../middleware/cognitoJwtAuth");
const router = (0, express_1.Router)();
// All cart routes require authentication (Cognito JWT)
router.use(cognitoJwtAuth_1.requireAuth);
router.get('/', cartController_1.getCart);
router.post('/items', cartController_1.addToCart);
router.put('/items', cartController_1.updateCartItem);
router.delete('/items/:productId', cartController_1.removeFromCart);
router.delete('/', cartController_1.clearCart);
exports.default = router;
