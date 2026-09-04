import { Request , Response } from "express";

import CanvasManagement from "./services/canvasManagement";
import { i_canvasPixel } from "./interfaces/i_pixelCanvas";
import i_user from "./interfaces/i_user";
import { PaintPixelErrorMessage } from "./const/UserPaintPixel";
import i_SSEEvent from "./interfaces/i_SSEBroadcastBody";
import { SSEReqCodes } from "./const/SSEReqCodes";

const PaintPixelInterval = 5000; //5 seconds of wait per pixel!

export default class SSE
{
   private users :i_user[] = [];
   private userIdSequence = 0;
   private canvasManagementController : CanvasManagement

   constructor(p_CanvasManagementController : CanvasManagement) 
   {
        this.canvasManagementController = p_CanvasManagementController;
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
        console.log("new user pushed -> " , newUser.userId);

        const newUserBroadcast :i_SSEEvent<number> =
        {
            i_SSEBroadcastCode: SSEReqCodes.USER_COUNT_SSE_BROADCAST,
            any_SSEBroadcastData: this.users.length
        }

        this.BroadCastPixelChange(newUserBroadcast);  

        this.userIdSequence+=1;

        p_Res.on('close', () => 
            {
                this.users = this.users.filter((user) => user.sseRes !== p_Res);
                const userLeftBroadcast :i_SSEEvent<number> =
                {
                    i_SSEBroadcastCode: SSEReqCodes.USER_COUNT_SSE_BROADCAST,
                    any_SSEBroadcastData: this.users.length
                }

                this.BroadCastPixelChange(userLeftBroadcast);  
            })
    }

    public BroadCastPixelChange = (p_sseEvent : i_SSEEvent<any> ) =>
    {
        const payload = `data: ${JSON.stringify(p_sseEvent)}\n\n`;
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
        const bodyUserCookie = p_Req.userCookie;

        if(typeof(bodyPixelX) != "number" || bodyPixelX == null)
        {
            return p_Res.status(400).json({message: PaintPixelErrorMessage.INVALID_X_POSITION})
        }

        if(typeof(bodyPixelY) != "number" || bodyPixelY == null)
        {
            return p_Res.status(400).json({message: PaintPixelErrorMessage.INVALID_Y_POSITION})
        }

        if(typeof(bodyPixelColor) != "string" || bodyPixelColor.trim() == "")
        {
            return p_Res.status(400).json({message: PaintPixelErrorMessage.INVALID_COLOR_CHOSEN})
        }

        if(typeof(bodyUserCookie) != "string" || bodyUserCookie.trim() == "")
            {
                return p_Res.status(400).json({message: PaintPixelErrorMessage.EMPTY_COOKIE})
            }


        console.log("current Cookie -> ", bodyUserCookie); 
        for(const user of this.users)
            {
                console.log(user.userId)
            }                                 
        
        const userFound = this.users.find( (user) => {
                                                      if(user.userId == bodyUserCookie) 
                                                        {
                                                            return user
                                                        }
                                                    });

        if(!userFound)
            {
                return p_Res.status(400).json({message: PaintPixelErrorMessage.COOKIE_NOT_FOUND})
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

            const i_SSEPixelChangeBroadcast: i_SSEEvent<i_canvasPixel> = 
            {
                i_SSEBroadcastCode: SSEReqCodes.PAINT_PIXEL_SSE_BROADCAST,
                any_SSEBroadcastData: updatePixel
            };

            this.canvasManagementController.UpdateCanvasArray(updatePixel);

            this.BroadCastPixelChange(i_SSEPixelChangeBroadcast);  

            userFound.lastTimePosted = new Date();

            console.log(`User with code ${userFound.userId} last time posted has been updated to ${userFound.lastTimePosted}`);

            p_Res.sendStatus(200);
        }
        else
        {
            p_Res.status(400).json({message: PaintPixelErrorMessage.PIXELS_DELAY});
        }
    }

    public saveCanvasPPMImage = async (p_Req: Request, p_Res: Response) =>
    {
        const currentCanvasPPMFile = this.canvasManagementController.GenerateCanvasPPM();
        p_Res.status(200).sendFile(await currentCanvasPPMFile);

    }
}
