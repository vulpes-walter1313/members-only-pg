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

const app = express();
const PORT = parseInt(process.env.PORT || "3000");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("port", PORT);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", indexRouter);

// catch 404 and forward to error handler
app.use("*", function (req, res, next) {
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
