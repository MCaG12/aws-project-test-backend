import express from "express";
import cors from "cors";
import type { i_canvasPixel } from "./interfaces/i_pixelCanvas";
import CanvasManagement from "./services/canvasManagement";
import SSE from "./SSE";
import { createClient, RedisClientType  } from "redis";
import canvasRouter from "./routes/canvasSnapShotRouter";
import { AppDataSource } from "./data-source";
import dbSnapShotManagement from "./services/dbSnapShotManagement";
import { canvasSnapShot } from "./entities/canvasSnapShot";
import HandleCookies from "./middlewares/cookie";
import cookieParser from 'cookie-parser';

//declaring variables for pixelArray and sseCleint
const pixelArray : i_canvasPixel[] = ([]);
const client = createClient();
const snapShotDelay = 30000 //snapshots taken every 30s

//creating Services
let canvasManagementService;
let dbSnapShotManagementService;
let SSEController;

const app = express();

//containing clientconnect in a async function due to js stuff
async function main()
{
    await client.connect();
}
main();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());

AppDataSource.initialize()
  .then(() => 
  {
    app.use(cookieParser());
    app.use(HandleCookies);

    //initializing services
    canvasManagementService = new CanvasManagement(pixelArray, client, AppDataSource.getRepository(canvasSnapShot));

    canvasManagementService.initializeCanvasArray();

    SSEController = new SSE(canvasManagementService);

    dbSnapShotManagementService  = new dbSnapShotManagement(client, AppDataSource.getRepository(canvasSnapShot));

    //mapping basic app endpoints

    app.use('/canvas-snapshots', canvasRouter);

    app.get('/events', SSEController.InitializeSSEResponse); //opens up the SSE Res

    app.get('/initalize-canvas',SSEController.SyncCanvas); // fetches the latest canvas snapshot syncronizing new users to what was there before they joined

    app.post('/update-pixel', SSEController.PaintPixel);

    app.get('/get-canvas-ppm', SSEController.saveCanvasPPMImage);

    //initializing canvas snapshot scheduler
    dbSnapShotManagementService.scheduleSnapShot(snapShotDelay);

    app.listen(3000, () => console.log("Server running on port 3000"));
  })
  .catch((err) => {
    console.error("DB connection error:", err);
    process.exit(1);
  });





