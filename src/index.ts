import { Request, Response, NextFunction } from "express";
import axios, { AxiosRequestConfig } from "axios";
import { URLSearchParams } from "url";
import https from "https";

export type Options = {
  host: string;
  realm: string;
  client_id: string;
  client_secret: string;
};

export function keycloakMiddleware({
  host,
  realm,
  client_id,
  client_secret,
}: Options) {
  return async (request: Request, response: Response, next: NextFunction) => {
    // assumes bearer token is passed as an authorization header
    if (request.headers.authorization) {
      try {
        const url = `${host}/realms/${realm}/protocol/openid-connect/token/introspect`;

        const token = (request.headers.authorization as string).replace(
          "Bearer ",
          ""
        );

        const data = new URLSearchParams();
        data.append("client_id", client_id);
        data.append("grant_type", "password");
        data.append("client_secret", client_secret);
        data.append("scope", "openid");
        data.append("token", token);

        const requestOptions: AxiosRequestConfig = {
          method: "post",
          url,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          data: data.toString(),
        };

        requestOptions.httpsAgent = new https.Agent({
          rejectUnauthorized: false,
        });

        const axiosResponse = await axios(requestOptions);

        const parsedBody = axiosResponse.data;

        if (
          parsedBody.hasOwnProperty("active") &&
          parsedBody.active === false
        ) {
          return response.status(401).json({
            error: true,
            message: "Unauthorized",
          });
        } else {
          // the token is valid pass request onto your next function
          next();
        }
      } catch (error) {
        next(error);
      }
    } else {
      // there is no token, don't process request further
      return response.status(401).json({
        error: true,
        message: "Unauthorized",
      });
    }
  };
}
