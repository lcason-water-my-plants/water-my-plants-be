const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  photo: String, //URL TO PHOTO
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"], //OPTIONS FOR ROLES
    default: "user", //ALWAYS SET DEFAULT TO USER
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false, //Don't show password to users
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (el) {
        return el === this.password; //checks to see if password in confirm is the same as first password
      },
      message: "Passwords do not match!",
    },
  },
  passwordChangedAt: Date, //last time PW was changed
  passwordResetToken: String, //temp reset token so it can be changed if forgotten
  passwordResetExpires: Date, //allows temp token to expire if changing pw
  active: {
    //This is so you can deactive a user without actually deleting them from the system.
    type: Boolean,
    default: true,
    select: false,
  },
  plants: Array,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  //^only run if PW was actually modified
  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined; //keep it from persisting in the DB
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  //this is an instance method
  return await bcrypt.compare(candidatePassword, userPassword); //comparing the two passed in PW to make sure they're correct
};

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000; //-1000 is just to make sure the DB doesn't update weird and cause a bug because it updated too quickly
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: true }); //this finds and returns only the active users
  next();
});

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    if (changedTimestamp >= JWTTimestamp) {
      return true;
    }
  }
  //False means not changed.
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
