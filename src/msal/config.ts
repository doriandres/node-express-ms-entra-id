import { Configuration, LogLevel } from "@azure/msal-node";

export const config: Configuration = {  
  auth: {
    clientId: process.env.CLIENT_ID!,
    authority: process.env.CLOUD_INSTANCE! + process.env.TENANT_ID!,
    clientSecret: process.env.CLIENT_SECRET!
  },
  system: {
    loggerOptions: {
      loggerCallback(
        loglevel: LogLevel,
        message: string,
        containsPii: boolean
      ) {
        if (containsPii) return;

        if (loglevel === LogLevel.Error) {
          console.error('ERROR '+ message);
        } else if (loglevel === LogLevel.Warning) {
          console.warn('WARNING '+message);
        } else {
          let type = 'INFO';
          if (loglevel === LogLevel.Verbose) {
            type = 'VERBOSE';
          }else if (loglevel === LogLevel.Trace) {
            type = 'TRACE';
          }
          console.log(type + ' '+message);
        }
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Warning,
    },
  },
};

export const REDIRECT_URI = process.env.REDIRECT_URI!;
export const POST_LOGOUT_REDIRECT_URI = process.env.POST_LOGOUT_REDIRECT_URI!;
