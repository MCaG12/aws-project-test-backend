import express from "express";
import type { i_canvasPixel } from "./interfaces/i_pixelCanvas";


const app = express();

app.use(express.json());

app.get('/events'); //opens up the SSE Res

app.get('/initalize-canvas') // fetches the latest canvas snapshot syncronizing new users to what was there before they joined

app.post('/update-pixel')

