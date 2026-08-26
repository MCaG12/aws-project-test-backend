import {  RedisClientType  } from "redis";
import { Repository } from "typeorm";
import { canvasSnapShot } from "../entities/canvasSnapShot";

export default class dbSnapShotManagement {
    private redisClient : RedisClientType;
    private snapshotRepository : Repository<canvasSnapShot>;

    constructor(p_redisClient : RedisClientType, p_snapshotRepository : Repository<canvasSnapShot>)
    {
        this.redisClient = p_redisClient;
        this.snapshotRepository = p_snapshotRepository;
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
            console.log("Canvas-SnapShot Saved! Time End -> ", new Date() );
        }
        , p_milliseconds);
    }
}
