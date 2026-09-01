import { Repository } from "typeorm";
import { i_canvasPixel } from "../interfaces/i_pixelCanvas";
import {  RedisClientType  } from "redis";
import { canvasSnapShot } from "../entities/canvasSnapShot";
import fs from "fs";
import path from "path";

const rowSize = 128; // to quickly get the page up we will assume the grid will be a 32/32 square leading to 1024 pixels


export default class CanvasManagement 
{
    private pixelArray: i_canvasPixel[];
    private redisClient: RedisClientType;
    private snapshotRepository : Repository<canvasSnapShot>;


    constructor( p_pixelArray: i_canvasPixel[], p_redisClient: RedisClientType, p_snapshotRepository : Repository<canvasSnapShot>)
    {
        this.pixelArray = p_pixelArray;
        this.redisClient = p_redisClient;
        this.snapshotRepository = p_snapshotRepository;
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
            const dbSnapShotLocated = await this.snapshotRepository.findOne( { where:{} } );
            if(!dbSnapShotLocated)
            {
                //baby's first time running the process. Create a new canvas now!
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
            }
            else
            {
                //Db had a snapshot saved. load it!
                const foundPixelData = dbSnapShotLocated.pixelCanvasJson as Record<string, string>;
                for(let y = 0; y < rowSize; y++)
                {
                    for(let x = 0; x < rowSize; x++)
                    {
                        let currentSnapShotPixelColor = foundPixelData[`${x},${y}`];

                        if(currentSnapShotPixelColor == null)
                        {
                            console.log("UNDEFINED PIXEL COLOR FOUND IN THE SNAPSHOT!");
                            console.log("COORDINATES X -> ", x, " Y -> ", y);
                            console.log("UTILIZING BACKUP VALUE #FFFFFF");
                            currentSnapShotPixelColor = "#FFFFFF";

                        }

                        let currentPixel: i_canvasPixel = {
                            i_xPos: x,
                            i_yPos: y,
                            s_pixelColor: currentSnapShotPixelColor,
                        }

                        this.pixelArray[(y * rowSize) + x] = currentPixel;
                        initialPixels[`${x},${y}`] = currentPixel.s_pixelColor;
                    }    
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

                    let currentPixel: i_canvasPixel = {
                        i_xPos: x,
                        i_yPos: y,
                        s_pixelColor: redisPixelColor,
                    }
                    
                    this.pixelArray[(y * rowSize) + x] = currentPixel;
                }    
            }  
        }
        this.GenerateCanvasPPM();

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

    public async GenerateCanvasPPM()
    {
        const maxColorValue = 255; // maximum color value possible for 2 bytes is 0xFF;

        let ppmFileHeader = `P6\n${rowSize} ${rowSize}\n${maxColorValue}\n`;

        const encoder = new TextEncoder();
        const headerBuffer = encoder.encode(ppmFileHeader);

        const pixelBuffer = new Uint8Array(rowSize * rowSize * 3);
        let offset = 0;

        for(let y = 0; y < rowSize; y++)
        {
            for(let x = 0; x < rowSize; x++)
            {
                const i_xPos = x;
                const i_yPos = y;
                let CurrentPixelColor = this.pixelArray[ (i_yPos * rowSize) + i_xPos].s_pixelColor;
                // every pixel i nthe canvas will have the format #RRGGBB
                //we will acess indexes 0,2,4 pick the 2 bytes for each one 
                //parse them to decimal and throw it in our PPM P6
                let R = "";
                R += CurrentPixelColor[1]
                R += CurrentPixelColor[2]

                let G = "";
                G += CurrentPixelColor[3]
                G += CurrentPixelColor[4]

                let B = "";
                B += CurrentPixelColor[5]
                B += CurrentPixelColor[6]

                pixelBuffer[offset] = parseInt(R, 16);
                offset++;
                pixelBuffer[offset] = parseInt(G, 16);
                offset++;
                pixelBuffer[offset] = parseInt(B, 16);
                offset++;
            }
        }

        const ppmFileBuffer = new Uint8Array(headerBuffer.length + pixelBuffer.length);
        ppmFileBuffer.set(headerBuffer, 0);
        ppmFileBuffer.set(pixelBuffer, headerBuffer.length);

        const filePath = path.join(process.cwd(), "pixel-canvas.ppm");
        fs.writeFileSync(filePath, ppmFileBuffer);
        
        return filePath;
    }
}


