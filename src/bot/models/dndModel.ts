import { Document, model, Schema } from 'mongoose';

export interface Dnd extends Document {
  _id: string;
}

const dndSchema = new Schema({
  _id: { type: String, required: true },
}, { versionKey: false, timestamps: true });

const Dnds = model<Dnd>('dnd', dndSchema);
export default Dnds;
