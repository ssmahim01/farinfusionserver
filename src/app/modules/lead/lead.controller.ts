/* eslint-disable @typescript-eslint/no-unused-vars */
import httpStatus from 'http-status-codes';
import { NextFunction, Request, Response } from "express"
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { LeadServices } from './lead.service';
import { JwtPayload } from 'jsonwebtoken';
import {Lead} from "./lead.model";
import {CommonTrashService} from "../common/CommonTrashService";

const createLead = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;

    const user = req.user as JwtPayload; 

    const lead = await LeadServices.createLeadService(payload, user);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Lead Created Successfully",
        data: lead
    })
})

const getSingleLead = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string
    const result = await LeadServices.getSingleLead(id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Lead Retrieved Successfully",
        data: result.data
    })
})

const deleteLead = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const leadId = req.params.id as string
    const result = await LeadServices.deleteLead(leadId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Lead Deleted Successfully",
        data: result.data
    })
})

const updateLead = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const leadId = req.params.id as string;
        const payload = req.body;
        const decodedToken = req.user as JwtPayload;

        const lead = await LeadServices.updateLeadService(payload, leadId, decodedToken);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Lead Updated Successfully",
            data: lead,
        });
    }
);

const getAllLeads = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const result = await LeadServices.getAllLeads(query as Record<string, string>);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "All Leads Retrieved Successfully",
        data: result.data,
        meta: result.meta
    })
})

const getAllTrashLeads = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const result = await LeadServices.getAllTrashLeads(query as Record<string, string>);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "All Trash Leads Retrieved Successfully",
        data: result.data,
        meta: result.meta
    })
})

const updateLeadTrash = catchAsync(
    async (req: Request, res: Response) => {
        const id = req.params.id as string;

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const Data = await CommonTrashService(id, Lead);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Trash Status Updated",
            data: Data,
        });
    }
);


export const LeadControllers = {
    createLead,
    getSingleLead,
    deleteLead,
    updateLead,
    getAllLeads,
    getAllTrashLeads,
    updateLeadTrash
}
