import { Request , Response } from "express";

import CanvasManagement from "./services/canvasManagement";
import { i_canvasPixel } from "./interfaces/i_pixelCanvas";
import i_user from "./interfaces/i_user";

const PaintPixelInterval = 5000; //5 seconds of wait per pixel!

export default class SSE
{
   private users :i_user[] = [];
   private userIdSequence = 0;
   private canvasManagementController : CanvasManagement

   constructor(CanvasManagementController : CanvasManagement) 
   {
        this.canvasManagementController = CanvasManagementController;
   }

   public InitializeSSEResponse = (p_Req: Request, p_Res: Response) =>
    {
        // setting up res to utilize SSE configs
        p_Res.setHeader('Content-Type', 'text/event-stream');
        p_Res.setHeader('Cache-Control', 'no-cache');
        p_Res.setHeader('Connection', 'keep-alive');
        p_Res.flushHeaders();

        const newUser : i_user = 
        {
            userId: p_Req.userCookie,
            sseRes: p_Res,
            lastTimePosted: null
        }

        this.users.push(newUser);
        console.log("new user pushed -> " , newUser);

        this.userIdSequence+=1;

        p_Res.on('close', () => 
            {
                this.users = this.users.filter((user) => { return user.userId != newUser.userId})
            })
    }

    public BroadCastPixelChange = (p_pixelChanged : i_canvasPixel ) =>
    {
        const payload = `data: ${JSON.stringify(p_pixelChanged)}\n\n`;
        for(const user of this.users)
        {
            user.sseRes.write(payload);
        }
    }

    public SyncCanvas = (p_Req: Request, p_Res: Response) =>
    {
        const currentCanvas = this.canvasManagementController.FetchCurrentCanvas();
        p_Res.status(200).json({currentCanvas})
    }

    public PaintPixel = (p_Req: Request, p_Res: Response) =>
    {
        const bodyPixelX = p_Req.body.X;
        const bodyPixelY = p_Req.body.Y;
        const bodyPixelColor = p_Req.body.Color;
        const bodyUserCookie = p_Req.cookies["userId"];

        if(typeof(bodyPixelX) != "number" || bodyPixelX == null)
        {
            return p_Res.status(400).json({message: "placeholder"})
        }

        if(typeof(bodyPixelY) != "number" || bodyPixelY == null)
        {
            return p_Res.status(400).json({message: "placeholder"})
        }

        if(typeof(bodyPixelColor) != "string" || bodyPixelColor.trim() == "")
        {
            return p_Res.status(400).json({message: "placeholder"})
        }

        if(typeof(bodyUserCookie) != "string" || bodyUserCookie.trim() == "")
            {
                return p_Res.status(400).json({message: "placeholder"})
            }

        const userFound = this.users.find( (user) => user.userId == bodyUserCookie);

        if(!userFound)
            {
                return p_Res.status(400).json({message: "placeholder"})
            }

        //user has been located find the last time they updated a pixel!
        const lastTimeUpdated : number = (userFound.lastTimePosted != null) ? userFound.lastTimePosted.getTime() : 0;
        const currentNowDate : number = (new Date().getTime());

        if( userFound.lastTimePosted == null || (currentNowDate - lastTimeUpdated) >  PaintPixelInterval)
        {
            const updatePixel : i_canvasPixel = {
                i_xPos : bodyPixelX,
                i_yPos : bodyPixelY,
                s_pixelColor : bodyPixelColor
            }

            this.canvasManagementController.UpdateCanvasArray(updatePixel);
            this.BroadCastPixelChange(updatePixel);  
            userFound.lastTimePosted = new Date();

            console.log(`User with code ${userFound.userId} last time posted has been updated to ${userFound.lastTimePosted}`);

            p_Res.sendStatus(200);
        }
        else
        {
            p_Res.status(400).json({json: `Pixels can only be changed on an interval of ${PaintPixelInterval/1000} seconds!`});
        }
    }
}
