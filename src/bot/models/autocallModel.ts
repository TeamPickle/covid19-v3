import { Document, model, Schema } from 'mongoose';

export interface Autocall extends Document {
  _id: string;
}

const autocallSchema = new Schema({
  _id: { type: String, required: true },
}, { versionKey: false, timestamps: true });

const Autocalls = model<Autocall>('autocall', autocallSchema);
export default Autocalls;
