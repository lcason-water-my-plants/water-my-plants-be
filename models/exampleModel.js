const mongoose = require("mongoose");
const slugify = require("slugify");
const validator = require("validator");

//replace example with name of item you're making a schema for. Pay attention to Case here.
//This was previously used to add Tours but can be altered.
const exampleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A example must have a name"],
      unique: true, //no duplicates in this field
      trim: true, //if someone leaves white space trim it
      maxlength: [
        40,
        "A example name must have less or equal then 40 characters",
      ],
      minlength: [
        10,
        "A example name must have more or equal then 10 characters",
      ],
      validate: [
        validator.isAlpha,
        "example name must only contain characters",
      ],
    },
    slug: String,
    duration: {
      //This is just a field example, not required.
      type: Number,
      required: [true, "A example must have a duration"],
    },
    maxGroupSize: {
      //This is just a field example, not required.
      type: Number,
      required: [true, "A example must have a group size"],
    },
    difficulty: {
      //This is just a field example, not required.
      type: String,
      required: [true, "A example must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy, medium, difficult",
      },
    },
    ratingsAverage: {
      //This is just a field example, not required.
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
    },
    ratingsQuantity: {
      //This is just a field example, not required.
      type: Number,
      default: 0,
    },
    price: {
      //This is just a field example, not required.
      type: Number,
      required: [true, "A example must have a price"],
    },
    priceDiscount: {
      //This is just a field example, not required.
      type: Number,
      validate: {
        validator: function (val) {
          //use regular function here so you can use the this. option. "this" doesn't work with arrow functions.
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: "Discount price ({VALUE}) should be below regular price",
      },
    },
    summary: {
      //This is just a field example, not required.
      type: String,
      trim: true,
      required: [true, "A example must have a description"],
    },
    description: {
      //This is just a field example, not required.
      type: String,
      trim: true,
    },
    imageCover: {
      //This is just a field example, not required. This will just be the URL to the image
      type: String,
      required: [true, "A example must have a cover image"],
    },
    images: [String],
    createdAt: {
      //This is the date and time the doc was created
      type: Date,
      default: Date.now(),
      select: false, //This means it will not be shown to the client
    },
    startDates: [Date], //an array of dates
    secretExample: {
      //This is just a field example, not required.
      type: Boolean,
      default: false, //Sets the default of a field. This one is a boolean so it has false as a default
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

exampleSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7; //This is an example of a virtual getter, showing how many weeks in a example
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
exampleSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// QUERY MIDDLEWARE
exampleSchema.pre(/^find/, function (next) {
  this.find({ secretExample: { $ne: true } }); //Only allows examples that are Not Equal ($ne) to secretExample:true to be shown

  this.start = Date.now(); //When the query starts, not necessary
  next();
});

exampleSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`); //not necessary, just to show how long the query took
  next();
});

// AGGREGATION MIDDLEWARE
exampleSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { secretExample: { $ne: true } } });

  console.log(this.pipeline());
  next();
});

const Example = mongoose.model("Example", exampleSchema);

module.exports = Example;
