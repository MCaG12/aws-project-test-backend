import { Router, Request , Response } from "express";
import canvasSnapShotController from "../controllers/canvasSnapShot";

const canvasController = new canvasSnapShotController()

const canvasRouter = Router();

canvasRouter.get('/get-canvas-snapshot', canvasController.getTable);

canvasRouter.get('/fetch-last-snapshot-update-time', canvasController.getLastTimeUpdated);
    
export default canvasRouter;