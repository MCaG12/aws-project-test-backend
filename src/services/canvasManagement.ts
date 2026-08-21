import { i_canvasPixel } from "../interfaces/i_pixelCanvas";

const rowSize = 64; // to quickly get the page up we will assume the grid will be a 32/32 square leading to 1024 pixels


export default class CanvasManagement 
{
    private pixelArray: i_canvasPixel[]

    constructor(pixelArray: i_canvasPixel[])
    {
        this.pixelArray = pixelArray;
    }

    public FetchCurrentCanvas(): i_canvasPixel[] 
    {
        return this.pixelArray;
    }

    public initializeCanvasArray(): void
    {
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
            }    
        }
    }

    public UpdateCanvasArray(p_pixel: i_canvasPixel)
    {
        if( (p_pixel.i_xPos > rowSize - 1 || p_pixel.i_xPos < 0) || (p_pixel.i_yPos > rowSize - 1 || p_pixel.i_yPos < 0) )
        {
           return; 
        }
        this.pixelArray[ (p_pixel.i_yPos * rowSize) + p_pixel.i_xPos].s_pixelColor = p_pixel.s_pixelColor;
    }
}


