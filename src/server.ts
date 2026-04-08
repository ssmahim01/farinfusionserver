// /* eslint-disable no-console */
// import { Server } from "http"
// import mongoose from "mongoose";
// import app from "./app";
// import { envVars } from "./app/config/env";
// // import { envVars } from "./app/config/env";
// let server: Server;

// const startServer = async () => {
//     try {
//         // await mongoose.connect(envVars.DB_URL)
//         await mongoose.connect(envVars.DB_URL)
//         console.log("Mongoose is connected!!!");

//         server = app.listen(envVars.PORT, () => {
//             console.log(`Farin Fusion app is running on port ${envVars.PORT}`);
//         })
//     } catch (error) {
//         console.log(error);
//     }
// }

// startServer();

// process.on("unhandledRejection", (err) => {
//     console.log("uncaught error detected.... server shutting down", err)
//     if (server) {
//         server.close(() => {
//             process.exit(1)
//         })
//     }
// })

// process.on("uncaughtException", (err) => {
//     console.log("uncaught error detected.... server shutting down", err);
//     if (server) {
//         server.close(() => {
//             process.exit(1)
//         })
//     }
// })

// process.on("SIGTERM", () => {
//     console.log("Sigterm signal received.... server shutting down");
//     if (server) {
//         server.close(() => {
//             process.exit(1)
//         })
//     }
// })

// process.on("SIGINT", () => {
//     console.log("Sigint signal received.... server shutting down");
//     if (server) {
//         server.close(() => {
//             process.exit(1)
//         })
//     }
// })

import mongoose from "mongoose";
import app from "./app";
import { envVars } from "./app/config/env";

let isConnected = false;

const connectDB = async () => {
  if (!isConnected) {
    await mongoose.connect(envVars.DB_URL);
    isConnected = true;
    console.log("Mongoose connected");
  }
};

export default async function handler(req: any, res: any) {
  await connectDB();
  return app(req, res);
}