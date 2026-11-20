import * as XLSX from 'xlsx';
import { ModuleConfig } from '../types/records';

export const DEFAULT_MODULES: ModuleConfig[] = [
  {
    id: 'modulo-1-tramites',
    name: 'Trámites y Mercancías',
    description: 'Módulo 1 · Lectura por defecto desde la fila 7 con estructura arancelaria.',
    startRow: 7,
    hasHeaderRow: true,
    isDefault: true,
    columns: [
      {
        key: 'tramite',
        label: 'Trámite',
        type: 'code',
        primary: true,
        aliases: ['tramite', 'trámite', 'nro tramite', 'numero tramite', 'codigo tramite'],
      },
      {
        key: 'oficio',
        label: 'Oficio',
        type: 'code',
        aliases: ['oficio', 'nro oficio', 'numero oficio', 'documento'],
      },
      {
        key: 'fecha_de_oficio',
        label: 'Fecha de oficio',
        type: 'date',
        aliases: ['fecha de oficio', 'fecha oficio', 'fecha', 'f. oficio'],
      },
      {
        key: 'descripcion_de_la_mercancia',
        label: 'Descripción de la mercancía',
        type: 'text',
        aliases: [
          'descripcion de la mercancia',
          'descripción de la mercancía',
          'descripcion mercancia',
          'mercancia',
          'descripcion',
        ],
      },
      {
        key: 'codigo_arancelario',
        label: 'Código arancelario',
        type: 'code',
        aliases: [
          'codigo arancelario',
          'código arancelario',
          'arancel',
          'partida arancelaria',
          'subpartida',
          'hs code',
        ],
      },
    ],
  },
  {
    id: 'modulo-2-expedientes',
    name: 'Expedientes y Resoluciones',
    description: 'Módulo 2 · Estructura independiente desde fila 4 para resoluciones.',
    startRow: 4,
    hasHeaderRow: true,
    isDefault: true,
    columns: [
      {
        key: 'expediente',
        label: 'Expediente',
        type: 'code',
        primary: true,
        aliases: ['expediente', 'nro expediente', 'exp'],
      },
      {
        key: 'resolucion',
        label: 'Resolución',
        type: 'code',
        aliases: ['resolucion', 'resolución', 'nro resolucion'],
      },
      {
        key: 'fecha_resolucion',
        label: 'Fecha de resolución',
        type: 'date',
        aliases: ['fecha de resolucion', 'fecha resolucion', 'fecha'],
      },
      {
        key: 'titular',
        label: 'Titular / Razón social',
        type: 'text',
        aliases: ['titular', 'razon social', 'empresa', 'solicitante'],
      },
      {
        key: 'estado',
        label: 'Estado',
        type: 'text',
        aliases: ['estado', 'situacion', 'estatus'],
      },
    ],
  },
];

const MERCANCIAS_CATALOG = [
  { desc: 'Válvula reguladora de presión en acero inoxidable para tubería industrial', hs: '8481.80.10' },
  { desc: 'Válvula solenoide electromagnética de control hidráulico 24V DC', hs: '8481.20.00' },
  { desc: 'Transformador eléctrico trifásico de distribución tipo seco 150 kVA', hs: '8504.33.00' },
  { desc: 'Convertidor estático de frecuencia variable para motor industrial', hs: '8504.40.90' },
  { desc: 'Empaquetadura y juntas tóricas de caucho nitrilo resistente a hidrocarburos', hs: '4016.93.00' },
  { desc: 'Tornillos hexagonales de acero aleado inoxidable M12 con arandela', hs: '7318.15.90' },
  { desc: 'Espectrofotómetro portátil de absorción molecular para laboratorio clínico', hs: '9027.30.00' },
  { desc: 'Medidor digital de caudal ultrasónico para líquidos corrosivos', hs: '9026.10.20' },
  { desc: 'Unidad de procesamiento industrial compacta con pantalla táctil integrada', hs: '8471.41.00' },
  { desc: 'Cables conductores de cobre aislado con polietileno reticulado 1 kV', hs: '8544.49.10' },
  { desc: 'Accesorios moldeados de PVC rígido para conducción de agua potable', hs: '3917.40.00' },
  { desc: 'Bomba centrífuga multietapa horizontal de hierro fundido para riego', hs: '8413.70.21' },
  { desc: 'Filtro prensa de placas poliméricas para tratamiento de aguas residuales', hs: '8421.21.90' },
  { desc: 'Lámina galvanizada en caliente recubierta de zinc-aluminio calibre 24', hs: '7210.61.00' },
  { desc: 'Rodamiento rígido de bolas de precisión sellado para eje motriz', hs: '8482.10.00' },
];

const TITULARES_CATALOG = [
  'Industrias Metálicas del Pacífico S.A.',
  'Logística Aduanera Andina S.A.S.',
  'Corporación Energética Sur Ltda.',
  'Suministros Químicos Integrales S.A.',
  'TecnoMaquinaria Industrial S.R.L.',
  'Importadora Médica Horizonte S.A.',
];

const ESTADOS_CATALOG = ['Aprobado', 'En revisión', 'Notificado', 'Subsanación'];

/**
 * Generates a real binary .xlsx workbook in memory (ArrayBuffer) for the selected module.
 * For Module 1, rows 1-6 contain institutional header lines and row 7 starts the table headers.
 */
export function createSampleExcelBuffer(module: ModuleConfig): {
  buffer: ArrayBuffer;
  fileName: string;
} {
  const aoa: unknown[][] = [];

  // Fill rows 1..(startRow - 1) with realistic institutional header metadata
  if (module.startRow > 1) {
    for (let r = 1; r < module.startRow; r++) {
      if (r === 1) {
        aoa.push(['DIRECCIÓN DE GESTIÓN OPERATIVA — REPORTE DE REGISTROS']);
      } else if (r === 2) {
        aoa.push([`Módulo: ${module.name}`, '', `Fecha de generación: 20/11/2026`]);
      } else if (r === 3) {
        aoa.push([`Estructura configurable · Inicio de tabla en fila ${module.startRow}`]);
      } else {
        aoa.push([]);
      }
    }
  }

  // Header row at startRow
  aoa.push(module.columns.map((c) => c.key.replace(/_/g, ' ')));

  const isModule1 = module.id === 'modulo-1-tramites';
  const totalRows = isModule1 ? 225 : 48;

  const tramitePrefixes = ['CO116', 'CO118', 'CO204', 'TR905'];
  const oficioPrefixes = ['OF-2026-', 'OF-2025-', 'MEM-2026-'];
  const expPrefixes = ['EXP-2026-', 'EXP-2025-'];
  const resPrefixes = ['RES-840-', 'RES-912-', 'RES-504-'];

  // Months from May 2026 to Nov 2026
  const months = [
    { year: 2026, month: 11 },
    { year: 2026, month: 10 },
    { year: 2026, month: 9 },
    { year: 2026, month: 8 },
    { year: 2026, month: 7 },
    { year: 2026, month: 6 },
    { year: 2026, month: 5 },
  ];

  for (let i = 0; i < totalRows; i++) {
    const m = months[i % months.length];
    const day = ((i * 3) % 27) + 1;
    const dateStr = `${String(day).padStart(2, '0')}/${String(m.month).padStart(2, '0')}/${m.year}`;

    if (isModule1) {
      // Weight CO116 heavily so constant prefix filtering feels authentic
      const prefix =
        i % 3 === 0 ? 'CO116' : tramitePrefixes[i % tramitePrefixes.length];
      const tramiteNum = `${prefix}${String(10420 + i * 7).padStart(6, '0')}`;
      const oficioPrefix = oficioPrefixes[i % oficioPrefixes.length];
      const oficioNum = `${oficioPrefix}${String(310 + i).padStart(4, '0')}`;
      const item = MERCANCIAS_CATALOG[i % MERCANCIAS_CATALOG.length];

      aoa.push([tramiteNum, oficioNum, dateStr, item.desc, item.hs]);
    } else if (module.id === 'modulo-2-expedientes') {
      const exp = `${expPrefixes[i % expPrefixes.length]}${String(400 + i).padStart(5, '0')}`;
      const res = `${resPrefixes[i % resPrefixes.length]}${String(1100 + i * 3)}`;
      const titular = TITULARES_CATALOG[i % TITULARES_CATALOG.length];
      const estado = ESTADOS_CATALOG[i % ESTADOS_CATALOG.length];
      aoa.push([exp, res, dateStr, titular, estado]);
    } else {
      // Custom module generic sample rows
      const row = module.columns.map((col, idx) => {
        if (col.type === 'date') return dateStr;
        if (col.type === 'code') return `COD-${100 + idx}-${String(1000 + i).padStart(4, '0')}`;
        return `${col.label} de muestra #${i + 1}`;
      });
      aoa.push(row);
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = module.columns.map((col) => ({
    wch: col.key.includes('descripcion') || col.type === 'text' ? 48 : 20,
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registros');

  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  const slug = module.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_');

  return {
    buffer: out,
    fileName: `ejemplo_${slug}_fila${module.startRow}.xlsx`,
  };
}
