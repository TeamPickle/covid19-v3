import { Document, model, Schema } from 'mongoose';

export interface Channel extends Document {
  _id: string;
  channel: string;
}

const channelSchema = new Schema({
  _id: { type: String, required: true },
  channel: { type: String, required: true },
}, { versionKey: false, timestamps: true });

const Channels = model<Channel>('channel', channelSchema);
export default Channels;
