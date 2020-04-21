const util = require("util");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const sendEmail = require("../utils/email");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    status: "Success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    //These are the only fields required for new user sign up
  });
  createSendToken(newUser, 201, res); //Plus new token
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //destructring above...
  //   const password = req.body.password;
  //   const email = req.body.email;
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  const user = await User.findOne({ email }).select("+password"); //Password is hidden in the schema but we need to see it here so we can confirm it's correct

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //This is to make sure that the user is authenticated before accessing a protected route.
  //1. Getting token and check if it's there
  let token;
  if (
    req.headers.authorization && //if there is a header authorization
    req.headers.authorization.startsWith("Bearer") //and it starts with Barer
  ) {
    token = req.headers.authorization.split(" ")[1]; //split the Barer portion from the token and just give me the token
  }
  if (!token) {
    return next(
      new AppError("You are not logged in, please log in to get access", 401)
    );
  }
  //2. validate the token, see if it's verified
  const decoded = await util.promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );
  //3. Check if user exists

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token no longer exists")
    );
  }
  //4.Check if user changed password after the token is issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed passwords. Please log in again", 401)
    );
  }

  //YOU MADE IT! GRANT ACCESS!
  req.user = currentUser;
  next();
});

//Restricting to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //Roles is an array
    if (!roles.includes(req.user.role)) {
      //If the users role isn't listed in the included roles for this route... do not allow.
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

//Password Reset
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1. Get user based on email --This is all the user will probably know
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("No user found with this email address", 404));
  }
  //2. Generate random token

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //Must save to change the temp token. Don't validate because it will require PW and other things we have set to validate in the schema

  //3. Send back as an email
  const resetURL = `${req.protocol}://${req.get(
    //protocol is whether it's http or https, req.get host will determine the host name... ie localhost3000 or lindsey-cason-heroku.com etc
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`; //This whole link will be sent to the users email so they can reset their password.

  const message = `Forgot your password? Submit a PATCH request with your new password and password confirm to ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
  try {
    await sendEmail({
      email: user.email, //where the message will go
      subject: "Your password reset token. (Valid for 10 mins)", //This is whats in the amil
      message, //message body of email
    });

    res.status(200).json({
      status: "success",
      message: `Token sent to email!`,
    });
  } catch (err) {
    user.passwordResetToken = undefined; //If there is an error, clear the reset Toke and the expiration time
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(`There was an error sending the email. Try again later`, 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1. Get user based on the token
  //2. If token has not expired and there is a user, set the new password
  //3. Update the changedPasswordAt prop for the current user.
  //4. Log the user in, sent JWT.

  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex"); //token will now be in the URL because we sent the link containing a token to the user

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); //leave validators on to check PW match

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1. Get user from collection
  //3. If correct, then update the password
  //4. Log in the user with the new password
  const user = await User.findById(req.user.id).select("+password");
  //2. Check if password is correct

  if (
    !user ||
    !(await user.correctPassword(req.body.password, user.password))
  ) {
    return next(new AppError("Current password is incorrect", 403));
  }
  user.password = req.body.updatedPassword;
  user.passwordConfirm = req.body.updatedPasswordConfirm;
  await user.save();

  createSendToken(user, 200, res);
});
