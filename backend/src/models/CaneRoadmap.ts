import mongoose, { Document, Schema } from 'mongoose';

export interface ICaneRoadmap extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  targetRole: string;
  durationLabel: string;
  content: string;
  milestones: Array<{ label: string; completed: boolean }>;
  createdAt: Date;
  updatedAt: Date;
}

const CaneRoadmapSchema = new Schema<ICaneRoadmap>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: { type: String, required: true, trim: true },
    targetRole: { type: String, default: '' },
    durationLabel: { type: String, default: '3 Months' },
    content: { type: String, required: true },
    milestones: {
      type: [
        {
          label: { type: String, required: true },
          completed: { type: Boolean, default: false }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

CaneRoadmapSchema.index({ userId: 1, createdAt: -1 });

export const CaneRoadmap = mongoose.model<ICaneRoadmap>(
  'CaneRoadmap',
  CaneRoadmapSchema,
  'caneroadmaps'
);
