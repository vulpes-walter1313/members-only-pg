import asyncHandler from "express-async-handler";
import HttpError from "../lib/HttpError";
import { body, query, validationResult, matchedData } from "express-validator";
import * as Posts from "../models/posts";
import { DateTime } from "luxon";
import * as Users from "../models/users";
import bcrypt from "bcryptjs";
import { type Request, type Response, type NextFunction } from "express";
import { isLoggedIn } from "../middleware/authcheck";
import passport from "passport";
import he from "he";

export const indexGet = [
  query("page").optional().isInt(),
  asyncHandler(async (req, res, next) => {
    const valResult = validationResult(req);
    if (!valResult.isEmpty()) {
      const error = new HttpError("validation error in page query param", 400);
      next(error);
      return;
    }
    const isLoggedIn = req.user !== undefined;
    const data = matchedData(req);
    let page = parseInt(data.page || "1");
    const limit = 5;
    const totalCount = await Posts.getPostsCount();
    const totalPages = Math.ceil(totalCount / limit);
    if (page > totalPages) page = totalPages;
    if (page <= 0) page = 1;
    const seeAnonymous =
      req.user === undefined || (req.user && req.user.is_member === false);
    const posts = await Posts.getPosts(seeAnonymous, page, limit);
    const displayPosts = posts.map((post) => {
      return {
        ...post,
        title: he.decode(post.title),
        body: he.decode(post.body),
        created_at: DateTime.fromJSDate(post.created_at).toLocaleString(
          DateTime.DATETIME_MED,
        ),
        updated_at: DateTime.fromJSDate(post.updated_at).toLocaleString(
          DateTime.DATETIME_MED,
        ),
      };
    });
    const pagesArr: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pagesArr.push(i);
    }
    res.render("index", {
      title: "Members Only Club",
      isLoggedIn: isLoggedIn,
      posts: displayPosts,
      pagesArr: pagesArr,
      currentPage: page,
    });
  }),
];

export const signupGet = asyncHandler(async (req, res, next) => {
  res.render("signup", { title: "Sign Up To Our VIP Message Board" });
});

export const signupPost = [
  body("first_name").trim().isLength({ min: 3, max: 24 }).escape(),
  body("last_name").trim().isLength({ min: 3, max: 24 }).escape(),
  body("username")
    .trim()
    .isEmail()
    .custom(async (value) => {
      const user = await Users.getUserByEmail(value);
      if (user) {
        throw new Error("Email already in use.");
      }
    }),
  body("password").isLength({ min: 8, max: 64 }),
  body("confirmPassword").custom((val, { req }) => {
    return val === req.body.password;
  }),
  asyncHandler(async (req, res, next) => {
    const valResult = validationResult(req);
    if (!valResult.isEmpty()) {
      console.log(
        "indexController signupPost validErrors: ",
        valResult.mapped(),
      );
      res.status(400).render("signup", {
        title: "Sign Up To Our VIP message Board",
        validErrors: valResult.mapped(),
      });
      return;
    }
    const { first_name, last_name, username, password } = matchedData(req);
    // hash password
    const passwordHash = await bcrypt.hash(password, 10);
    // create user
    await Users.createUser({
      first_name,
      last_name,
      username,
      password: passwordHash,
    });
    //redirect to login
    res.redirect("/login");
    return;
  }),
];

export const loginGet = (req: Request, res: Response, next: NextFunction) => {
  res.render("login", { title: "Login to see who is posting" });
};

export const loginPost = [
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  }),
];

export const logoutGet = [
  (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) return next(err);
      res.redirect("/");
    });
  },
];

export const membershipGet = [
  isLoggedIn,
  (req: Request, res: Response, next: NextFunction) => {
    res.render("membership", { title: "Become A Member Today!" });
  },
];

export const membershipPost = [
  isLoggedIn,
  body("password")
    .notEmpty()
    .withMessage("You need to put a password")
    .custom((val) => {
      return val === process.env.MEMBERSHIP_PASSWORD!;
    })
    .withMessage("Password is incorrect"),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const valResult = validationResult(req);
    if (!valResult.isEmpty()) {
      res.render("membership", {
        title: "Become A Member Today!",
        validErrors: valResult.mapped(),
      });
      return;
    }
    const { password } = matchedData(req);
    const isPasswordMatch = password === process.env.MEMBERSHIP_PASSWORD!;
    if (isPasswordMatch) {
      await Users.updateUserMembership(req.user?.id!, true);
      res.redirect("/welcome-new-member");
      return;
    } else {
      // password dont watch
      res.render("membership", {
        title: "Become A Member Today!",
        validErrors: valResult.mapped(),
      });
      return;
    }
  }),
];

export const welcomeNewMemberGet = [
  isLoggedIn,
  (req: Request, res: Response, next: NextFunction) => {
    res.render("welcomeMember", { title: `Welcome, ${req.user?.first_name}` });
  },
];

export const becomeAdminGet = [
  isLoggedIn,
  (req: Request, res: Response, next: NextFunction) => {
    res.render("becomeAdmin", {
      title: "Do You Have What Is Takes To Be An Admin?",
    });
  },
];

export const becomeAdminPost = [
  isLoggedIn,
  body("password")
    .notEmpty()
    .withMessage("You need to provide a password")
    .custom((val) => {
      return val === process.env.ADMIN_PASSWORD!;
    })
    .withMessage("Password is incorrect"),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const valResult = validationResult(req);
    if (!valResult.isEmpty()) {
      res.render("becomeAdmin", {
        title: "Do You Have What Is Takes To Be An Admin?",
        validErrors: valResult.mapped(),
      });
      return;
    }
    // password is already validated and correct here
    await Users.updateUserAdminStatus(req.user?.id!, true);
    res.redirect("/welcome-new-admin");
    return;
  }),
];

export const welcomeNewAdminGet = [
  isLoggedIn,
  (req: Request, res: Response, next: NextFunction) => {
    res.render("welcomeAdmin", {
      title: `Welcome new Admin, ${req.user?.first_name}`,
    });
  },
];
