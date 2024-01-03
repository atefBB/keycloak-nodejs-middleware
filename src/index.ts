import { Request, Response, NextFunction } from "express";
import fetch, { Headers, RequestInfo, RequestInit } from "node-fetch-commonjs";
import { Agent } from "https";
import { readFileSync } from "fs";
import { join } from "path";

// Path to the custom certificate bundle
const customCertBundlePath = join(
  __dirname,
  "../node_modules/node_extra_ca_certs_mozilla_bundle/ca_bundle/ca_intermediate_root_bundle.pem"
);

// Read the custom certificate bundle
const customCertBundle = readFileSync(customCertBundlePath, "utf-8");

export type Options = {
  host: string;
  realm: string;
  client_id: string;
  client_secret: string;
};

// Custom fetch function with the custom certificate bundle
const customFetch = async (url: RequestInfo, options?: RequestInit) => {
  const agent = new Agent({ ca: customCertBundle });
  return fetch(url, { agent, ...options });
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
        const myHeaders = new Headers();

        myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

        const urlencoded = new URLSearchParams();

        urlencoded.append("client_id", client_id);
        urlencoded.append("grant_type", "password");
        urlencoded.append("client_secret", client_secret);
        urlencoded.append("scope", "openid");

        // supposing that you send the token in the `authorization` header as follow:
        // `authorization: Bearer ${token}`
        const token = (request.headers.authorization as string).replace(
          "Bearer ",
          ""
        );
        urlencoded.append("token", token);

        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: urlencoded,
          redirect: "follow",
        } as any;

        const url = `${host}/realms/${realm}/protocol/openid-connect/token/introspect`;
        const rawResponse = await customFetch(url, requestOptions);

        let body: any = await rawResponse.text();
        body = JSON.parse(body);

        if (body.hasOwnProperty("active") && body.active === false) {
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
