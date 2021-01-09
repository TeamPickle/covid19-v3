import { Document, model, Schema } from 'mongoose';

export interface Location extends Document {
  _id: string;
  location: string;
}

const locationSchema = new Schema({
  _id: { type: String, required: true },
  location: { type: String, required: true },
}, { versionKey: false, timestamps: true });

const Locations = model<Location>('location', locationSchema);
export default Locations;
