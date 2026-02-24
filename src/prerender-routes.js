import { tools } from "./data/toolsData.js";

const staticRoutes = [
  "/"
];

const toolRoutes = tools.map(tool => `/${tool.slug}`);

export const prerenderRoutes = [
  ...staticRoutes,
  ...toolRoutes
];