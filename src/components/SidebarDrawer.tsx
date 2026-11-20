import React from 'react';
import {
  Check,
  FileSpreadsheet,
  FolderPlus,
  Info,
  Layers,
  LogOut,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import { ModuleConfig } from '../types/records';
import { AppUser, TEST_USERS } from '../utils/auth';
import { InfoTopicId } from './InfoModal';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  onLogout: () => void;
  onSwitchUser: (user: AppUser) => void;
  modules: ModuleConfig[];
  activeModuleId: string;
  onSelectModule: (moduleId: string) => void;
  recordCountByModule: Record<string, number>;
  onTriggerUpload: () => void;
  onLoadSampleExcel: () => void;
  onOpenNewModule: () => void;
  onClearModuleData: (moduleId: string) => void;
  onOpenInfo: (topic: InfoTopicId) => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  onSwitchUser,
  modules,
  activeModuleId,
  onSelectModule,
  recordCountByModule,
  onTriggerUpload,
  onLoadSampleExcel,
  onOpenNewModule,
  onClearModuleData,
  onOpenInfo,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const activeModule =
    modules.find((m) => m.id === activeModuleId) || modules[0];
  const otherTestUser = TEST_USERS.find((u) => u.id !== currentUser.id);

  const content = (
    <div className="flex flex-col h-full bg-white text-slate-900">
      {/* Top sidebar header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-tight text-slate-900 truncate">
              {isAdmin ? 'Módulo de destino' : 'Módulos disponibles'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {isAdmin ? 'Sección de importación Excel' : 'Consulta por sección'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onOpenInfo('modules')}
            aria-label="Información sobre módulos y permisos"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
          >
            <Info className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú lateral"
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Current User & Quick Role Switch */}
        <div className="p-3 bg-slate-50 rounded-2xl space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isAdmin
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-800 text-white'
              }`}
            >
              {isAdmin ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">
                {currentUser.name}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {currentUser.roleLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {otherTestUser && (
              <button
                type="button"
                onClick={() => {
                  onSwitchUser(otherTestUser);
                  onClose();
                }}
                className="flex-1 min-h-[36px] px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-[11px] font-semibold shadow-xs transition-colors truncate"
              >
                Probar como {otherTestUser.role === 'admin' ? 'Admin' : 'Cliente'}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              aria-label="Cerrar sesión"
              className="min-h-[36px] px-2.5 py-1.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-xl text-[11px] font-semibold shadow-xs transition-colors flex items-center gap-1 shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>

        {/* Module Selector */}
        <div>
          <label
            htmlFor="sidebar-module-select"
            className="block text-xs font-semibold text-slate-600 mb-2"
          >
            {isAdmin ? 'Sección / módulo destino activo' : 'Sección a consultar'}
          </label>
          <select
            id="sidebar-module-select"
            value={activeModuleId}
            onChange={(e) => onSelectModule(e.target.value)}
            className="w-full min-h-[44px] px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          >
            {modules.map((mod) => (
              <option key={mod.id} value={mod.id}>
                {mod.name} ({recordCountByModule[mod.id] || 0})
              </option>
            ))}
          </select>

          <div
            className="mt-3 space-y-1.5"
            role="list"
            aria-label="Lista de módulos"
          >
            {modules.map((mod) => {
              const isSelected = mod.id === activeModuleId;
              const count = recordCountByModule[mod.id] || 0;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => {
                    onSelectModule(mod.id);
                    onClose();
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors min-h-[44px] flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-300 text-slate-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-semibold truncate block">
                      {mod.name}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                      {isAdmin ? `Fila inicio ${mod.startRow} · ` : ''}
                      {mod.columns.length} columnas · {count} reg.
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                  )}
                </button>
              );
            })}
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                onOpenNewModule();
                onClose();
              }}
              className="mt-3 w-full min-h-[44px] px-3 py-2 border border-dashed border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50/40 transition-colors flex items-center justify-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Crear nuevo módulo</span>
            </button>
          )}
        </div>

        {/* Active Module Schema Summary */}
        {activeModule && (
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-xs font-semibold text-slate-600 mb-2">
              Campos de «{activeModule.name}»
            </h3>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              {activeModule.description}
            </p>
            <div className="space-y-1.5">
              {activeModule.columns.map((col, index) => (
                <div
                  key={col.key}
                  className="flex items-center justify-between py-1.5 px-2.5 bg-slate-50 rounded-lg text-xs"
                >
                  <span className="font-medium text-slate-800 truncate">
                    {index + 1}. {col.label}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 shrink-0 ml-2">
                    {col.type === 'code'
                      ? 'Código'
                      : col.type === 'date'
                      ? 'Fecha'
                      : 'Texto'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin-Only Excel Import Controls */}
        {isAdmin ? (
          <div className="pt-4 border-t border-slate-200 space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-600">
              Importar Excel al módulo activo
            </h3>
            <button
              type="button"
              onClick={() => {
                onTriggerUpload();
                onClose();
              }}
              className="w-full min-h-[44px] px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Subir Excel (.xlsx, .xls, .csv)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onLoadSampleExcel();
                onClose();
              }}
              className="w-full min-h-[44px] px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-700" />
              <span>
                Cargar Excel de ejemplo (fila {activeModule?.startRow || 7})
              </span>
            </button>

            {(recordCountByModule[activeModuleId] || 0) > 0 && (
              <button
                type="button"
                onClick={() => onClearModuleData(activeModuleId)}
                className="w-full min-h-[44px] px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar registros de este módulo</span>
              </button>
            )}
          </div>
        ) : (
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 rounded-xl p-3">
              Acceso de <strong>solo lectura</strong>. Únicamente el administrador
              puede importar archivos Excel, editar módulos o subir documentos.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 border-r border-slate-200 bg-white h-[calc(100vh-3.5rem)] sticky top-14 overflow-hidden">
        {content}
      </aside>

      {/* Mobile / Tablet slide-over drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Selector de módulo y sesión"
        >
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative w-[86vw] max-w-xs h-full bg-white shadow-2xl z-10 flex flex-col">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
