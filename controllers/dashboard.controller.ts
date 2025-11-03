import { Request, Response } from 'express';

export const dashboard = (req: Request, res: Response) => {
    res.render('pages/home', {
        pageTitle: "Tổng quan"
    });
}