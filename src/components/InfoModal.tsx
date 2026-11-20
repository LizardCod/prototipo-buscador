import React from 'react';
import {
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Layers,
  Search,
  Tag,
  X,
} from 'lucide-react';

export type InfoTopicId =
  | 'all'
  | 'modules'
  | 'preview'
  | 'search'
  | 'filters'
  | 'navigation';

interface InfoModalProps {
  isOpen: boolean;
  topic?: InfoTopicId;
  onClose: () => void;
}

interface InfoSection {
  id: InfoTopicId;
  title: string;
  summary: string;
  bullets: string[];
  icon: React.ReactNode;
}

const INFO_SECTIONS: InfoSection[] = [
  {
    id: 'modules',
    title: '1. Control de acceso, módulos y fila 7',
    summary:
      'Existen dos niveles de usuario: Administrador (importa y gestiona) y Cliente (solo lectura y descarga).',
    bullets: [
      'Solo el Administrador puede importar archivos Excel, crear módulos y subir o eliminar documentos.',
      'El Cliente consulta los registros publicados, busca, filtra y descarga archivos sin modificar nada.',
      'El Módulo 1 (Trámites y Mercancías) omite por defecto las filas 1 a 6 y lee desde la fila 7.',
    ],
    icon: <Layers className="w-4 h-4 text-blue-700" />,
  },
  {
    id: 'preview',
    title: '2. Vista previa y límite rápido (10, 20, 200, Todos)',
    summary:
      'Ningún archivo Excel se guarda automáticamente sin mostrar al administrador los datos leídos.',
    bullets: [
      'Revisa las filas detectadas, ajusta la fila de inicio si hace falta y verifica el mapeo de columnas.',
      'Usa los botones rápidos 10, 20, 50, 100, 200 o Todos para decidir cuántos registros cargar.',
      'Elige entre reemplazar los datos del módulo o agregarlos a los existentes.',
    ],
    icon: <FileSpreadsheet className="w-4 h-4 text-blue-700" />,
  },
  {
    id: 'search',
    title: '3. Buscador parcial (%LIKE%) y tarjetas expandibles',
    summary:
      'El campo de búsqueda encuentra coincidencias parciales en todos los campos del registro activo.',
    bullets: [
      'No distingue entre mayúsculas, minúsculas ni tildes (por ejemplo, «valvula» coincide con «Válvula»).',
      'Si la coincidencia está en datos ocultos, aparece una burbuja ...TEXT... justo encima de la tarjeta.',
      'Toca cualquier tarjeta para expandirla y ver todos los datos completos del registro o copiar valores.',
    ],
    icon: <Search className="w-4 h-4 text-blue-700" />,
  },
  {
    id: 'filters',
    title: '4. Acordeón de filtros: constantes/prefijos y meses',
    summary:
      'Despliega el acordeón debajo del buscador cuando necesites acotar por prefijos o fechas.',
    bullets: [
      'Prefijos constantes: detecta automáticamente patrones como CO116, OF-2026 u 8481, o permite escribir uno manual.',
      'Meses disponibles: extrae los meses desde columnas de fecha (como Fecha de oficio) para filtrar al instante.',
    ],
    icon: <Tag className="w-4 h-4 text-blue-700" />,
  },
  {
    id: 'navigation',
    title: '5. Barra inferior: Buscador, Antecedentes y Descargas',
    summary:
      'Tres vistas principales pensadas para usar con una sola mano en móvil.',
    bullets: [
      'Buscador: búsqueda en vivo, acordeón de filtros y expansión de tarjetas.',
      'Antecedentes: historial de búsquedas recientes, registros guardados y lotes Excel importados.',
      'Descargas: el Administrador sube los archivos; el Cliente solo visualiza y descarga los documentos publicados.',
    ],
    icon: <Download className="w-4 h-4 text-blue-700" />,
  },
];

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  topic = 'all',
  onClose,
}) => {
  if (!isOpen) return null;

  const displayedSections =
    topic === 'all'
      ? INFO_SECTIONS
      : [
          ...INFO_SECTIONS.filter((s) => s.id === topic),
          ...INFO_SECTIONS.filter((s) => s.id !== topic),
        ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Guía rápida de funcionamiento"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-xl max-h-[88vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Mobile grabber */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
          <div className="w-10 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 truncate">
                Cómo usar la aplicación
              </h2>
              <p className="text-xs text-slate-500 truncate">
                Guía de módulos, vista previa, búsqueda LIKE y filtros
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar guía"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/70">
          {displayedSections.map((sec, idx) => {
            const isHighlighted = topic !== 'all' && idx === 0;
            return (
              <section
                key={sec.id}
                className={`bg-white rounded-2xl p-4 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.07)] space-y-2 ${
                  isHighlighted ? 'ring-2 ring-blue-600/30' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    {sec.icon}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {sec.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {sec.summary}
                </p>
                <ul className="space-y-1.5 pt-1">
                  {sec.bullets.map((b, bIdx) => (
                    <li
                      key={bIdx}
                      className="text-xs text-slate-700 leading-relaxed flex items-start gap-2"
                    >
                      <span
                        className="text-blue-600 font-bold mt-0.5 shrink-0"
                        aria-hidden="true"
                      >
                        ·
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          <div className="px-1 pt-1 flex items-center gap-2 text-[11px] text-slate-500">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>
              Todos tus datos y módulos se guardan localmente en el navegador.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-white flex justify-end pb-safe">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
