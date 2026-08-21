import { i_canvasPixel } from "../interfaces/i_pixelCanvas";


export const pixelArray = <i_canvasPixel[]>([]);
const rowSize = 64; // to quickly get the page up we will assume the grid will be a 32/32 square leading to 1024 pixels

for(let y = 0; y < rowSize; y++)
{
for(let x = 0; x < rowSize; x++)
{
    let CurrentPixel: i_canvasPixel = {
        i_xPos: x,
        i_yPos: y,
        s_pixelColor: '#ffffff',
    }
    pixelArray[(y * rowSize) + x] = CurrentPixel;
}

}
