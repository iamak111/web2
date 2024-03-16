// import mongoose
const mongoose = require('mongoose');

// import bcrypt
const bcrypt = require('bcrypt');
const crypto = require('crypto');
// import validaor
const validator = require('validator');

// create mongoose schema for user
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: [true, 'User must have a name.']
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            // required: [true, 'Email should be included'],
            validate: [validator.isEmail, 'Please Enter the valide Email.']
        },
        verifyDocuments: { type: [String], select: false },
        profile: {
            type: String,
            default: 'default.jpg'
        },
        accountVerification: {
            type: Boolean,
            default: false
        },
        phone: {
            type: String,
            required: true,
            unique: true
        },
        phoneVerificationToken: String,
        phoneVerificationTokenExpires: Date,
        accountVerificationToken: String,
        accountVerificationExpires: Date,
        passwordResetToken: String,
        passwordResetTokenExpires: Date,
        passwordChangeAt: Date,
        role: {
            type: String,
            enum: ['user', 'vendor', 'admin'],
            default: 'user'
        },

        ecmuId: {
            type: String,
            required: true,
            unique: true
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        timestamps: true
    }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    this.conformPassword = undefined;
    next();
});

userSchema.virtual('userAddress', {
    ref: 'userAddress',
    foreignField: 'user',
    localField: '_id'
});

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// check password is correct
userSchema.methods.checkPassword = async function (userPassword, dataPassword) {
    return await bcrypt.compare(userPassword, dataPassword);
};

// check token session
userSchema.methods.checkPassAfterToken = function (JWTCreatDate) {
    if (this.passwordChangeAt) {
        const getPerfectTime = parseInt(
            this.passwordChangeAt.getTime() / 1000,
            10
        );

        return JWTCreatDate < getPerfectTime;
    }
    return false;
};

userSchema.methods.forgotPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};
userSchema.methods.generateOtpForUser = function () {
    const conformationtoken = Math.floor(100000 + Math.random() * 900000);
    this.phoneVerificationToken = (
        (((conformationtoken / 6) * 2) / 4523 - 123) / 1212 +
        452
    ).toString(26);
    this.phoneVerificationTokenExpires = Date.now() + 10 * 60 * 1000;

    return conformationtoken;
};
userSchema.methods.userConformationToken = function () {
    const conformationtoken = crypto.randomBytes(60).toString('hex');
    this.accountVerificationToken = crypto
        .createHash('sha256')
        .update(conformationtoken)
        .digest('hex');
    this.accountVerificationExpires = Date.now() + 10 * 60 * 1000;
    return conformationtoken;
};
// create a model for user
const userModel = mongoose.model('Users', userSchema);

// export user model
module.exports = userModel;
