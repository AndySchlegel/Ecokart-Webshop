"use strict";
/**
 * DynamoDB Service Layer
 *
 * Central export for all DynamoDB services
 * Switch between JSON and DynamoDB by setting DB_TYPE in .env
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersService = exports.OrdersService = exports.cartsService = exports.CartsService = exports.usersService = exports.UsersService = exports.productsService = exports.ProductsService = exports.TableNames = exports.dynamodb = void 0;
var client_1 = require("./client");
Object.defineProperty(exports, "dynamodb", { enumerable: true, get: function () { return client_1.dynamodb; } });
Object.defineProperty(exports, "TableNames", { enumerable: true, get: function () { return client_1.TableNames; } });
var products_service_1 = require("./products.service");
Object.defineProperty(exports, "ProductsService", { enumerable: true, get: function () { return products_service_1.ProductsService; } });
Object.defineProperty(exports, "productsService", { enumerable: true, get: function () { return products_service_1.productsService; } });
var users_service_1 = require("./users.service");
Object.defineProperty(exports, "UsersService", { enumerable: true, get: function () { return users_service_1.UsersService; } });
Object.defineProperty(exports, "usersService", { enumerable: true, get: function () { return users_service_1.usersService; } });
var carts_service_1 = require("./carts.service");
Object.defineProperty(exports, "CartsService", { enumerable: true, get: function () { return carts_service_1.CartsService; } });
Object.defineProperty(exports, "cartsService", { enumerable: true, get: function () { return carts_service_1.cartsService; } });
var orders_service_1 = require("./orders.service");
Object.defineProperty(exports, "OrdersService", { enumerable: true, get: function () { return orders_service_1.OrdersService; } });
Object.defineProperty(exports, "ordersService", { enumerable: true, get: function () { return orders_service_1.ordersService; } });
