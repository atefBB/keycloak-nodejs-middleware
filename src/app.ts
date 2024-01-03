import express, { Application } from "express";
import { keycloakMiddleware } from ".";

const app: Application = express();
const PORT = 56778;

app.get("/", (_, result) => {
  result.send("Welcome");
});

app.get(
  "/secure",
  keycloakMiddleware({
    host: "https://keycloak.url",
    realm: "realm",
    client_id: "clientid",
    client_secret: "client_secret",
  }),
  (_, result) => {
    result.send("Insecure");
  }
);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
