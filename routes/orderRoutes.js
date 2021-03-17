const express = require('express');
const authController = require('./../controllers/authController');
const orderController = require('./../controllers/orderController');
const router = express.Router({ mergeParams: true });

router.use(authController.protect);
router
  .route('/')
  .get(authController.restrictTo('admin', 'moderator'),orderController.getAllOrders)
  .post(
    authController.restrictTo('user'),
    orderController.setOrderUserId,
    orderController.createOrder
  );

router
  .route('/:id')
  .get(orderController.getOrder)
  .patch(
    authController.restrictTo('admin', 'moderator'),
    orderController.updateOrder
  )
  .delete(
    authController.restrictTo('admin', 'moderator'),
    orderController.deleteOrder
  );
  router.patch('/:id/pay',
   orderController.setIsPaid,orderController.updateOrder)

  router.patch('/:id/deliver',  authController.restrictTo('admin', 'moderator'), 
  orderController.setIsDelivered,orderController.updateOrder)

module.exports=router