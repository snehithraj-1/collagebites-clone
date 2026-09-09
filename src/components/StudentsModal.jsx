import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Hash, RefreshCw, ShoppingBag } from 'lucide-react';

export default function StudentsModal({ isOpen, onClose }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      console.warn('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div onClick={onClose} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />

      <div className="relative bg-[#111827] border border-slate-700 w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white text-xs animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-lg border border-blue-500/30">
              👥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black font-['Outfit'] text-white">
                  Student Database Records
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold">
                  {students.length} Registered
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Synchronized live with Neon PostgreSQL (<code className="text-emerald-400">students</code> table)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStudents}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="Refresh Students"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-blue-400' : ''} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Student Records List */}
        <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-slate-400 text-xs">Loading students from Neon PostgreSQL...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No student profiles recorded yet. Students are automatically saved when they sign in or order.
            </div>
          ) : (
            students.map((student) => (
              <div
                key={student.id || student.email}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-white">
                      {student.name}
                    </span>
                  </div>
                  {student.total_orders !== undefined && (
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-800">
                      {student.total_orders} Orders
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 text-[11px] pt-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail size={12} className="text-slate-400 shrink-0" />
                    <span className="font-mono truncate">{student.email}</span>
                  </div>

                  {student.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} className="text-emerald-400 shrink-0" />
                      <span className="font-mono">{student.phone}</span>
                    </div>
                  )}

                  {(student.hostel_block || student.room_number) && (
                    <div className="flex items-center gap-1.5 sm:col-span-2">
                      <MapPin size={12} className="text-[#FF5722] shrink-0" />
                      <span>
                        {student.hostel_block} {student.room_number ? `Room ${student.room_number}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
          <span>Persisted securely in Neon AWS PostgreSQL</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer border border-slate-700"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
