const express = require("express");
require("express-async-errors");
const csrf = require("host-csrf");
const cookieParser = require("cookie-parser");
require("dotenv").config(); // to load the .env file into the process.env object
// const hostCsrf = require("host-csrf");
require("./routes/jobs");

const app = express();
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
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(require("body-parser").urlencoded({ extended: false }));

if (app.get("env") === "production") {
  csrf_development_mode = false;
  app.set("trust proxy", 1); // trust first proxy
  sessionParms.cookie.secure = true; // serve secure cookies
}
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
// let token = csrf.token(req, res);
const csrf_middleware = csrf(csrf_options);
app.use(session(sessionParms));
// const csrfMiddleware = hostCsrf();
// app.use(csrfMiddleware);
app.use(csrf_middleware);

app.use((req, res, next) => {
  if (res.locals._csrf) {
    res.locals.csrfToken = res.locals._csrf; // expose it to EJS
  }
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

// app.use((req, res, next) => {
//   res.locals.csrfToken = req.csrfToken(); // makes it available to all templates
//   next();
// });

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
