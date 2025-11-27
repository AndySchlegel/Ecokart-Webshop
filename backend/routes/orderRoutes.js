"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const cognitoJwtAuth_1 = require("../middleware/cognitoJwtAuth");
const router = (0, express_1.Router)();
// All order routes require authentication (Cognito JWT)
router.use(cognitoJwtAuth_1.requireAuth);
router.post('/', orderController_1.createOrder);
router.get('/', orderController_1.getOrders);
router.get('/:id', orderController_1.getOrderById);
router.patch('/:id/status', orderController_1.updateOrderStatus);
exports.default = router;
