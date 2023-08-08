import dotenv from "dotenv";
dotenv.config(); // Load .env file !important initialize before other imports
import express, { Express, Request, Response } from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import * as msal from "./msal/middlewares";

const app: Express = express();

app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  })
);
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/login", msal.login());
app.post("/redirect", msal.redirect());
app.get("/logout", msal.logout());

app.get("/", msal.authenticate(), (req: Request, res: Response) => {
  res.send("Hello " + req.session.account?.name + "!");
});
app.get("/profile", msal.authenticate(["User.Read"]), (req: Request, res: Response) => {
    res.json(req.session.account);
});

app.listen(process.env.PORT || 3000, () => console.log(`Ready on http://localhost:${process.env.PORT || 3000}`));
