import mongoose, { Document, Schema } from 'mongoose';

export interface ILoginOtp extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  email: string;
  otpHash: string;
  attempts: number;
  maxAttempts: number;
  usedAt?: Date | null;
  expiresAt: Date;
  createdAt: Date;
}

const LoginOtpSchema = new Schema<ILoginOtp>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  otpHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },
  usedAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Automatically expire OTP records after expiresAt
LoginOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const LoginOtp = mongoose.model<ILoginOtp>('LoginOtp', LoginOtpSchema);
