// Based on https://github.com/Azure-Samples/ms-identity-node

import { Request, Response, NextFunction } from "express";
import { ConfidentialClientApplication, CryptoProvider, ResponseMode, AuthorizationCodeRequest } from "@azure/msal-node";
import { config, REDIRECT_URI, POST_LOGOUT_REDIRECT_URI } from "./config";

const cryptoProvider = new CryptoProvider();
const msalInstance = new ConfidentialClientApplication(config);

export const login = (scopes?: string[], successRedirect?: string) => async (req: Request, res: Response, next: NextFunction) => {
  const state = cryptoProvider.base64Encode(JSON.stringify({ successRedirect: successRedirect || "/" }));

  const authCodeRequest: Partial<AuthorizationCodeRequest> = {
    state: state,
    scopes: scopes || [],
    redirectUri: REDIRECT_URI,
  };

  const { verifier, challenge } = await cryptoProvider.generatePkceCodes();

  req.session.zMsalPkceCodes = { challengeMethod: "S256", verifier, challenge, };
  req.session.zMsalAuthCodeRequest = { ...authCodeRequest, code: "" };

  try {
    const authCodeUrlResponse = await msalInstance.getAuthCodeUrl({
      ...authCodeRequest,
      responseMode: ResponseMode.FORM_POST,
      codeChallenge: req.session.zMsalPkceCodes.challenge,
      codeChallengeMethod: req.session.zMsalPkceCodes.challengeMethod,
    } as AuthorizationCodeRequest);

    res.redirect(authCodeUrlResponse);
  } catch (error) {
    next(error);
  }
};

export const authenticate = (scopes?: string[]) => async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.isAuthenticated) {
    login(scopes, req.url)(req, res, next);
  } else {
    try {
      if (req.session.zMsalTokenCache) {
        msalInstance.getTokenCache().deserialize(req.session.zMsalTokenCache);
      }

      const tokenResponse = await msalInstance.acquireTokenSilent({ account: req.session.account!, scopes: scopes || [] });
      req.session.zMsalTokenCache = msalInstance.getTokenCache().serialize();
      req.session.accessToken = tokenResponse?.accessToken;
      req.session.idToken = tokenResponse?.idToken;
      req.session.account = tokenResponse?.account;

      next();
    } catch (error) {
      return login(scopes, req.url)(req, res, next);
    }
  }
};

export const redirect = () => async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body || !req.body.state) {
      return next(new Error("Error: response not found"));
    }

    const authCodeRequest: AuthorizationCodeRequest = {
      ...req.session.zMsalAuthCodeRequest,
      code: req.body.code,
      codeVerifier: req.session.zMsalPkceCodes.verifier,
    };

    try {
      if (req.session.zMsalTokenCache) {
        msalInstance.getTokenCache().deserialize(req.session.zMsalTokenCache);
      }

      const tokenResponse = await msalInstance.acquireTokenByCode(authCodeRequest, req.body);

      req.session.zMsalTokenCache = msalInstance.getTokenCache().serialize();
      req.session.idToken = tokenResponse.idToken;
      req.session.account = tokenResponse.account;
      req.session.isAuthenticated = true;

      const state = JSON.parse(cryptoProvider.base64Decode(req.body.state));
      res.redirect(state.successRedirect);
    } catch (error) {
      next(error);
    }
};

export const logout = (postLogoutRedirectUri?: string) => (req: Request, res: Response, _: NextFunction) => {
  let logoutUri = `${config.auth.authority}/oauth2/v2.0/`;
  postLogoutRedirectUri = postLogoutRedirectUri || POST_LOGOUT_REDIRECT_URI;
  if (postLogoutRedirectUri) {
    logoutUri += `logout?post_logout_redirect_uri=${postLogoutRedirectUri}`;
  }
  req.session.destroy(() => res.redirect(logoutUri));
};
