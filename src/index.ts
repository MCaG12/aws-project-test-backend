import express from "express";
import cors from "cors";
import type { i_canvasPixel } from "./interfaces/i_pixelCanvas";
import CanvasManagement from "./services/canvasManagement";
import SSE from "./SSE";
import { createClient, RedisClientType  } from "redis";

const client = createClient();

async function main()
{
    await client.connect();
}

main();

const pixelArray : i_canvasPixel[] = ([]);

const canvasManagement = new CanvasManagement(pixelArray, client);
canvasManagement.initializeCanvasArray();

const SSEController = new SSE(canvasManagement);

const app = express();
app.use(cors())

app.use(express.json());

app.get('/events', SSEController.InitializeSSEResponse); //opens up the SSE Res

app.get('/initalize-canvas',SSEController.SyncCanvas) // fetches the latest canvas snapshot syncronizing new users to what was there before they joined

app.post('/update-pixel', SSEController.PaintPixel)

app.listen(3000, () => console.log("Server running on port 3000"));



