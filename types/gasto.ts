export interface Local {
    _id: string;
    nombre: string;
    tipo: 'panaderia' | 'spa' | 'profesor' | 'academia' | 'casa';
    direccion: string;
}

export interface Lectura {
    localId: Local | string;
    medidorNumero?: number;
    lecturaAnterior: number;
    lecturaActual: number;
    consumo: number;
}

export interface Gasto {
    _id: string;
    mes: string;
    tipo: 'luz' | 'agua';
    consumoTotal: number;
    montoTotal: number;
    metodoCalculo?: string;
    tarifaEnergia?: number;
    alumbradoPublico?: number;
    totalDistribuido?: number;
    diferenciaRecibo?: number;
    cargoFijo?: number;
    igv?: number;
    otrosCargos?: number;
    lecturas: Lectura[];
    costosPorLocal: {
        localId: Local | string;
        consumo: number;
        monto: number;
        montoEnergia?: number;
        montoAlumbrado?: number;
        montoIgv?: number;
    }[];
    createdAt: string;
}
