const express = require('express');
const authController = require('./../controllers/authController');
const reviewController = require('./../controllers/reviewController');
const router = express.Router({ mergeParams: true });

//POST /product/46383782/reviews
//GET /product/46383782/reviews
//POST /reviews
router.use(authController.protect);
router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setProductUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin', 'moderator'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('admin', 'moderator'),
    reviewController.deleteReview
  );
module.exports = router;
