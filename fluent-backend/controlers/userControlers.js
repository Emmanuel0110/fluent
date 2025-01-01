import auth from "../middleware/auth.js";
import { UserModel } from "../models.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import express from "express";
const router = express.Router();

//register
router.post("/", function (req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }
  UserModel.findOne({ username }).then((user) => {
    if (user) return res.status(400).json({ msg: "User already exists" });
  });
  const newUser = new UserModel({
    _id: new mongoose.Types.ObjectId(),
    username,
    password,
  });
  // Create salt & hash
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newUser.password, salt, (err, hash) => {
      if (err) throw err;
      newUser.password = hash;
      newUser.save().then((newUser) => {
        let user = newUser.toObject();
        if (err) {
          console.log("save error ", err);
          if (err.name === "MongoError" && err.code === 11000) {
            // Duplicate error happened. You can handle it separately.
            res.json({ success: false, message: "already exists" });
            return;
          }
          // Some other error happened, you might also want to handle it.
          res.json({ success: false, message: "some error happened" });
          return;
        }

        jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: 3600 * 8 }, (err, token) => {
          if (err) throw err;
          delete user.password;
          res.json({ token, user });
        });
      });
    });
  });
});

//login
router.post("/auth", function (req, res) {
  const { username, password } = req.body;
  console.log("req.body2", req.body);
  if (!username || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }
  UserModel.findOne({ username: username.trim() })
    .select("+password")
    .then((user) => {
      if (!user) return res.status(400).json({ msg: "User does not exist" });

      //Validate password
      bcrypt.compare(password, user.password).then((isMatch) => {
        if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

        jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: 3600 * 8 }, async (err, token) => {
          if (err) throw err;
          delete user.password;
          const lastCourse = await UserCourseModel.findOne({ _id: user.lastCourseId });
          if (lastCourse) {
            redisClient.setex(`userLearningData:${user._id}`, 3600, JSON.stringify(lastCourse));
          }

          res.json({ token, user });
        });
      });
    });
});

router.get("/auth", auth, function (req, res) {
  UserModel.findById(req.user._id).then((user) => res.json({ user }));
});

export default router;
