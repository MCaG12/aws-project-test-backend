import { Request , Response } from "express";

import CanvasManagement from "./services/canvasManagement";
import { i_canvasPixel } from "./interfaces/i_pixelCanvas";
import i_user from "./interfaces/i_user";

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
            id: this.userIdSequence,
            sseRes: p_Res
        }

        this.users.push(newUser);
        console.log("new user pushed -> " , newUser);

        this.userIdSequence+=1;

        p_Res.on('close', () => 
            {
                this.users = this.users.filter((user) => { return user.id != newUser.id})
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

        const updatePixel : i_canvasPixel = {
            i_xPos : bodyPixelX,
            i_yPos : bodyPixelY,
            s_pixelColor : bodyPixelColor
        }

        this.canvasManagementController.UpdateCanvasArray(updatePixel);
        this.BroadCastPixelChange(updatePixel);  
        p_Res.sendStatus(200);

    }
}
