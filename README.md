# NodeJS Express MS Entra ID (AAD)
NodeJS + Express + Microsoft Entra ID (formerly Azure Active Directory) simple demo setup

## Code Peek
```ts
// Custom auth endpoints to handle OAuth protocol interactions
app.get("/login", msal.login());
app.post("/redirect", msal.redirect());
app.get("/logout", msal.logout());

// Root endpoint is protected
app.get("/", msal.authenticate(), (req: Request, res: Response) => {
  res.send("Hello " + req.session.account?.name + "!");
});

// Profile endpoint is protected and requires an specific scope
app.get("/profile", msal.authenticate(["User.Read"]), (req: Request, res: Response) => {
    // req.session.idToken is also available to call downstream APIs using Bearer Token
    res.json(req.session.account);
});
```
