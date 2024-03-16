/* eslint-disable prefer-template */
/* eslint-disable arrow-body-style */
/* eslint-disable no-else-return */
/* eslint-disable array-callback-return */
const mongoose = require('mongoose');
const cartModel = require('../models/cartModel');
const wishlistModel = require('../models/wishListModel');
const catchAsync = require('../util/catchAsync');
const productModel = require('../models/productModel');
const categorieModel = require('../models/categorieModel');
const ApiFeature = require('../util/apiFeatures');
const AppError = require('../util/appError');
const userModel = require('../models/userModel');
const orderModel = require('../models/orderModel');
const ordermodel = require('../models/orderModel');
const addressModel = require('../models/addressModel');
const { banners1, banners2 } = require('../bannerJSON/bannerjson.json');
exports.getHome = (req, res) => {
    return res.status(200).render('home', {
        docs: req.body,
        title: 'Themobsterhoard - Ecommerce Service'
    });
};

exports.getLogin = (req, res) => {
    res.status(200).render('login', {
        title: 'Themobsterhoard - Signin your account'
    });
};

exports.isAlreadyLogin = (req, res, next) => {
    // if (req.cookies.jwt) return res.status(200).redirect('/');
    next();
};

exports.getAddress2 = catchAsync(async (req, res, next) => {
    const docs = await addressModel.find({ userId: req.user._id });
    req.docs = docs;
    next();
});

exports.myAddress = (req, res) => {
    res.status(200).json({
        status: 'Success',
        docs: req.docs
    });
};

exports.sendBodyDocs = (req, res) =>
    res.status(200).json({ status: 'Success', docs: req.body });

exports.getCategoires = catchAsync(async (req, res, next) => {
    const category = await categorieModel.find({
        for: process.env.WEBSITE_CATEGORY
    });
    res.locals.category = category;

    next();
});
exports.logout = catchAsync((req, res, next) => {
    res.cookie('jwt', 'loggout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    return res.redirect('/');
});

exports.top3SellingCategories = catchAsync(async (req, res, next) => {
    let filterQuery = {};
    if (req.from !== 'mobile') {
        filterQuery = { 'productDetails.for': process.env.WEBSITE_CATEGORY };
    }
    let categories = await orderModel.aggregate([
        {
            $match: filterQuery
        },
        {
            $group: {
                _id: '$productDetails.categorie',
                product: { $sum: 1 }
            }
        },
        {
            $addFields: {
                category: '$_id'
            }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: {
                product: -1
            }
        },
        {
            $limit: 8
        },
        {
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: 'name',
                as: 'categorie'
            }
        },
        {
            $unwind: '$categorie'
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [{ product: '$product' }, '$categorie']
                }
            }
        }
    ]);
    if (!categories.length) {
        categories = await categorieModel
            .find({ for: process.env.WEBSITE_CATEGORY })
            .limit(2);
    } else if (categories.length === 1) {
        const x = await categorieModel
            .findOne({
                for: process.env.WEBSITE_CATEGORY,
                slug: { $ne: categories[0].slug }
            })
            .limit(1);
        categories = [...categories, x];
    }
    req.body.top3Categories = categories;

    return next();
});

exports.getTopCategories = catchAsync(async (req, res, next) => {
    let filterQuery = [];
    let fors = [];
    if (req.from !== 'mobile') {
        filterQuery = { 'productDetails.for': process.env.WEBSITE_CATEGORY };
        fors = { for: process.env.WEBSITE_CATEGORY };
    }

    let products = await orderModel.aggregate([
        {
            $match: { ...filterQuery }
        },
        {
            $group: {
                _id: '$productDetails.productId',
                count: { $sum: 1 }
            }
        },
        {
            $sort: {
                count: -1
            }
        },
        {
            $limit: 10
        },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                pipeline: [
                    {
                        $match: { verified: true }
                    }
                ],
                as: 'product'
            }
        },
        {
            $unwind: '$product'
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [{ count: '$count' }, '$product']
                }
            }
        }
    ]);

    if (products.length !== 10) {
        const y = await productModel.find(fors).limit(10 - products.length);
        products = [...products, ...y];
    }

    req.body.topSetllingProducts = products;

    let dealOfTheDay = await productModel
        .find({
            ...fors,
            verified: true,
            dealOfTheDay: true,
            dealOfTheDayExpires: { $gt: Date.now() }
        })
        .sort({ dealOfTheDayStartsAt: -1 })
        .limit(8);

    let topDeals = await productModel.aggregate([
        {
            $match: {
                ...fors,
                verified: true,
                dealOfTheDay: true,
                dealOfTheDayExpires: { $gt: new Date() }
            }
        },
        {
            $project: {
                price: 1,
                discountPrice: 1,
                percentageDiscount: {
                    $cond: {
                        if: { $gt: ['$discountPrice', 0] },
                        then: {
                            $multiply: [
                                {
                                    $divide: [
                                        {
                                            $subtract: [
                                                '$price',
                                                '$discountPrice'
                                            ]
                                        },
                                        '$price'
                                    ]
                                },
                                100
                            ]
                        },
                        else: 0
                    }
                },
                bannerImage: 1,
                description: 1,
                name: 1,
                ratingsAverage: 1,
                slug: 1,
                id: '$ecmpeId'
            }
        },
        {
            $sort: { percentageDiscount: -1 }
        },
        {
            $limit: 1
        }
    ]);

    const recommendedProduct = await productModel.aggregate([
        { $match: { ...fors } },
        { $sample: { size: 8 } }
    ]);

    if (topDeals.length !== 8) {
        const len = 8 - topDeals.length;
        const a = await productModel.aggregate([
            { $match: { ...fors } },
            { $sample: { size: len } }
        ]);
        topDeals = [...topDeals, ...a];
    }

    if (dealOfTheDay.length !== 8) {
        const len = 8 - dealOfTheDay.length;
        const b = await productModel.aggregate([
            { $match: { ...fors } },
            { $sample: { size: len } }
        ]);

        dealOfTheDay = [...dealOfTheDay, ...b];
    }

    req.body.topDeals = topDeals;
    req.body.dealOfTheDay = dealOfTheDay;
    req.body.recommendedProduct = recommendedProduct;
    req.body.bannerjson1 = banners1;
    req.body.bannerjson2 = banners2;
    return next();
});

exports.getCategories = catchAsync(async (req, res, next) => {
    // const categories = await categorieModel.find({ for: 'themobsterhoard' });
    // req.body.categories = categories;
    return next();
});

// get a product
exports.getAProduct = (req, res, next) =>
    res.render('productDetails', {
        doc: req.body,
        recommendedProduct: req.recom
    });

// get cart price
exports.getCartPrice = catchAsync(async (req, res, next) => {
    let finalRs = {};
    if (req.login) {
        finalRs = { userId: req.user._id, userEId: req.user.ecmuId };
    } else {
        finalRs = { uId: req.cookies.uId };
    }
    const carts = await cartModel.aggregate([
        {
            $match: {
                ...finalRs,
                type: 'cart',
                for: process.env.WEBSITE_CATEGORY
            }
        },
        {
            $lookup: {
                from: 'products',
                localField: 'productId',
                foreignField: '_id',
                pipeline: [
                    {
                        $match: { verified: true }
                    }
                ],
                as: 'product'
            }
        },
        {
            $unwind: '$product'
        }
    ]);
    let price = 0,
        discountPrice = 0,
        finalPrice = 0;
    const products = await Promise.all(
        carts.map(async (el) => {
            switch (el.product.productType) {
                case 'single':
                    el = {
                        bannerImage: el.product.bannerImage,
                        name: el.product.name,
                        price: el.product.price,
                        discountPrice: el.product.discountPrice,
                        type: 'single',
                        quantity: el.quantity,
                        id: el.ecmcmID,
                        product: el.productEId
                    };
                    price = price + el.price * el.quantity;
                    discountPrice =
                        discountPrice + el.discountPrice * el.quantity;
                    finalPrice =
                        (!!el.discountPrice * el.quantity
                            ? el.discountPrice * el.quantity
                            : el.price * el.quantity) + finalPrice;
                    return el;
                    break;
                case 'colorOnly':
                    if (!el.color)
                        return next(new AppError('Invalid product!', 400));
                    let color = false;
                    await Promise.all(
                        el.product.productDetails.map((els) => {
                            if (els.ecmpsId === el.color) {
                                color = els;
                            }
                        })
                    );
                    if (!color)
                        return next(new AppError('Invalid product!', 400));
                    el = {
                        bannerImage: color.bannerImage,
                        price: color.subDetails[0].price,
                        discountPrice: color.subDetails[0].discountPrice,
                        name: el.product.name,
                        color: color.color,
                        colorId: el.color,
                        type: 'colorOnly',
                        quantity: el.quantity,
                        id: el.ecmcmID,
                        product: el.productEId
                    };
                    price = price + color.subDetails[0].price * el.quantity;
                    discountPrice =
                        discountPrice +
                        color.subDetails[0].discountPrice * el.quantity;
                    finalPrice =
                        (!!color.subDetails[0].discountPrice * el.quantity
                            ? color.subDetails[0].discountPrice * el.quantity
                            : color.subDetails[0].price * el.quantity) +
                        finalPrice;
                    return el;
                    break;
                case 'sizeOnly':
                    if (!el.size)
                        return next(new AppError('Invalid product!', 400));
                    let size = false;
                    await Promise.all(
                        el.product.productDetails[0].subDetails.map((els) => {
                            if (els.ecmpssId === el.size) {
                                size = els;
                            }
                        })
                    );
                    if (!size)
                        return next(new AppError('Invalid product!', 400));
                    el = {
                        bannerImage: el.product.productDetails[0].bannerImage,
                        price: size.price,
                        discountPrice: size.discountPrice,
                        name: el.product.name,
                        size: size.size,
                        sizeId: el.size,
                        type: 'sizeOnly',
                        quantity: el.quantity,
                        id: el.ecmcmID,
                        product: el.productEId
                    };
                    price = price + size.price * el.quantity;

                    discountPrice =
                        discountPrice + size.discountPrice * el.quantity;
                    finalPrice =
                        (!!size.discountPrice * el.quantity
                            ? size.discountPrice * el.quantity
                            : size.price * el.quantity) + finalPrice;
                    return el;

                    break;
                case 'colorWithSize':
                    if (!el.color || !el.size) {
                        return next(new AppError('Invalid product!', 400));
                    }
                    let cols = false,
                        sizs = false;
                    const colVals = {};
                    await Promise.all([
                        el.product.productDetails.map(async (els) => {
                            if (els.ecmpsId === el.color) {
                                cols = true;
                                await Promise.all(
                                    els.subDetails.map((els2) => {
                                        if (els2.ecmpssId === el.size)
                                            sizs = true;
                                        colVals.price = els2.price;
                                        colVals.size = els2.size;
                                        colVals.discountPrice =
                                            els2.discountPrice;
                                        colVals.bannerImage = els.bannerImage;
                                        colVals.imageGallery = els.imageGallery;
                                        colVals.color = els.color;
                                        colVals.name = el.product.name;
                                        colVals.quantity = el.quantity;
                                        colVals.type = 'colorWithSize';
                                        colVals.id = el.ecmcmID;
                                        colVals.product = el.productEId;
                                        colVals.colorId = els.ecmpsId;
                                        colVals.sizeId = els2.ecmpssId;
                                    })
                                );
                            }
                        })
                    ]);
                    price = price + colVals.price * colVals.quantity;
                    discountPrice =
                        discountPrice +
                        colVals.discountPrice * colVals.quantity;
                    finalPrice =
                        (!!colVals.discountPrice * colVals.quantity
                            ? colVals.discountPrice * colVals.quantity
                            : colVals.price * colVals.quantity) + finalPrice;
                    if (!cols || !sizs) {
                        return next(new AppError('Invalid product!', 400));
                    }
                    return colVals;

                    break;
            }
        })
    );
    // console.log(finalPrice);
    res.locals.cart = finalPrice;

    return next();
});

exports.getContactus = (req, res) => res.render('contactUs');
