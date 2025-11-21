import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../controllers/cartController';
import { requireAuth } from '../middleware/cognitoJwtAuth';

const router = Router();

// All cart routes require authentication (Cognito JWT)
router.use(requireAuth);

router.get('/', getCart);
router.post('/items', addToCart);
router.put('/items', updateCartItem);
router.delete('/items/:productId', removeFromCart);
router.delete('/', clearCart);

export default router;
