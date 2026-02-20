import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./pages/Home.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  // <HelmetProvider>
  <React.StrictMode>
    <App />
  </React.StrictMode>
  // </HelmetProvider>
);