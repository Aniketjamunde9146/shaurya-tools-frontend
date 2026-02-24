import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./Home.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  // <HelmetProvider>
  <React.StrictMode>
    <App />
  </React.StrictMode>
  // </HelmetProvider>
);