const mongoose = require("mongoose");
const slugify = require("slugify");
const validator = require("validator");
const PP = require("./../controllers/plantController");
const User = require("../models/userModel");
const userCont = require("../controllers/userControllers");

//replace example with name of item you're making a schema for. Pay attention to Case here.
//This was previously used to add Tours but can be altered.
const plantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A plant must have a name"],
      unique: true, //no duplicates in this field
      trim: true, //if someone leaves white space trim it
      maxlength: [
        40,
        "A plant name must have less or equal then 30 characters",
      ],
      minlength: [1, "A plant name must have more or equal then 1 character"],
      validate: [validator.isAlpha, "Plant name must only contain characters"],
    },
    slug: String,
    species: {
      type: String,
      default: "Just a plant",
    },
    edible: {
      type: Boolean,
      default: false,
    },
    sunAmount: {
      type: Number,
      default: 0,
      max: [24, "Must be less tha 24hrs"],
    },
    waterAmount: {
      type: Number,
      default: 0,
      required: [true, "Please indicate amount of water per scheduled time."],
    },
    wateringSchedule: {
      type: Array,
      required: [true, "You must pick a watering schedule"],
      // enum: {
      //   values: [],
      //   message: "Pick the days of the week your plan needs to be watered.",
      // },
    },
    plantImage: {
      type: String,
      default: "https://ibb.co/y615bHC",
    },
    locationOfPlant: {
      type: String,
    },
    description: {
      //This is just a field example, not required.
      type: String,
      trim: true,
    },
    createdAt: {
      //This is the date and time the doc was created
      type: Date,
      default: Date.now(),
      select: false, //This means it will not be shown to the client
    },
    active: {
      type: Boolean,
      default: true,
    },
    owner: Array,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// plantSchema.virtual("durationWeeks").get(function () {
//   return this.duration / 7; //This is an example of a virtual getter, showing how many weeks in a example
// });
// DOCUMENT MIDDLEWARE: runs before .save() and .create()
plantSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// QUERY MIDDLEWARE
plantSchema.pre(/^find/, function (next) {
  this.find({ secretPlant: { $ne: true } }); //Only allows examples that are Not Equal ($ne) to secretExample:true to be shown

  this.start = Date.now(); //When the query starts, not necessary
  next();
});

plantSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`); //not necessary, just to show how long the query took
  next();
});

// AGGREGATION MIDDLEWARE
plantSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { secretPlant: { $ne: true } } });

  console.log(this.pipeline());
  next();
});

const Plant = mongoose.model("Plant", plantSchema);

module.exports = Plant;
