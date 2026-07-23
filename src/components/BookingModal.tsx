import React, { useState, useEffect } from 'react';
import { ROOMS } from '../data/rooms';
import { supabase } from '../supabase';

const inputStyle = { 
  border: '1px solid #e2e8f0', 
  padding: '0.65rem 1rem', 
  width: '100%', 
  borderRadius: '0.75rem',
  backgroundColor: '#f8fafc',
  color: '#0f172a',
  fontSize: '0.9rem',
  outline: 'none',
  transition: 'border-color 0.2s ease',
  boxSizing: 'border-box' as const
};

export default function BookingModal({ isOpen, onClose, onSave, onDelete, events, existingEvent, prefilledTime }) {
  const [title, setTitle] = useState('');
  const [roomId, setRoomId] = useState(ROOMS[0].id);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [coffeeService, setCoffeeService] = useState(false);
  const [attendees, setAttendees] = useState('');
  
  const [userName, setUserName] = useState('');
  const [userCompany, setUserCompany] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [observaciones, setObservaciones] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingEvent && isOpen) {
      setTitle(existingEvent.title);
      setRoomId(existingEvent.roomId);
      setCoffeeService(existingEvent.coffeeService);
      setAttendees(existingEvent.attendees || '');
      setUserName(existingEvent.userName || '');
      setUserCompany(existingEvent.userCompany || '');
      setUserPhone(existingEvent.userPhone || '');
      setUserEmail(existingEvent.userEmail || '');
      setObservaciones(existingEvent.observaciones || '');
      
      const s = new Date(existingEvent.start);
      const e = new Date(existingEvent.end);
      const pad = (n) => n.toString().padStart(2, '0');
      setDate(`${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}`);
      setStartTime(`${pad(s.getHours())}:${pad(s.getMinutes())}`);
      setEndTime(`${pad(e.getHours())}:${pad(e.getMinutes())}`);
    } else if (isOpen) {
      setTitle('');
      setRoomId(ROOMS[0].id);
      setCoffeeService(false);
      setAttendees('');
      setUserName('');
      setUserCompany('');
      setUserPhone('');
      setUserEmail('');
      setObservaciones('');

      if (prefilledTime) {
        setDate(prefilledTime.date);
        setStartTime(prefilledTime.startTime);
        setEndTime(prefilledTime.endTime);
      } else {
        setDate('');
        setStartTime('09:00');
        setEndTime('10:00');
      }
    }
  }, [existingEvent, isOpen, prefilledTime]);

  if (!isOpen) return null;

  const handleStartTimeChange = (e) => {
    const newStart = e.target.value;
    setStartTime(newStart);
    
    if (newStart) {
      const [hours, minutes] = newStart.split(':').map(Number);
      const nextHour = hours + 1;
      
      if (nextHour > 22 || (nextHour === 22 && minutes > 0)) {
        setEndTime('22:00');
      } else {
        const formattedHour = nextHour.toString().padStart(2, '0');
        const formattedMinute = minutes.toString().padStart(2, '0');
        setEndTime(`${formattedHour}:${formattedMinute}`);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const room = ROOMS.find(r => r.id === roomId);
    const startTimestamp = `${date}T${startTime}:00`;
    const endTimestamp = `${date}T${endTime}:00`;
    const newStart = new Date(startTimestamp).getTime();
    const newEnd = new Date(endTimestamp).getTime();

    if (newStart >= newEnd) {
      alert('⚠️ Error: La hora de inicio debe ser menor a la hora de fin.');
      setIsSubmitting(false);
      return;
    }

    const isOverlap = events.some(ev => {
      if (existingEvent && ev.id === existingEvent.id) return false;
      
      const tryingRoomId = room.id;
      const bookedRoomId = ev.extendedProps.roomId;

      const isFureGroup = (id) => id === 'fure-completo' || id === 'fure-compacto';
      const isFureCollision = isFureGroup(tryingRoomId) && isFureGroup(bookedRoomId);
      
      const isSameRoom = tryingRoomId === bookedRoomId;

      if (!isSameRoom && !isFureCollision) return false;

      const evStart = new Date(ev.start).getTime();
      const evEnd = new Date(ev.end).getTime();
      return newStart < evEnd && newEnd > evStart;
    });

    if (isOverlap) {
      alert('⚠️ Error: Conflicto de espacio. La sala (o una subdivisión de la misma) ya está reservada en ese horario.');
      setIsSubmitting(false);
      return;
    }

    const payload = { 
      title, 
      room_id: room.id, 
      room_name: room.name, 
      start_time: startTimestamp, 
      end_time: endTimestamp, 
      coffee_service: coffeeService, 
      user_name: userName, 
      user_company: userCompany,
      user_phone: userPhone, 
      user_email: userEmail,
      attendees: parseInt(attendees, 10) || 1,
      observaciones: observaciones
    };

    const response = existingEvent 
      ? await supabase.from('bookings').update(payload).eq('id', existingEvent.id).select()
      : await supabase.from('bookings').insert([payload]).select();

    setIsSubmitting(false);
    if (response.error) return alert('Error: ' + response.error.message);

    const savedBooking = response.data[0];
    onSave({
      id: savedBooking.id, 
      title: savedBooking.title, 
      start: savedBooking.start_time, 
      end: savedBooking.end_time, 
      backgroundColor: room.color, 
      borderColor: room.color,
      extendedProps: { 
        roomId: savedBooking.room_id, 
        roomName: savedBooking.room_name, 
        coffeeService: savedBooking.coffee_service, 
        userName: savedBooking.user_name,
        userCompany: savedBooking.user_company,
        userPhone: savedBooking.user_phone, 
        userEmail: savedBooking.user_email,
        attendees: savedBooking.attendees,
        observaciones: savedBooking.observaciones
      }
    });
    onClose();
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar esta reserva permanentemente?')) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('bookings').delete().eq('id', existingEvent.id);
    setIsSubmitting(false);
    if (error) return alert('Error al eliminar: ' + error.message);
    onDelete(existingEvent.id);
    onClose();
  };

  return (
    <div 
      style={{ 
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', 
        backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', zIndex: 9999, padding: '1rem'
      }}
    >
      <div 
        style={{ 
          width: '100%', maxWidth: '600px', backgroundColor: '#ffffff', borderRadius: '1.25rem', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', zIndex: 10000, boxSizing: 'border-box',
          overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '95vh'
        }}
      >
        <div style={{ padding: '1.25rem 2rem 1rem 2rem', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            {existingEvent ? 'Editar Reserva' : 'Nueva Reserva'}
          </h2>
        </div>
        
        <div style={{ overflowY: 'auto', padding: '1.25rem 2rem 1.5rem 2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Datos de la Reunión</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} disabled={isSubmitting} style={inputStyle} placeholder="Motivo (Ej: Reunión de Directorio)" />
              </div>

              <div>
                <select value={roomId} onChange={(e) => setRoomId(e.target.value)} disabled={isSubmitting} style={{...inputStyle, cursor: 'pointer'}}>
                  {ROOMS.map(room => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <input type="number" min="1" required value={attendees} onChange={(e) => setAttendees(e.target.value)} disabled={isSubmitting} style={inputStyle} placeholder="Nº de Asistentes" />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} disabled={isSubmitting} style={{...inputStyle, cursor: 'pointer'}} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Inicio</label>
                <input 
                  type="time" 
                  required 
                  step="900" 
                  value={startTime} 
                  onChange={handleStartTimeChange} 
                  disabled={isSubmitting} 
                  style={inputStyle} 
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Fin</label>
                <input 
                  type="time" 
                  required 
                  step="900" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)} 
                  disabled={isSubmitting} 
                  style={inputStyle} 
                />
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #e2e8f0', margin: '0.5rem 0' }}></div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Datos del Solicitante</label>
                <input type="text" required value={userName} onChange={(e) => setUserName(e.target.value)} disabled={isSubmitting} style={inputStyle} placeholder="Nombre completo" />
              </div>
              
              <div style={{ gridColumn: '1 / -1' }}>
                <input type="text" required value={userCompany} onChange={(e) => setUserCompany(e.target.value)} disabled={isSubmitting} style={inputStyle} placeholder="Empresa" />
              </div>
              
              <div>
                <input type="text" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} disabled={isSubmitting} style={inputStyle} placeholder="Teléfono (Opcional)" />
              </div>
              
              <div>
                <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} disabled={isSubmitting} style={inputStyle} placeholder="Correo (Opcional)" />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <textarea 
                  value={observaciones} 
                  onChange={(e) => setObservaciones(e.target.value)} 
                  disabled={isSubmitting} 
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }} 
                  placeholder="Observaciones adicionales (Opcional)" 
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}>
              <input type="checkbox" id="coffee" checked={coffeeService} onChange={(e) => setCoffeeService(e.target.checked)} disabled={isSubmitting} style={{ width: '1.1rem', height: '1.1rem', accentColor: '#0098aa', cursor: 'pointer' }} />
              <label htmlFor="coffee" className="text-sm font-semibold text-slate-700 cursor-pointer">☕ Servicio con Coffee Break</label>
            </div>

            <div style={{ display: 'flex', justifyContent: existingEvent ? 'space-between' : 'flex-end', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
              {existingEvent && (
                <button type="button" onClick={handleDelete} disabled={isSubmitting} style={{ padding: '0.65rem 1.25rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.75rem', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
                  Eliminar
                </button>
              )}
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={onClose} disabled={isSubmitting} style={{ padding: '0.65rem 1.25rem', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '0.75rem', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '0.65rem 1.25rem', backgroundColor: isSubmitting ? '#94a3b8' : '#0098aa', color: '#ffffff', borderRadius: '0.75rem', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}