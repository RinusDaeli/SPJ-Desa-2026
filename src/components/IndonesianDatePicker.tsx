import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatTanggalIndonesia, getNamaHariIndonesia, toIsoDate } from '../utils/dateHelper';

interface IndonesianDatePickerProps {
  value: string; // ISO date 'YYYY-MM-DD'
  onChange: (val: string) => void;
  label?: string;
  id?: string;
  helperText?: string;
}

const HARI_HEADER = ['min', 'sen', 'sel', 'rab', 'kam', 'jum', 'sab'];

const NAMA_BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const IndonesianDatePicker: React.FC<IndonesianDatePickerProps> = ({
  value,
  onChange,
  label,
  id,
  helperText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const parseIso = (isoStr: string) => {
    if (!isoStr) return new Date();
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return new Date();
  };

  const currentDateObj = parseIso(value);
  const [viewYear, setViewYear] = useState<number>(currentDateObj.getFullYear() || 2026);
  const [viewMonth, setViewMonth] = useState<number>(currentDateObj.getMonth() || 0);

  // When value changes from outside, sync view year/month
  useEffect(() => {
    const d = parseIso(value);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Helpers for calendar calculation
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    // 0 = Sunday, 1 = Monday, etc.
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const isoString = `${viewYear}-${formattedMonth}-${formattedDay}`;
    onChange(isoString);
    setIsOpen(false);
  };

  const handleSetToday = () => {
    const today = new Date();
    const formatted = toIsoDate(today);
    onChange(formatted);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setIsOpen(false);
  };

  const handleSetYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const formatted = toIsoDate(yesterday);
    onChange(formatted);
    setViewYear(yesterday.getFullYear());
    setViewMonth(yesterday.getMonth());
    setIsOpen(false);
  };

  // Compare if day is selected
  const isSelected = (day: number) => {
    const selectedDate = parseIso(value);
    return (
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  const formattedDisplay = value
    ? `${getNamaHariIndonesia(value)}, ${formatTanggalIndonesia(value)}`
    : 'Pilih Tanggal';

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-300 mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 bg-slate-950 border border-slate-700 hover:border-emerald-500 rounded-lg text-xs shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer text-left"
      >
        <div className="flex items-center gap-2 truncate">
          <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-medium text-slate-200 truncate">{formattedDisplay}</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
          {value || 'YYYY-MM-DD'}
        </span>
      </button>

      {helperText && <div className="text-[10px] text-slate-400 mt-1">{helperText}</div>}

      {/* Calendar Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-3.5 w-72 sm:w-80 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Month / Year Navigation */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="text-xs font-bold text-slate-200 bg-slate-950 hover:bg-slate-800 py-1 px-2 rounded-md border border-slate-700 cursor-pointer focus:ring-1 focus:ring-emerald-500"
              >
                {NAMA_BULAN.map((m, idx) => (
                  <option key={idx} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="text-xs font-bold text-slate-200 bg-slate-950 hover:bg-slate-800 py-1 px-2 rounded-md border border-slate-700 cursor-pointer focus:ring-1 focus:ring-emerald-500"
              >
                {Array.from({ length: 11 }, (_, i) => 2020 + i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of week header in Indonesian: min, sen, sel, rab, kam, jum, sab */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {HARI_HEADER.map((hari, i) => (
              <div
                key={hari}
                className={`text-[11px] font-bold uppercase py-1 ${
                  i === 0 ? 'text-rose-400' : i === 5 ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {hari}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Blank offset before the first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`blank-${i}`} className="h-8"></div>
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const selected = isSelected(day);
              const today = isToday(day);
              const dayOfWeek = (firstDay + i) % 7;
              const isSunday = dayOfWeek === 0;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-8 mx-auto rounded-lg text-xs font-medium transition flex items-center justify-center cursor-pointer ${
                    selected
                      ? 'bg-emerald-600 text-white font-bold shadow-sm'
                      : today
                      ? 'border border-emerald-500 text-emerald-400 font-bold hover:bg-slate-800'
                      : isSunday
                      ? 'text-rose-400 hover:bg-slate-800 font-semibold'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Bottom quick shortcut buttons */}
          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSetToday}
                className="text-[11px] font-semibold text-emerald-400 hover:bg-slate-800 px-2 py-0.5 rounded cursor-pointer transition"
              >
                Hari ini
              </button>
              <button
                type="button"
                onClick={handleSetYesterday}
                className="text-[11px] font-semibold text-slate-300 hover:bg-slate-800 px-2 py-0.5 rounded cursor-pointer transition"
              >
                Kemarin
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-medium text-slate-400 hover:text-white px-2 py-0.5 rounded cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
