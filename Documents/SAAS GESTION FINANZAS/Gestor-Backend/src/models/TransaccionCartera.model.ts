import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaccionCartera extends Document {
  userId: mongoose.Types.ObjectId;
  tipo: 'deposito' | 'retiro' | 'transferencia' | 'ajuste' | 'gasto' | 'ingreso';
  carteraOrigenId?: mongoose.Types.ObjectId;
  carteraDestinoId?: mongoose.Types.ObjectId;
  monto: number;
  montoOrigen?: number;
  montoDestino?: number;
  concepto: string;
  fecha: Date;
  referenciaId?: mongoose.Types.ObjectId;
  metadata?: {
    gastosAfectados?: mongoose.Types.ObjectId[];
    ingresosAfectados?: mongoose.Types.ObjectId[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const TransaccionCarteraSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El userId es requerido'],
      index: true
    },
    tipo: {
      type: String,
      required: [true, 'El tipo es requerido'],
      enum: ['deposito', 'retiro', 'transferencia', 'ajuste', 'gasto', 'ingreso'],
      index: true
    },
    carteraOrigenId: {
      type: Schema.Types.ObjectId,
      ref: 'Cartera',
      default: null
    },
    carteraDestinoId: {
      type: Schema.Types.ObjectId,
      ref: 'Cartera',
      default: null
    },
    monto: {
      type: Number,
      required: [true, 'El monto es requerido'],
      min: [0, 'El monto no puede ser negativo']
    },
    montoOrigen: {
      type: Number
    },
    montoDestino: {
      type: Number
    },
    concepto: {
      type: String,
      required: [true, 'El concepto es requerido'],
      trim: true,
      maxlength: [200, 'El concepto no puede exceder 200 caracteres']
    },
    fecha: {
      type: Date,
      required: [true, 'La fecha es requerida'],
      default: Date.now,
      index: true
    },
    referenciaId: {
      type: Schema.Types.ObjectId,
      default: null
    },
    metadata: {
      gastosAfectados: [{
        type: Schema.Types.ObjectId,
        ref: 'Gasto'
      }],
      ingresosAfectados: [{
        type: Schema.Types.ObjectId,
        ref: 'Ingreso'
      }]
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Índices para consultas eficientes
TransaccionCarteraSchema.index({ userId: 1, fecha: -1 });
TransaccionCarteraSchema.index({ carteraOrigenId: 1, fecha: -1 });
TransaccionCarteraSchema.index({ carteraDestinoId: 1, fecha: -1 });
TransaccionCarteraSchema.index({ tipo: 1, userId: 1 });

export const TransaccionCartera = mongoose.model<ITransaccionCartera>('TransaccionCartera', TransaccionCarteraSchema);

