import mongoose, { Document, Schema } from 'mongoose';

export type AuthTokenType = 'password_reset' | 'email_verification';

export interface IAuthToken extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  email: string;
  type: AuthTokenType;
  tokenHash: string;
  usedAt?: Date | null;
  expiresAt: Date;
  createdAt: Date;
}

const AuthTokenSchema = new Schema<IAuthToken>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  type: {
    type: String,
    enum: ['password_reset', 'email_verification'],
    required: true
  },
  tokenHash: { type: String, required: true, unique: true },
  usedAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Automatically expire documents in MongoDB after expiresAt passes
AuthTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthToken = mongoose.model<IAuthToken>('AuthToken', AuthTokenSchema);
