import { Response } from "express";

export default interface i_user
{
    userId: string;
    sseRes: Response;
    lastTimePosted: Date | null;
}