import { Document, model, Schema } from 'mongoose';

export interface Setting extends Document {
  _id: string;
  channel: string;
  prefix: string;
  dnd: boolean;
}

const settingSchema = new Schema({
  _id: { type: String, required: true },
  channel: { type: String },
  prefix: { type: String },
  dnd: { type: Boolean, default: false },
}, { versionKey: false, timestamps: true });

const Settings = model<Setting>('setting', settingSchema);
export default Settings;
