import express from "express";
import http from "http";
import mongoose from "mongoose";

import Logging from "./library/Logging";
import { config } from "./config/Config";

/** Create an Express application */
const router = express();

/** Connect to Mongo */
mongoose
  .connect(config.mongo.url, { w: "majority", retryWrites: true })
  .then(() => {
    Logging.info("Connected to mongoDB");
    StartServer();
  })
  .catch((error) => {
    Logging.error("Unable to connect: ");
    Logging.error(error);
  });

/** Only start the server if Mongo is connected */
const StartServer = () => {
  router.use((req, res, next) => {
    /** Log the Request */
    Logging.info(
      `Incoming -> Method: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}]`
    );

    res.on("finish", () => {
      /** Log the reponse */
      Logging.info(
        `Incoming -> Method: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}] - Status: [${res.statusCode}]`
      );
    });

    next();
  });

  router.use(express.urlencoded({ extended: true }));
  router.use(express.json());

  /** Rules of API */
  router.use((req, res, next) => {
    // ? The request can come from anywhere
    res.header("Access-Control-Allow-Origin", "*");

    // ? What header is allowed to use
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );

    // ? If receiving an OPTIONS request, return all the requests which are available to use.
    if (req.method == "OPTIONS") {
      res.header(
        "Access-Control-Allow-Methods",
        "PUT, POST, PATCH, DELETE, GET"
      );

      return res.status(200).json({});
    }

    next();
  });

  /** Routes */

  /** Healthcheck */
  router.get("/ping", (req, res, next) => {
    res.status(200).json({ message: "pong" });
  });

  /** Error handling */
  router.use((req, res, next) => {
    const error = new Error("API Not Found");
    Logging.error(error);

    return res.status(404).json({ message: error.message });
  });

  http.createServer(router).listen(config.server.port, () => {
    Logging.info(`Server is running on port ${config.server.port}`);
  });
};
