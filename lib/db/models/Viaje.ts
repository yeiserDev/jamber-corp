import mongoose, { Schema, Document } from 'mongoose';

export interface IViaje extends Document {
  fecha: Date;
  origen: string;
  destino: string;
  conductor: string;
  vehiculo: string;
  numeroGuia?: string;
  numeroFactura?: string;
  monto?: number;
  detalles?: string;
  anotaciones?: string;
  documentos: {
    tipo: 'guia' | 'factura' | 'otro';
    url: string;
    publicId: string;
    nombre: string;
  }[];
  estado: 'pendiente' | 'en_curso' | 'completado' | 'cancelado';
  createdAt: Date;
  updatedAt: Date;
}

const ViajeSchema = new Schema<IViaje>(
  {
    fecha: {
      type: Date,
      required: [true, 'La fecha del viaje es requerida'],
    },
    origen: {
      type: String,
      required: [true, 'El origen es requerido'],
      trim: true,
    },
    destino: {
      type: String,
      required: [true, 'El destino es requerido'],
      trim: true,
    },
    conductor: {
      type: String,
      required: [true, 'El conductor es requerido'],
      trim: true,
    },
    vehiculo: {
      type: String,
      required: [true, 'El vehículo es requerido'],
      trim: true,
    },
    numeroGuia: {
      type: String,
      trim: true,
    },
    numeroFactura: {
      type: String,
      trim: true,
    },
    monto: {
      type: Number,
      min: 0,
    },
    detalles: {
      type: String,
      trim: true,
    },
    anotaciones: {
      type: String,
      trim: true,
    },
    documentos: [
      {
        tipo: {
          type: String,
          enum: ['guia', 'factura', 'otro'],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
        nombre: {
          type: String,
          required: true,
        },
      },
    ],
    estado: {
      type: String,
      enum: ['pendiente', 'en_curso', 'completado', 'cancelado'],
      default: 'pendiente',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Viaje || mongoose.model<IViaje>('Viaje', ViajeSchema);
