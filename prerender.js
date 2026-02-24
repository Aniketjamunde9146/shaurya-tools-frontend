import { prerenderRoutes } from "./src/prerender-routes.js";
import fs from "fs";
import path from "path";

const routes = prerenderRoutes;

const config = {
  include: routes,
  inlineCss: true
};

fs.writeFileSync(
  path.resolve("react-snap.config.json"),
  JSON.stringify(config, null, 2)
);