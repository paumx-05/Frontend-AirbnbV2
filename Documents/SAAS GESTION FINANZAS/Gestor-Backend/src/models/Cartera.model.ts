import mongoose, { Document, Schema } from 'mongoose';

export interface ICartera extends Document {
  userId: mongoose.Types.ObjectId;
  nombre: string;
  descripcion?: string;
  saldo: number;
  saldoInicial: number;
  moneda: string;
  icono: string;
  color: string;
  activa: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CarteraSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El userId es requerido'],
      index: true
    },
    nombre: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
      maxlength: [100, 'El nombre no puede exceder 100 caracteres']
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripción no puede exceder 500 caracteres']
    },
    saldo: {
      type: Number,
      required: [true, 'El saldo es requerido'],
      default: 0,
      min: [0, 'El saldo no puede ser negativo']
    },
    saldoInicial: {
      type: Number,
      required: [true, 'El saldo inicial es requerido'],
      default: 0,
      min: [0, 'El saldo inicial no puede ser negativo']
    },
    moneda: {
      type: String,
      required: [true, 'La moneda es requerida'],
      default: 'EUR',
      enum: ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'MXN']
    },
    icono: {
      type: String,
      default: '💳',
      maxlength: [10, 'El icono no puede exceder 10 caracteres']
    },
    color: {
      type: String,
      default: '#3b82f6',
      match: [/^#[0-9A-F]{6}$/i, 'El color debe ser un código hexadecimal válido']
    },
    activa: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Índices
CarteraSchema.index({ userId: 1 }); // Índice simple para búsquedas por usuario
CarteraSchema.index({ userId: 1, nombre: 1 }, { unique: true }); // Índice compuesto único para evitar duplicados
CarteraSchema.index({ userId: 1, activa: 1 }); // Índice para búsquedas por usuario y estado

// Virtual para calcular el cambio desde el inicio
CarteraSchema.virtual('cambio').get(function() {
  return this.saldo - this.saldoInicial;
});

// Virtual para calcular porcentaje de cambio
CarteraSchema.virtual('porcentajeCambio').get(function() {
  if (this.saldoInicial === 0) return 0;
  return ((this.cambio / this.saldoInicial) * 100).toFixed(2);
});

CarteraSchema.set('toJSON', { virtuals: true });
CarteraSchema.set('toObject', { virtuals: true });

export const Cartera = mongoose.model<ICartera>('Cartera', CarteraSchema);

