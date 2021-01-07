import { Document, model, Schema } from 'mongoose';

export interface Chart extends Document {
  _id: string;
  date: Date;
  active: number;
  confirmedAcc: number;
  deathAcc: number;
  releasedAcc: number;
  confirmed: number;
  death: number;
  released: number;
}

const chartSchema = new Schema({
  date: { type: Date, required: true },
  active: { type: Number, required: true },
  confirmedAcc: { type: Number, required: true },
  deathAcc: { type: Number, required: true },
  releasedAcc: { type: Number, required: true },
  confirmed: { type: Number, required: true },
  death: { type: Number, required: true },
  released: { type: Number, required: true },
}, { versionKey: false, timestamps: true });

const Charts = model<Chart>('chart', chartSchema);
export default Charts;
