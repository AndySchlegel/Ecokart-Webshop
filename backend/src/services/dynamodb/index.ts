/**
 * DynamoDB Service Layer
 *
 * Central export for all DynamoDB services
 * Switch between JSON and DynamoDB by setting DB_TYPE in .env
 */

export { dynamodb, TableNames } from './client';
export { ProductsService, productsService } from './products.service';

// Export types
export type { Product } from './products.service';

/**
 * TODO: Implement remaining services
 *
 * - UsersService: User management (getById, getByEmail, create, update)
 * - CartsService: Shopping cart operations (get, update, clear)
 * - OrdersService: Order management (create, getById, getByUserId)
 *
 * Each service follows the same pattern as ProductsService
 */
