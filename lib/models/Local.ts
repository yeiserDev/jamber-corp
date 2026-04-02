import mongoose, { Schema, Document } from 'mongoose';

export interface ILocal extends Document {
  nombre: string;
  tipo: 'panaderia' | 'spa' | 'profesor' | 'casa';
  direccion: string;
  estado: 'activo' | 'inactivo';
  createdAt: Date;
  updatedAt: Date;
}

const LocalSchema: Schema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    tipo: {
      type: String,
      enum: ['panaderia', 'spa', 'profesor', 'casa'],
      required: true,
    },
    direccion: {
      type: String,
      required: true,
    },
    estado: {
      type: String,
      enum: ['activo', 'inactivo'],
      default: 'activo',
    },
  },
  { timestamps: true }
);

// Forzar recarga del modelo si ya existe
if (mongoose.models.Local) {
  delete mongoose.models.Local;
}

export default mongoose.model<ILocal>('Local', LocalSchema);