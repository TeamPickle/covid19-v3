import { Document, model, Schema } from 'mongoose';

export interface Graph extends Document {
  url: string;
}

const graphSchema = new Schema({
  url: { type: String, required: true },
}, { versionKey: false, timestamps: true });

const Graphs = model<Graph>('graph', graphSchema);
export default Graphs;
