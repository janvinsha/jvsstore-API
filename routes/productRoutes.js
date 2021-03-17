const express = require('express');
const router = express.Router();
const reviewRouter = require('./../routes/reviewRoutes');
const productController = require('../controllers/productController');
const authController = require('../controllers/authController');

router.use('/:productId/reviews', reviewRouter);
//Alias router
router
  .route('/top-5-cheap')
  .get(productController.aliasTopProducts, productController.getAllProducts);
router.get("/top-3-products",productController.aliasTop3Products, productController.getAllProducts)
router
  .route('/')
  .get(productController.getAllProducts)
  .post(
    authController.protect,
    authController.restrictTo('moderator', 'admin'),
    productController.uploadProductImages,
    productController.resizeProductImages,
    productController.createProduct
  );

//product page
router
  .route('/:id')
  .get(productController.getProduct)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'moderator'),
    productController.uploadProductImages,
    productController.resizeProductImages,
    productController.editProduct
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    productController.deleteProduct
  );

////aggregation pipeline stuff stats
router
  .route('/products-stats')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'moderator'),
    productController.getProductStats
  );
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'moderator'),
    productController.getMontlyPlan
  );
module.exports = router;
