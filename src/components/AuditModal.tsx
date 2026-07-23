import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { ROOMS } from '../data/rooms';

export default function AuditModal({ isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para los filtros
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [roomFilter, setRoomFilter] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  useEffect(() => {
    applyFilters();
  }, [logs, startDate, endDate, roomFilter]);

  const fetchLogs = async () => {
    setIsLoading(true);
    // Traemos los últimos 500 movimientos para el filtro en memoria
    const { data, error } = await supabase
      .from('audit_logs_view')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
      
    if (!error && data) {
      setLogs(data);
    }
    setIsLoading(false);
  };

  const applyFilters = () => {
    let result = [...logs];

    if (startDate) {
      const start = new Date(`${startDate}T00:00:00`).getTime();
      result = result.filter(log => new Date(log.created_at).getTime() >= start);
    }

    if (endDate) {
      const end = new Date(`${endDate}T23:59:59`).getTime();
      result = result.filter(log => new Date(log.created_at).getTime() <= end);
    }

    if (roomFilter) {
      result = result.filter(log => {
        const data = log.action === 'DELETE' ? log.old_data : log.new_data;
        return data && data.room_id === roomFilter;
      });
    }

    setFilteredLogs(result);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setRoomFilter('');
  };

  if (!isOpen) return null;

  const getActionColor = (action) => {
    if (action === 'INSERT') return { bg: '#dcfce7', text: '#166534', label: 'CREADO' };
    if (action === 'UPDATE') return { bg: '#fef9c3', text: '#854d0e', label: 'EDITADO' };
    if (action === 'DELETE') return { bg: '#fee2e2', text: '#991b1b', label: 'BORRADO' };
    return { bg: '#f1f5f9', text: '#475569', label: action };
  };

  const getTitle = (log) => {
    const data = log.action === 'DELETE' ? log.old_data : log.new_data;
    return data ? `${data.title} (${data.room_name})` : 'Dato no disponible';
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', zIndex: 9999, padding: '1rem' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '1rem', width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        
        {/* Cabecera */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Registro de Auditoría</h2>
          <button onClick={onClose} style={{ padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 'bold', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>
            Cerrar
          </button>
        </div>

        {/* Zona de Filtros */}
        <div style={{ padding: '1rem 1.5rem', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.25rem' }}>Fecha Inicio</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
            />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.25rem' }}>Fecha Fin</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
            />
          </div>
          <div style={{ flex: '1 1 250px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.25rem' }}>Sala</label>
            <select 
              value={roomFilter} 
              onChange={(e) => setRoomFilter(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
            >
              <option value="">Todas las salas</option>
              {ROOMS.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </div>
          {(startDate || endDate || roomFilter) && (
            <button 
              onClick={clearFilters}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: 'bold', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', height: '38px' }}
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Lista de Registros */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc' }}>
          {isLoading ? (
            <p style={{ textAlign: 'center', color: '#64748b' }}>Cargando registros...</p>
          ) : filteredLogs.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem 0' }}>No se encontraron movimientos para estos filtros.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'right', marginBottom: '0.5rem' }}>
                Mostrando {filteredLogs.length} registros
              </div>
              {filteredLogs.map((log) => {
                const style = getActionColor(log.action);
                const date = new Date(log.created_at).toLocaleString('es-CL');
                return (
                  <div key={log.id} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem', display: 'grid', gridTemplateColumns: '90px 1fr', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ backgroundColor: style.bg, color: style.text, padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', textAlign: 'center' }}>
                      {style.label}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#0f172a' }}>{getTitle(log)}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                        Por: <span style={{ fontWeight: '600', color: '#334155' }}>{log.user_email || 'Usuario Desconocido'}</span> • {date}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}