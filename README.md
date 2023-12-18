# Installation

`yarn add keycloak-nodejs-middleware` or `npm i keycloak-nodejs-middleware`

# How to use

```js
import express, { Application, json } from "express";
import { keycloakMiddleware } from "keycloak-nodejs-middleware";
// more imports

const app: Application = express();

// example of middleware
app.use(json());

// fill those options with info from your `keycloak` instance
app.use(
  keycloakMiddleware({
    host: "http://localhost:8080",
    realm: "master",
    client_id: "test-client",
    client_secret: "secret_code",
  })
);

// intialize your server
```

## Author

[Atef Ben Ali](mailto:atef.bettaib@gmail.com)
