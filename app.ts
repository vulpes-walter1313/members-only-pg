import "dotenv/config";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import http from "node:http";
import HttpError from "./lib/HttpError";
import path from "node:path";
import indexRouter from "./routes/indexRouter";
import postRouter from "./routes/postRouter";
import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import db from "./db/pool";
import bcrypt from "bcryptjs";
import pgSimple from "connect-pg-simple";
import logger from "morgan";
const pgSession = pgSimple(session);
// const pgSession = require("connect-pg-simple")(session)

const app = express();
const PORT = parseInt(process.env.PORT || "3000");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("port", PORT);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(logger("dev"));
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === "production" ? true : false,
      partitioned: true,
      sameSite: "lax",
    },
    store: new pgSession({
      pool: db,
      createTableIfMissing: true,
    }),
  }),
);

passport.use(
  new LocalStrategy.Strategy(async (username, password, done) => {
    try {
      const { rows } = await db.query(
        `SELECT *
      FROM users
      WHERE username = $1
      `,
        [username],
      );
      const user = rows[0];

      if (!user) {
        return done(null, false, { message: "Incorrect username or password" });
      }
      const passwordsMatch = await bcrypt.compare(password, user.password);

      if (!passwordsMatch) {
        return done(null, false, { message: "Incorrect username or password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }),
);
passport.serializeUser((user, done) => {
  //@ts-ignore
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await db.query(`SELECT * FROM users WHERE id = $1`, [id]);
    const user = rows[0];
    done(null, user);
  } catch (err) {
    done(err);
  }
});
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

app.use("/", indexRouter);
app.use("/posts", postRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  const error = new HttpError("Page does not exist.", 404);
  next(error);
});

// error handler
app.use(function (
  err: HttpError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

const server = http.createServer(app);

server.listen(PORT);
server.on("error", onError);
server.on("listening", onListening);
function onError(error: Error & { syscall?: string; code?: string }) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof PORT === "string" ? "Pipe " + PORT : "Port " + PORT;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr?.port;
  console.log("Listening on " + bind);
}
