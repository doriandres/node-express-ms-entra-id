import { AccountInfo } from "@azure/msal-node";
declare module 'express-session' {
    interface SessionData {
        zMsalPkceCodes: any;
        zMsalAuthCodeRequest: any;
        zMsalTokenCache: any;
        account: AccountInfo | null;        
        accessToken: string;
        idToken: string;
        isAuthenticated: boolean;
    }
}