const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const uri = process.env.mongo_uri;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  userid: Number,
  log: []
});

const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/exercise/users", (req, res) => {
  User.find().exec((err, result) => {
    let userArray = result.map(obj => {
      let item = { _id: obj._id, username: obj.username };
      return item;
    });
    res.send(userArray);
  });
});

app.get("/api/exercise/log/:input", (req, res) => {
  console.log(req.params.input);
  User.find({ _id: req.params.input }).exec((err, result) => {
    res.json(...result);
  });
});

app.post("/api/exercise/new-user", (req, res) => {
  let userName = req.body;
  let newUser = new User(userName);

  User.findOne({ username: newUser.username }).exec((err, result) => {
    if (result == null) {
      newUser
        .save()
        .then(item => {
          res.json(item);
        })
        .catch(err => {
          res.status(400).send("unable to save to database");
        });
    } else {
      res.send("Sorry, " + newUser.username + " is already in use.");
    }
  });
});

app.post("/api/exercise/add", (req, res) => {
  let newDate = 0;

  if (req.body.date == "" || req.body.date == undefined || new Date(req.body.date) == "Invalid Date"){
    newDate = new Date().toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } else {
    newDate = new Date(req.body.date).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  User.findOneAndUpdate(
    { _id: req.body.userId },
    {
      $push: {
        log: {
          date: newDate.replace(/,/g, ""),
          duration: parseInt(req.body.duration),
          description: req.body.description
        }
      }
    },
    { new: true, upsert: true },
    (err, user) => {
      res.send({
        _id: user._id,
        username: user.username,
        ...user.log[user.log.length - 1]
      });
    }
  );
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
