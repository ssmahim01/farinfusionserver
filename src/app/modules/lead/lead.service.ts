import AppError from "../../errorHelpers/appError";
import httpStatus from 'http-status-codes';
import { Lead } from "./lead.model";
import { ILead } from "./lead.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { leadSearchableFields } from "./lead.constants";
import { JwtPayload } from "jsonwebtoken";


const createLeadService = async (payload: Partial<ILead>) => {
    const isExistLead = await Lead.findOne({ email: payload.email })
    if (isExistLead) {
        throw new AppError(httpStatus.CONFLICT, "Lead already exist")
    }
    const lead = await Lead.create(payload);
    return lead;
};

const updateLeadService = async (payload: Partial<ILead>, leadId: string, decodedToken: JwtPayload) => {
    const existingLead = await Lead.findById(leadId);

    if (payload.assignedBy && decodedToken.role !== "ADMIN") {
        throw new AppError(httpStatus.FORBIDDEN, "Only admin can assign leads to others");

    }

    if (!existingLead) {
        throw new AppError(httpStatus.NOT_FOUND, "Lead not found");
    }

    const updatedLead = await Lead.findByIdAndUpdate(leadId, payload, { new: true });
    return updatedLead;
};

const getSingleLead = async (id: string) => {
    const lead = await Lead.findById(id).populate("assignedBy", "name email phone");
    if (!lead) {
        throw new AppError(httpStatus.NOT_FOUND, "Lead Not Found")
    }
    return {
        data: lead
    }
};

const deleteLead = async (id: string) => {

    const lead = await Lead.findById(id);
    if (!lead) {
        throw new AppError(httpStatus.NOT_FOUND, "Lead Not Found");
    }

    await Lead.findByIdAndDelete(id);

    return { data: null };
};


const getAllLeads = async (query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(
        Lead.find({isDeleted: false}).sort({ createdAt: -1 }),
        query
    );
    const leadsData = queryBuilder
        .filter()
        .search(leadSearchableFields)
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        leadsData.build(),
        queryBuilder.getMeta()
    ])

    return {
        data,
        meta
    }
};

const getAllTrashLeads = async (query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(
        Lead.find({isDeleted: true}).sort({ createdAt: -1 }),
        query
    );
    const leadsData = queryBuilder
        .filter()
        .search(leadSearchableFields)
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        leadsData.build(),
        queryBuilder.getMeta()
    ])

    return {
        data,
        meta
    }
};

export const LeadServices = {
    createLeadService,
    getSingleLead,
    updateLeadService,
    deleteLead,
    getAllLeads,
    getAllTrashLeads
}