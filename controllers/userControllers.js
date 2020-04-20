const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const filteredObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res) => {
  const allUsers = await User.find();
  res.status(200).json({
    status: "success",
    results: allUsers.length,
    data: {
      allUsers,
    },
  });
});

exports.getUserByID = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).json({
      status: "Success",
      data: {
        user,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err,
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        newUser,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "Failed",
      message: err,
    });
  }
};

exports.deleteUserByID = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: "Successfully Deleted User",
      data: {
        user,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err,
    });
  }
};

exports.updateUserByID = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    req.status(200).json({
      status: "Successfully Updated",
      data: {
        user,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "Failed",
      message: err,
    });
  }
};

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        `This is not the route to update passwords. Please use /updateMyPassword.`,
        400
      )
    );
  }
  //filter out unwanted field names that are not allowed to be updated. aka role and pw
  const filteredBody = filteredObj(req.body, "name", "email");
  //update user
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "Success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  //This does not delete but does set the User to inactive
  const user = await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: "Successfully Removed",
    data: null,
  });
});
