import { NextFunction, Request , Response } from "express";
import { v4 as uuidv4 } from 'uuid';

//tell TS use req.userCookie
declare global {
    namespace Express {
        interface Request {
            userCookie: string;
        }
    }
}

export {};

const millisecondsInDay = (60 * 60 * 24 * 1000);

export default function HandleCookies(req: Request, res: Response, next: NextFunction) 
{
  console.log("initializing the Cookie service")
  let userCookie = req.cookies["userId"];

  if(!userCookie)
  {
        console.log("user didnt have a cookie creating one!")
        userCookie = uuidv4();
        res.cookie('userId', userCookie, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: millisecondsInDay // one day per cookie should be more than enough
        })
  }
  req.userCookie = userCookie

  next(); 
};

