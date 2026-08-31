import { canvasSnapShot } from "../entities/canvasSnapShot";
import { AppDataSource } from "../data-source";
import { Request , Response } from "express";
import { Repository } from "typeorm";



export default class canvasSnapShotController {

    private canvasTable: Repository<canvasSnapShot>;

    constructor() {
        this.canvasTable = AppDataSource.getRepository(canvasSnapShot);
    }

    getTable =  async (req: Request, res: Response) => 
    {
        try 
        {
           const TableFound = await this.canvasTable.createQueryBuilder("canvasSnapShot")
            .select("canvasSnapShot.pixelCanvasJson", "PIXELCANVAS")
            .getRawOne();

            return res.status(200).json({TableFound}); 
        } 
        catch (error) 
        {
            return res.status(500).json({error: error})
        }
      
    }

    getLastTimeUpdated = async (req: Request, res: Response) => 
    {
        try 
        {
            const TimeFound = await this.canvasTable.createQueryBuilder("canvasSnapShot")
            .select("canvasSnapShot.lastTimeUpdated", "LAST_TIME_SAVED") 
            .getRawMany();

            return res.status(200).json({TimeFound});  
        } 
        catch (error) 
        {
            return res.status(500).json({error: error})
        }
    }
}