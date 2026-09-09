import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteConfirmModal({ order, isOpen, onClose, onConfirmDelete, isDeleting }) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div onClick={onClose} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />

      <div className="relative bg-[#111827] border border-rose-900/60 w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-center text-white animate-scale-in">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto text-3xl shadow-lg">
          <AlertTriangle size={32} />
        </div>

        <div>
          <h3 className="text-xl font-black font-['Outfit'] text-white">
            Confirm Permanent Deletion
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Are you sure you want to permanently delete order <strong className="text-white font-mono">#{order.id}</strong> placed by <strong className="text-white">{order.student_name}</strong>?
          </p>
          <p className="text-[11px] text-rose-400 font-semibold mt-1">
            This action cannot be undone and will remove the order record from the Supabase database.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer border border-slate-700"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onConfirmDelete(order.id)}
            disabled={isDeleting}
            className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-colors cursor-pointer border-none flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 disabled:opacity-50"
          >
            <Trash2 size={15} />
            <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Order'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
