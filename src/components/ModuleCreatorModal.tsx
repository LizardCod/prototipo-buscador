import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { ColumnDef, ColumnType, ModuleConfig } from '../types/records';

interface ModuleCreatorModalProps {
  onClose: () => void;
  onCreateModule: (module: ModuleConfig) => void;
}

export const ModuleCreatorModal: React.FC<ModuleCreatorModalProps> = ({
  onClose,
  onCreateModule,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startRow, setStartRow] = useState(1);
  const [hasHeaderRow, setHasHeaderRow] = useState(true);
  const [columns, setColumns] = useState<Array<{ label: string; type: ColumnType }>>([
    { label: 'Código principal', type: 'code' },
    { label: 'Fecha de registro', type: 'date' },
    { label: 'Descripción', type: 'text' },
  ]);

  const handleAddColumn = () => {
    setColumns((prev) => [...prev, { label: '', type: 'text' }]);
  };

  const handleRemoveColumn = (idx: number) => {
    if (columns.length <= 1) return;
    setColumns((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validCols = columns.filter((c) => c.label.trim() !== '');
    if (!name.trim() || validCols.length === 0) return;

    const formattedCols: ColumnDef[] = validCols.map((c, idx) => {
      const slug = c.label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
      return {
        key: slug || `col_${idx + 1}`,
        label: c.label.trim(),
        type: c.type,
        primary: idx === 0,
        aliases: [c.label.trim().toLowerCase()],
      };
    });

    const newModule: ModuleConfig = {
      id: `mod-${Date.now()}`,
      name: name.trim(),
      description:
        description.trim() ||
        `Módulo personalizado · Inicio en fila ${startRow} con ${formattedCols.length} columnas.`,
      startRow: Math.max(1, startRow),
      hasHeaderRow,
      columns: formattedCols,
      isDefault: false,
    };

    onCreateModule(newModule);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Crear nuevo módulo"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full sm:max-w-lg max-h-[92vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
      >
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Nuevo módulo de importación
            </h2>
            <p className="text-xs text-slate-500">
              Define estructura de columnas y fila de inicio propias
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nombre del módulo / sección
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Facturas de Importación"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Descripción breve (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Control mensual de comprobantes y proveedores"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Fila de inicio en Excel
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={startRow}
                onChange={(e) => setStartRow(Math.max(1, Number(e.target.value) || 1))}
                className="w-full min-h-[44px] px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Encabezados en fila {startRow}
              </label>
              <button
                type="button"
                onClick={() => setHasHeaderRow(!hasHeaderRow)}
                className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                  hasHeaderRow
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-slate-50 border-slate-300 text-slate-700'
                }`}
              >
                {hasHeaderRow ? 'Sí, incluye encabezados' : 'No, datos directos'}
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">
                Columnas del módulo ({columns.length})
              </label>
              <button
                type="button"
                onClick={handleAddColumn}
                className="min-h-[36px] px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar columna</span>
              </button>
            </div>

            <div className="space-y-2">
              {columns.map((col, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder={`Nombre columna ${idx + 1}`}
                    value={col.label}
                    onChange={(e) => {
                      const next = [...columns];
                      next[idx].label = e.target.value;
                      setColumns(next);
                    }}
                    className="flex-1 min-h-[44px] px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <select
                    value={col.type}
                    onChange={(e) => {
                      const next = [...columns];
                      next[idx].type = e.target.value as ColumnType;
                      setColumns(next);
                    }}
                    className="w-28 min-h-[44px] px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                  >
                    <option value="text">Texto</option>
                    <option value="code">Código</option>
                    <option value="date">Fecha</option>
                  </select>
                  <button
                    type="button"
                    disabled={columns.length <= 1}
                    onClick={() => handleRemoveColumn(idx)}
                    aria-label="Eliminar columna"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5 pb-safe">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 border border-slate-300 bg-white rounded-xl text-sm font-semibold text-slate-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="min-h-[44px] px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold"
          >
            Crear módulo
          </button>
        </div>
      </form>
    </div>
  );
};
