const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const crypto = require("crypto");

const sendMail = require("../util/email");
// import user model
const userModel = require("../models/userModel");

// import async
const catchAsync = require("../util/catchAsync");
const AppError = require("../util/appError");
// const sendSMS = require('../util/sms');
const encryptID = require("../util/encryptID");
const cartModel = require("../models/cartModel");

// create JWT
const signJWT = (id) =>
  jwt.sign({ id }, process.env.JSON_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

// create user session
const sendJWT = (user, statusCode, res) => {
  const token = signJWT(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_DEV === "production") {
    cookieOptions.secure = true;
  }
  res.cookie("jwt", token, cookieOptions);
  user.password = undefined;

  return res.status(200).json({
    status: "Success",
    jwt: token,
  });
};

// product user
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.jwt) {
    token = req.headers.jwt;
    req.from = "mobile";
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
    req.from = "web";
  }

  if (!token) {
    return next(
      new AppError(
        "You are not loggedin. Please login and try to access the page.",
        401
      )
    );
  }
  let decode = "";
  try {
    decode = await promisify(jwt.verify)(token, process.env.JSON_SECRET);
  } catch (err) {
    return next(
      new AppError(
        "You are not loggedin. Please login and try to access the page.",
        401
      )
    );
  }

  const freshUser = await userModel.findById(decode.id);
  if (!freshUser) {
    return next(
      new AppError("The user no longer exist. please create a new account", 401)
    );
  }

  req.user = freshUser;
  next();
});

exports.protectCart = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.jwt) {
    token = req.headers.jwt;
    req.from = "mobile";
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
    req.from = "web";
  }
  if (req.from === "mobile") {
    if (!token) {
      return next(
        new AppError(
          "You are not loggedin. Please login and try to access the page.",
          401
        )
      );
    }
    let decode = "";
    try {
      decode = await promisify(jwt.verify)(token, process.env.JSON_SECRET);
    } catch (err) {
      return next(
        new AppError(
          "You are not loggedin. Please login and try to access the page.",
          401
        )
      );
    }

    const freshUser = await userModel.findById(decode.id);
    if (!freshUser) {
      return next(
        new AppError(
          "The user no longer exist. please create a new account",
          401
        )
      );
    }

    req.user = freshUser;
    next();
  } else {
    req.from = "web";
    const id = await encryptID();
    if (req.cookies.jwt) {
      try {
        const decode = await promisify(jwt.verify)(
          req.cookies.jwt,
          process.env.JSON_SECRET
        );
        const freshUser = await userModel.findById(decode.id);
        if (!freshUser) {
          res.cookie("uId", id);
          return next();
        }
        req.login = true;
        req.user = freshUser;
        res.locals.user = freshUser;
        return next();
      } catch (err) {
        return next();
      }
    }
    if (!req.cookies.uId) res.cookie("uId", id);
    next();
  }
});

exports.verifyVendor = (req, res, next) => {
  if (req.user.accountVerification !== "accepted")
    return next(new AppError("Invalid vendor.", 400));
  return next();
};

exports.isLoggedin = async (req, res, next) => {
  req.from = "web";
  const id = await encryptID();
  if (req.cookies.jwt) {
    try {
      const decode = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JSON_SECRET
      );
      const freshUser = await userModel.findById(decode.id);
      if (!freshUser) {
        res.cookie("uId", id);
        return next();
      }
      req.login = true;
      req.user = freshUser;
      res.locals.user = freshUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  if (!req.cookies.uId) res.cookie("uId", id);
  next();
};
// restrict user
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You did not have the permission to perform this action.",
          403
        )
      );
    }
    next();
  };

exports.verifiedUser = (req, res) => {
  res.status(200).json({
    status: "Success",
    navigation: "Home",
    user: req.user,
  });
};
// genrate otp for user
const generateOtpForUser = async (req, res, next, user) => {
  try {
    const generateOtp = await user.generateOtpForUser();
    await user.save({ validateBeforeSave: false });

    // await sendSMS({
    //   message: `Here is your otp : ${generateOtp}`,
    //   phone: req.body.phone,
    // });
    return generateOtp;
  } catch (err) {
    user.phoneVerificationToken = undefined;
    user.phoneVerificationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError(err.name, 400));
  }
};
// generate otp for user
exports.userOtpGenerate = catchAsync(async (req, res, next) => {
  let data = [];
  if (req.query.role === "vendor") data = { role: "vendor" };
  const user = await userModel.findOne({ phone: req.body.phone, ...data });

  if (req.query.login && !user)
    return next(new AppError("User not found.", 404));

  if (req.query.signup && user)
    return next(new AppError("User already exist.", 400));

  if (!req.body.phone)
    return next(new AppError("Please enter the valid phone numbers.", 400));
  let otp;
  if (!user) {
    req.body.ecmuId = await encryptID();
    if (req.boby?.role && req.body?.role !== "vendor") delete req.body.role;
    req.body.name = req.body.name ?? "Guest-" + Date.now();
    const newUser = await userModel.create(req.body);
    otp = await generateOtpForUser(req, res, next, newUser);
  } else {
    otp = await generateOtpForUser(req, res, next, user);
  }
  return res.status(200).json({ status: "Success", otp });
});

// verify user otp
exports.verifyUserOtp = catchAsync(async (req, res, next) => {
  const token = ((((req.body.otp / 6) * 2) / 4523 - 123) / 1212 + 452).toString(
    26
  );
  const user = await userModel.findOne({
    phone: req.body.phone,
    phoneVerificationToken: token,
    phoneVerificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Not Valid datas", 400));
  }

  user.phoneVerificationToken = undefined;
  user.phoneVerificationTokenExpires = undefined;
  await user.save({ validateBeforeSave: false });
  if (req.cookies.uId) {
    const carts = await cartModel
      .find({
        uId: req.cookies.uId,
        type: "cart",
        for: process.env.WEBSITE_CATEGORY,
      })
      .distinct("productEId");
    if (carts.length) {
      const userCart = await cartModel
        .find({
          userId: user._id,
          type: "cart",
          for: process.env.WEBSITE_CATEGORY,
        })
        .distinct("productEId");
      console.log(carts);
      console.log(userCart);
      const filteredCarts = [];
      const removeCart = [];
      await Promise.all(
        carts.map((el) => {
          if (!userCart.includes(el)) {
            filteredCarts.push(el);
          } else {
          }
        })
      );
      if (filteredCarts.length) {
        await Promise.all(
          filteredCarts.map(async (el) => {
            await cartModel.findOneAndUpdate(
              {
                uId: req.cookies.uId,
                productEId: el,
              },
              {
                userId: user._id,
                userEId: user.ecmuId,
                uId: "-",
              }
            );
          })
        );
      }
      await cartModel.deleteMany({ uId: req.cookies.uId });
    }
  }
  return sendJWT(user, 200, res);
});
