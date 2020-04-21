const Plant = require("../models/plantModel");
const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
// const User = require("../models/userModel");
// const User = require("./userControllers");
const User = require("./../models/userModel");

exports.aliasTopPlants = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

exports.getAllPlants = catchAsync(async (req, res, next) => {
  // EXECUTE QUERY
  const features = new APIFeatures(Plant.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const plants = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: "success",
    results: plants.length,
    data: {
      plants,
    },
  });
});

exports.getPlant = catchAsync(async (req, res, next) => {
  // const tour = await Tour.findById(req.params.id);
  const features = new APIFeatures(Plant.findById(req.params.id), req.query);
  // Tour.findOne({ _id: req.params.id })
  const plant = await features.query;

  if (!plant) {
    return next(new AppError(`No plant found with id: ${req.params.id} `, 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      plant: plant,
    },
  });
});

let newestPlantID;

exports.createPlant = catchAsync(async (req, res, next) => {
  const newPlant = await Plant.create(req.body);
  newestPlantID = newPlant._id;
  const update = await User.findByIdAndUpdate(
    req.user._id,
    { $push: { plants: newPlant._id } },
    { new: true }
  );
  const updatePlant = await Plant.findByIdAndUpdate(
    newPlant._id,
    { owner: req.user._id },
    { new: true }
  );
  res.status(201).json({
    status: "success",
    data: {
      newPlant,
      update,
    },
  });
});

exports.updatePlant = catchAsync(async (req, res, next) => {
  const plant = await Plant.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!plant) {
    return next(new AppError(`No plant found with id: ${req.params.id} `, 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      plant,
    },
  });
});

exports.deletePlant = catchAsync(async (req, res, next) => {
  const plant = await Plant.findByIdAndDelete(req.params.id);

  if (!plant) {
    return next(new AppError(`No plant found with id: ${req.params.id} `, 404));
  }
  res.status(204).json({
    status: "success",
    message: "This plant has been deleted",
    data: null,
  });
});

exports.getPlantStats = catchAsync(async (req, res, next) => {
  const stats = await Plant.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: "$difficulty" },
        numPlants: { $sum: 1 },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);

  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Plant.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numPlantStarts: { $sum: 1 },
        plants: { $push: "$name" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numPlantStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      plan,
    },
  });
});
