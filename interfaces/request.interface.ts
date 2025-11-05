import { Request } from "express";

export interface RequestAccount extends Request {
    adminId?: String
}

export interface RequestClient extends Request {
    userId?: string;
    dealerId?: string;
    role?: string;
}