import { Request , Response } from "express";
import type i_pixelCanvas = require("./interfaces/i_pixelCanvas");

let users :user[] = [];
let userIdSequence = 0;

interface user
{
    id: number;
    sseRes: Response;
}

async function InitializeSSEResponse(p_Req: Request, p_Res: Response) 
{
    // setting up res to utilize SSE configs
    p_Res.setHeader('Content-Type', 'text/event-stream');
    p_Res.setHeader('Cache-Control', 'no-cache');
    p_Res.setHeader('Connection', 'keep-alive');
    p_Res.flushHeaders();

    const newUser = 
    {
        id: userIdSequence,
        sseRes: p_Res
    }

    users.push(newUser);
    console.log("new user pushed -> " , newUser);

    userIdSequence+=1;

    p_Res.on('close', () => 
        {
            users = users.filter((user) => {user.id != newUser.id})
        })
}

async function BroadCastPixelChange(p_pixelChanged : i_pixelCanvas.i_canvasPixel )
{
    const payload = `data: ${JSON.stringify(p_pixelChanged)}\n\n`;
    for(const user of users)
    {
        user.sseRes.send(payload);
    }
}

async function SyncCanvas(p_Req: Request, p_Res: Response)
{
    p_Res.status(200).json({FetchCurrentCanvas()})
}