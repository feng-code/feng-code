import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./design-system.css";
import "./theme-extensions.css";
import "./experience-enhancements.css";
import "./search-enhancements.css";
import "./course-path-enhancements.css";
import "./engineering-review.css";
import "./theme-extensions.js";
import "./experience-enhancements.js";
import "./search-enhancements.js";
import "./course-path-enhancements.js";
import "./engineering-review.js";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
