import {  RedisClientType  } from "redis";
import { Repository } from "typeorm";
import { canvasSnapShot } from "../entities/canvasSnapShot";
import i_SSEEvent from "../interfaces/i_SSEBroadcastBody";
import { SSEReqCodes } from "../const/SSEReqCodes";
import SSE from "../SSE";

export default class dbSnapShotManagement {
    private redisClient : RedisClientType;
    private snapshotRepository : Repository<canvasSnapShot>;
    private SSE : SSE

    constructor(p_redisClient : RedisClientType, p_snapshotRepository : Repository<canvasSnapShot>, p_SSE : SSE)
    {
        this.redisClient = p_redisClient;
        this.snapshotRepository = p_snapshotRepository;
        this.SSE = p_SSE;
    }

    public async saveSnapshot()
    {
        try 
        {
            const redisCanvasArray = await this.redisClient.hGetAll("pixelCanvas");
            let snapShotFound = await this.snapshotRepository.findOne({where:{}});

            if(!snapShotFound)
            {
                snapShotFound = this.snapshotRepository.create({});   
            }

            snapShotFound.lastTimeUpdated = new Date(Date.now());
            snapShotFound.pixelCanvasJson = redisCanvasArray;

            await this.snapshotRepository.save(snapShotFound);
        } 
        catch (error) 
        {
            console.error(error);
        }
    }

    public scheduleSnapShot(p_milliseconds : number)
    {
        console.log("Snapshots will be taken every ", p_milliseconds / 1000 , "seconds!");
        setInterval(async () => 
        {
            console.log("Starting Canvas-SnapShot Service! Time Start -> ", new Date() );
            await this.saveSnapshot();
            const dateSaved = new Date();
            console.log("Canvas-SnapShot Saved! Time End -> ", dateSaved);

            const snapshotSSE :i_SSEEvent<number> = 
            {
                i_SSEBroadcastCode: SSEReqCodes.LAST_SNAP_SHOT_SAVED_SSE_BROADCAST,
                any_SSEBroadcastData : dateSaved.getTime()
            }
            this.SSE.BroadCastPixelChange(snapshotSSE);
        }
        , p_milliseconds);
    }
}
