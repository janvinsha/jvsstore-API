const express = require('express');
const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');

const router = express.Router();

//login
router
  .route('/login')

  .post(authController.login);
//logout
router
  .route('/logout')
  .get(authController.logout);

//signup
router.route('/register').post(authController.register);
//resendConfirmEmail
router.post(
  '/resendConfirmEmail',
  authController.protect,
  authController.resendConfirmEmail
);
//confirmEmail
router.post('/confirmEmail/:token', authController.confirmEmail);
router.post('/forgotPassword', authController.forgotPassword);
router.route('/resetPassword/:token').patch(authController.resetPassword);
router.get(
  '/loggedInUser',
  authController.loggedInUser,
  userController.getLoggedInUser
);
//protect alll routes after this midddleware
router.use(authController.protect);
router.patch('/updateMyPassword', authController.updatePassword);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);
router.get('/me', userController.getMe, userController.getUser);

//restrict all routes after this
router.route('/').get(authController.restrictTo('admin', 'moderator'),userController.getAllUsers);
router
  .route('/:id')
  .get(authController.restrictTo('admin', 'moderator'),userController.getUser)
  .patch(authController.restrictTo('admin'),userController.updateUser)
  .delete(authController.restrictTo('admin'),userController.deleteUser);

module.exports = router;
