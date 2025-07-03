const express = require("express");
require("express-async-errors");
const csrf = require("host-csrf");
const cookieParser = require("cookie-parser");
require("dotenv").config(); // to load the .env file into the process.env object
require("./routes/jobs");

const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
const ratelimiter = require("express-rate-limit");

const app = express();

app.use(helmet());
app.use(xss());
app.use(cors());
app.use(
  ratelimiter({
    windowMs: 15 * 60 * 1000,
    max: 100, //limit each IP to 100 requests per windowMs
  })
);
app.set("view engine", "ejs");

app.use(require("body-parser").urlencoded({ extended: true }));

const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const url = process.env.MONGO_URI;

const store = new MongoDBStore({
  uri: url,
  collection: "mySessions",
});
store.on("error", function (error) {
  console.log(error);
});

const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" },
};

app.use(require("body-parser").urlencoded({ extended: true }));

if (app.get("env") === "production") {
  app.set("trust proxy", 1); // trust first proxy
  sessionParms.cookie.secure = true; // serve secure cookies
}
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(express.urlencoded({ extended: false }));

let csrf_development_mode = true;
if (app.get("env") === "production") {
  csrf_development_mode = false;
  app.set("trust proxy", 1); // trust first proxy
}

const csrf_options = {
  protected_operations: ["PATCH"],
  protected_content_types: ["application/json"],
  development_mode: csrf_development_mode,
};

const csrf_middleware = csrf(csrf_options);

app.use(session(sessionParms));

app.use((req, res, next) => {
  next();
});

const passport = require("passport");
const passportInit = require("./passport/passportInit");
passportInit();
app.use(passport.initialize());
app.use(passport.session());
app.use(require("connect-flash")());
app.use(require("./middleware/storeLocals"));

app.get("/", csrf_middleware, (req, res) => {
  res.render("index");
});
app.use("/sessions", require("./routes/sessionRoutes"));

const auth = require("./middleware/auth");
const jobs = require("./routes/jobs");
app.use("/jobs", auth, jobs);

const secretWordRouter = require("./routes/secretWord");
app.use("/secretWord", auth, secretWordRouter);

app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).send("Invalid CSRF token.");
  }
  res.status(500).send(err.message);
  console.log(err);
});

app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

app.use((err, req, res, next) => {
  if (err instanceof csrf.CSRFError) {
    // Token invalid or missing
    req.flash("error", "Invalid CSRF token, please try again.");
    return res.redirect("back"); // or wherever you want
  }
  next(err);
});

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await require("./db/connect")(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
