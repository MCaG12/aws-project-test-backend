import { i_canvasPixel } from "../interfaces/i_pixelCanvas";
import {  RedisClientType  } from "redis";

const rowSize = 64; // to quickly get the page up we will assume the grid will be a 32/32 square leading to 1024 pixels


export default class CanvasManagement 
{
    private pixelArray: i_canvasPixel[];
    private redisClient: RedisClientType;


    constructor( pixelArray: i_canvasPixel[], redisClient: RedisClientType)
    {
        this.pixelArray = pixelArray;
        this.redisClient = redisClient;
    }

    public FetchCurrentCanvas(): i_canvasPixel[] 
    {
        return this.pixelArray;
    }

    public async initializeCanvasArray(): Promise<void>
    {
        const foundRedisCanvas = await this.redisClient.exists('pixelCanvas');

        if(foundRedisCanvas == 0)
        {
            const initialPixels: Record<string, string> = {};
            console.log("redis hKey: 'pixelCanvas': not located initializing it...");
            for(let y = 0; y < rowSize; y++)
            {
                for(let x = 0; x < rowSize; x++)
                {
                    let currentPixel: i_canvasPixel = {
                        i_xPos: x,
                        i_yPos: y,
                        s_pixelColor: '#ffffff',
                    }
                    this.pixelArray[(y * rowSize) + x] = currentPixel;
                    initialPixels[`${x},${y}`] = currentPixel.s_pixelColor;
                }    
            }
            await this.redisClient.hSet('pixelCanvas', initialPixels);
        }
        else
        {
            const canvasPixels :Record<string,string> = await this.redisClient.hGetAll('pixelCanvas');
            console.log("redis hKey: 'pixelCanvas': located fetching it... ")
            for(let y = 0; y < rowSize; y++)
            {
                for(let x = 0; x < rowSize; x++)
                {
                    let redisPixelColor = canvasPixels[`${x},${y}`];

                    if(redisPixelColor == null)
                    {
                        console.error("pixel in canvas not found! coordinates -> ", x, y );
                        console.error("initializing pixel with backup value #FFFFFF")
                        redisPixelColor = '#FFFFFF';
                    }
                    else
                    {
                        console.log("located pixel with coordinates ", x, y);
                        console.log("color -> ", redisPixelColor);
                    }

                    let currentPixel: i_canvasPixel = {
                        i_xPos: x,
                        i_yPos: y,
                        s_pixelColor: redisPixelColor,
                    }
                    
                    this.pixelArray[(y * rowSize) + x] = currentPixel;
                }    
            }  
        }

    }

    public async UpdateCanvasArray(p_pixel: i_canvasPixel)
    {
        if( (p_pixel.i_xPos > rowSize - 1 || p_pixel.i_xPos < 0) || (p_pixel.i_yPos > rowSize - 1 || p_pixel.i_yPos < 0) )
        {
           return; 
        }
        this.pixelArray[ (p_pixel.i_yPos * rowSize) + p_pixel.i_xPos].s_pixelColor = p_pixel.s_pixelColor;
        const updatedPixel: Record<string, string> = {};

        updatedPixel[`${p_pixel.i_xPos},${p_pixel.i_yPos}`] = p_pixel.s_pixelColor;
        await this.redisClient.hSet("pixelCanvas", updatedPixel);
    }
}


