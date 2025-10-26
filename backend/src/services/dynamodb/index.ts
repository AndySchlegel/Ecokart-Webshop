/**
 * DynamoDB Service Layer
 *
 * Central export for all DynamoDB services
 * Switch between JSON and DynamoDB by setting DB_TYPE in .env
 */

export { dynamodb, TableNames } from './client';
export { ProductsService, productsService } from './products.service';
export { UsersService, usersService } from './users.service';
export { CartsService, cartsService } from './carts.service';
export { OrdersService, ordersService } from './orders.service';
