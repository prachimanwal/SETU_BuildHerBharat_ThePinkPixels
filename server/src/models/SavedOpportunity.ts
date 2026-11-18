import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISavedOpportunity extends Document {
  userId: Types.ObjectId;
  opportunityId: Types.ObjectId;
  createdAt: Date;
}

const SavedOpportunitySchema = new Schema<ISavedOpportunity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity', required: true, index: true }
  },
  { timestamps: true }
);

SavedOpportunitySchema.index({ userId: 1, opportunityId: 1 }, { unique: true });

export const SavedOpportunity = mongoose.model<ISavedOpportunity>(
  'SavedOpportunity',
  SavedOpportunitySchema
);
