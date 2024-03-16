const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.ObjectId,
            ref: 'Users'
        },
        userEId: {
            type: String
        },
        for: {
            type: String,
            enum: [process.env.CATEGORYA, process.env.CATEGORYB],
            required: [true, 'Product must contain website']
        },
        productId: {
            type: mongoose.Schema.ObjectId,
            ref: 'Products',
            requried: true
        },
        productEId: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            min: 1,
            default: 1,
            required: [true, 'Cart must Contain quantity']
        },
        ecmcmID: {
            type: String,
            required: true,
            unique: true
        },
        productType: {
            type: String,
            enum: ['single', 'colorOnly', 'sizeOnly', 'colorWithSize'],
            required: true
        },
        color: {
            type: String
        },
        size: {
            type: String
        },
        type: {
            type: String,
            required: true,
            enum: ['order', 'cart']
        },
        uId: String
    },
    { timestamps: true }
);
cartSchema.pre(/^find/, function (next) {
    this.populate([
        {
            path: 'productId',
            select: 'name bannerImage price categories discountPrice description productType createdAt vendor for active'
        }
    ]);
    next();
});

const cartModel = mongoose.model('Cart', cartSchema);

module.exports = cartModel;
