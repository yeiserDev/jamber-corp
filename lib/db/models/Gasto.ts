import mongoose, { Schema, Document } from 'mongoose';

export interface IGasto extends Document {
  fecha: Date;
  local: string;
  tipoServicio: 'luz' | 'agua' | 'gas' | 'internet' | 'telefono' | 'otro';
  proveedor?: string;
  numeroRecibo?: string;
  monto: number;
  mesFacturado: string;
  detalles?: string;
  anotaciones?: string;
  evidencias: {
    url: string;
    publicId: string;
    nombre: string;
  }[];
  estado: 'pendiente' | 'pagado' | 'vencido';
  createdAt: Date;
  updatedAt: Date;
}

const GastoSchema = new Schema<IGasto>(
  {
    fecha: {
      type: Date,
      required: [true, 'La fecha es requerida'],
    },
    local: {
      type: String,
      required: [true, 'El local es requerido'],
      trim: true,
    },
    tipoServicio: {
      type: String,
      enum: ['luz', 'agua', 'gas', 'internet', 'telefono', 'otro'],
      required: [true, 'El tipo de servicio es requerido'],
    },
    proveedor: {
      type: String,
      trim: true,
    },
    numeroRecibo: {
      type: String,
      trim: true,
    },
    monto: {
      type: Number,
      required: [true, 'El monto es requerido'],
      min: 0,
    },
    mesFacturado: {
      type: String,
      required: [true, 'El mes facturado es requerido'],
      trim: true,
    },
    detalles: {
      type: String,
      trim: true,
    },
    anotaciones: {
      type: String,
      trim: true,
    },
    evidencias: [
      {
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
      enum: ['pendiente', 'pagado', 'vencido'],
      default: 'pendiente',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Gasto || mongoose.model<IGasto>('Gasto', GastoSchema);
