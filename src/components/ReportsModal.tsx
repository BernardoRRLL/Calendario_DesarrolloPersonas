import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { ROOMS } from '../data/rooms';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function ReportsModal({ isOpen, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState({
    occupancyRate: 0,
    totalHours: 0,
    baseHours: 0,
    totalAttendees: 0,
    topCompanies: [],
    coffeeStats: []
  });

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [roomFilter, setRoomFilter] = useState('');

  useEffect(() => {
    if (isOpen) {
      generateReport();
    }
  }, [isOpen, startDate, endDate, roomFilter]);

  const calculateBaseHours = (startStr, endStr, roomsCount) => {
    let current = new Date(`${startStr}T00:00:00`);
    const end = new Date(`${endStr}T23:59:59`);
    let activeDays = 0;

    while (current <= end) {
      const day = current.getDay();
      if (day >= 1 && day <= 4) { // 1=Lunes, 4=Jueves
        activeDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    return activeDays * 10 * roomsCount;
  };

  const generateReport = async () => {
    if (!startDate || !endDate) return;
    setIsLoading(true);

    let query = supabase
      .from('bookings')
      .select('*')
      .gte('start_time', `${startDate}T00:00:00`)
      .lte('end_time', `${endDate}T23:59:59`);

    if (roomFilter) {
      query = query.eq('room_id', roomFilter);
    }

    const { data: bookings, error } = await query;
    
    if (error || !bookings) {
      setIsLoading(false);
      return;
    }

    let sumHours = 0;
    let sumAttendees = 0;
    const companyUsage = {};
    let coffeeYes = 0;
    let coffeeNo = 0;

    bookings.forEach(b => {
      const start = new Date(b.start_time).getTime();
      const end = new Date(b.end_time).getTime();
      const durationHours = (end - start) / (1000 * 60 * 60);
      
      sumHours += durationHours;
      sumAttendees += (b.attendees || 1);

      if (b.coffee_service) coffeeYes++;
      else coffeeNo++;

      const company = b.user_company?.trim() || 'Sin Empresa';
      if (!companyUsage[company]) companyUsage[company] = 0;
      companyUsage[company] += durationHours;
    });

    const activeRoomsCount = roomFilter ? 1 : ROOMS.length;
    const baseHours = calculateBaseHours(startDate, endDate, activeRoomsCount);
    const occupancyRate = baseHours > 0 ? ((sumHours / baseHours) * 100).toFixed(1) : 0;

    const topCompanies = Object.keys(companyUsage)
      .map(key => ({ name: key, horas: Number(companyUsage[key].toFixed(1)) }))
      .sort((a, b) => b.horas - a.horas)
      .slice(0, 5);

    const coffeeStats = [
      { name: 'Con Coffee', value: coffeeYes, color: '#0098aa' },
      { name: 'Sin Coffee', value: coffeeNo, color: '#94a3b8' }
    ];

    setData({
      occupancyRate,
      totalHours: sumHours.toFixed(1),
      baseHours,
      totalAttendees: sumAttendees,
      topCompanies,
      coffeeStats
    });

    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', zIndex: 9999, padding: '1rem' }}>
      
      {/* Estilos responsivos internos del modal */}
      <style>{`
        .reports-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        .reports-charts-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
        }
        .reports-filter-item {
          flex: 1 1 200px;
        }

        /* Modo Celular */
        @media (max-width: 639px) {
          .reports-kpi-grid {
            grid-template-columns: 1fr;
          }
          .reports-charts-grid {
            grid-template-columns: 1fr;
          }
          .reports-filter-item {
            flex: 1 1 100%;
          }
          .recharts-responsive-container {
            min-height: 250px;
          }
        }
      `}</style>

      <div style={{ backgroundColor: '#f8fafc', borderRadius: '1rem', width: '100%', maxWidth: '1000px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
        
        {/* Cabecera */}
        <div style={{ padding: '1rem 1.5rem', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Dashboard de Utilización</h2>
          <button onClick={onClose} style={{ padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 'bold', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>
            Cerrar
          </button>
        </div>

        {/* Filtros */}
        <div style={{ padding: '1rem 1.5rem', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="reports-filter-item">
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.25rem' }}>Desde</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }} />
          </div>
          <div className="reports-filter-item">
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.25rem' }}>Hasta</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }} />
          </div>
          <div className="reports-filter-item">
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.25rem' }}>Sala</label>
            <select value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}>
              <option value="">Todas las salas combinadas</option>
              {ROOMS.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Contenido del Reporte */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontWeight: 'bold' }}>Procesando métricas...</div>
          ) : (
            <>
              {/* Tarjetas KPI */}
              <div className="reports-kpi-grid">
                <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Ocupación Efectiva</div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: data.occupancyRate > 100 ? '#b91c1c' : '#0f172a', marginTop: '0.5rem' }}>
                    {data.occupancyRate}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    {data.totalHours} hrs usadas de {data.baseHours} hrs base
                  </div>
                </div>

                <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Tráfico de Personas</div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', marginTop: '0.5rem' }}>
                    {data.totalAttendees}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Asistentes totales en el periodo</div>
                </div>
              </div>

              {/* Gráficos */}
              <div className="reports-charts-grid">
                
                {/* Ranking de Empresas */}
                <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minHeight: '300px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.5rem', marginTop: 0 }}>Empresas con Mayor Consumo (Horas)</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.topCompanies} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                      <RechartsTooltip cursor={{fill: '#f1f5f9'}} />
                      <Bar dataKey="horas" fill="#0098aa" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Proporción Coffee Break */}
                <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minHeight: '300px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem', marginTop: 0, textAlign: 'center' }}>Carga Logística (Coffee)</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={data.coffeeStats} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {data.coffeeStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                    {data.coffeeStats.map((entry, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>
                        <div style={{ width: '12px', height: '12px', backgroundColor: entry.color, borderRadius: '50%' }}></div>
                        {entry.name}: {entry.value}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}