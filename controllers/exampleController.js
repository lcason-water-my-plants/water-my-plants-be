const Example = require("../models/exampleModel");
const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.aliasTopExamples = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

exports.getAllExamples = catchAsync(async (req, res, next) => {
  // EXECUTE QUERY
  const features = new APIFeatures(Example.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const examples = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: "success",
    results: examples.length,
    data: {
      examples,
    },
  });
});

exports.getExample = catchAsync(async (req, res, next) => {
  // const tour = await Tour.findById(req.params.id);
  const features = new APIFeatures(Example.findById(req.params.id), req.query);
  // Tour.findOne({ _id: req.params.id })
  const example = await features.query;

  if (!example) {
    return next(
      new AppError(`No example found with id: ${req.params.id} `, 404)
    );
  }
  res.status(200).json({
    status: "success",
    data: {
      example: example,
    },
  });
});

exports.createExample = catchAsync(async (req, res, next) => {
  const newExample = await Example.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      example: newExample,
    },
  });
});

exports.updateExample = catchAsync(async (req, res, next) => {
  const example = await Example.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!example) {
    return next(
      new AppError(`No example found with id: ${req.params.id} `, 404)
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      example,
    },
  });
});

exports.deleteExample = catchAsync(async (req, res, next) => {
  const example = await Example.findByIdAndDelete(req.params.id);

  if (!example) {
    return next(
      new AppError(`No example found with id: ${req.params.id} `, 404)
    );
  }
  res.status(204).json({
    status: "success",
    message: "This example has been deleted",
    data: null,
  });
});

exports.getExampleStats = catchAsync(async (req, res, next) => {
  const stats = await Example.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: "$difficulty" },
        numExamples: { $sum: 1 },
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

  const plan = await Example.aggregate([
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
        numExampleStarts: { $sum: 1 },
        examples: { $push: "$name" },
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
      $sort: { numExampleStarts: -1 },
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
