// import expess
const express = require('express');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// import user controller
const userController = require('../controllers/userController');
// import auth controller
const authController = require('../controllers/authControllers');
const viewController = require('../controllers/viewController');
const productControllers = require('../controllers/productControllers');

// set router
const router = express.Router();

// set routes
// router.route('/').get(authController.protect, userController.getAlluser);
router.post('/user-otp', authController.userOtpGenerate);
router.patch('/verify-user', authController.verifyUserOtp);
router.post('/send-mail', upload.any(), userController.sendMailForContact);
// router.route('/signUp').post(authController.signup);

// router.route('/login').post(authController.login);
// router
//     .route('/:id')
//     .get(
//         authController.protect,
//         userController.getUser
//     );

// get user
router.get('/get-me', authController.protect, userController.getUser);

router
    .route('/update-me')
    .patch(authController.protect, userController.updateUser);

// router.patch(
//     '/vendor-verification-docs',
//     authController.protect,
//     authController.restrictTo('vendor'),
//     authController.verifyVendor,
//     vendorController.uploadVendorDetails
// );

// order product
router.post(
    '/product/assign-order',
    authController.protect,
    productControllers.assignOrderProducts
);

// order product
router.post(
    '/product/order/:addressId',
    authController.protect,
    productControllers.orderProduct
);

// get my orders
router.get(
    '/orders/my-orders',
    authController.protect,
    productControllers.getMyOrders
);

// get a order
router.get(
    '/orders/my-order/:orderId',
    authController.protect,
    productControllers.getAOrder
);

// cancel order
router.patch(
    '/orders/cancel-order/:orderId',
    authController.protect,
    productControllers.cancelAOrder
);

// my cart
router.get(
    '/cart/my-carts',
    authController.protect,
    productControllers.myCarts,
    productControllers.sendJsonForCart
);

// cart checkout
router.post(
    '/cart/checkout',
    authController.protect,
    productControllers.moveCartToCheckout
);
// new cart
router
    .route('/cart/:productId')
    .post(authController.protectCart, productControllers.createNewCart)
    .delete(authController.protectCart, productControllers.deleteMyCart);

router
    .route('/wishlist/:productId')
    .post(authController.protect, productControllers.addWishList)
    .delete(authController.protect, productControllers.deleteWishLists);

router.get(
    '/wishlist/my-wishlist',
    authController.protect,
    productControllers.getMyWishlist,
    productControllers.sendWishlistJson
);

router.post(
    '/address',
    authController.protect,
    userController.getuserId,
    userController.addNewAddress
);
router.get(
    '/address/my-address',
    authController.protect,
    viewController.getAddress2,
    viewController.myAddress
);
router.patch(
    '/address/:id',
    authController.protect,
    userController.updateUserAddress
);
router.delete(
    '/address/:id',
    authController.protect,
    userController.deleteUserAddress
);

router.post(
    '/isValidAuth',
    authController.protect,
    authController.verifiedUser
);

module.exports = router;
