import mongoose, { Schema, Document } from 'mongoose';

export interface ILectura {
  localId: string;
  medidorNumero?: number; // Número de medidor (1, 2, etc.) para diferenciar múltiples medidores del mismo local
  lecturaAnterior: number;
  lecturaActual: number;
  consumo: number;
}

export interface IGasto extends Document {
  mes: string; // formato: "2024-01"
  tipo: 'luz' | 'agua';

  // Datos del recibo total
  consumoTotal: number; // en kWh para luz, m3 para agua
  montoTotal: number; // costo total del recibo en soles

  // Costos fijos del recibo (IGV, cargo fijo, etc.)
  cargoFijo?: number;
  igv?: number;
  otrosCargos?: number;

  // Lecturas por local (puede haber múltiples medidores por local)
  lecturas: ILectura[];

  // Calculado automáticamente
  costosPorLocal: {
    localId: string;
    consumo: number;
    monto: number;
  }[];

  createdAt: Date;
  updatedAt: Date;
}

const GastoSchema: Schema = new Schema(
  {
    mes: {
      type: String,
      required: true,
    },
    tipo: {
      type: String,
      enum: ['luz', 'agua'],
      required: true,
    },
    consumoTotal: {
      type: Number,
      required: true,
    },
    montoTotal: {
      type: Number,
      required: true,
    },
    cargoFijo: {
      type: Number,
      default: 0,
    },
    igv: {
      type: Number,
      default: 0,
    },
    otrosCargos: {
      type: Number,
      default: 0,
    },
    lecturas: [
      {
        localId: {
          type: Schema.Types.ObjectId,
          ref: 'Local',
          required: true,
        },
        medidorNumero: {
          type: Number,
          default: 1,
        },
        lecturaAnterior: {
          type: Number,
          required: true,
        },
        lecturaActual: {
          type: Number,
          required: true,
        },
        consumo: {
          type: Number,
          required: true,
        },
      },
    ],
    costosPorLocal: [
      {
        localId: {
          type: Schema.Types.ObjectId,
          ref: 'Local',
        },
        consumo: Number,
        monto: Number,
      },
    ],
  },
  { timestamps: true }
);

// Índice compuesto para evitar duplicados de mes + tipo
GastoSchema.index({ mes: 1, tipo: 1 }, { unique: true });

export default mongoose.models.Gasto || mongoose.model<IGasto>('Gasto', GastoSchema);