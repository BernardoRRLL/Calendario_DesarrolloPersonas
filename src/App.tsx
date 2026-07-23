import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Plus, Calendar as CalendarIcon, BarChart3, ClipboardList } from 'lucide-react';

import { ROOMS } from './data/rooms';
import BookingModal from './components/BookingModal';
import LoginModal from './components/LoginModal';
import AuditModal from './components/AuditModal';
import ReportsModal from './components/ReportsModal';
import Header from './components/Header';
import Footer from './components/Footer';
import { supabase } from './supabase';

export default function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  const [prefilledTime, setPrefilledTime] = useState(null);
  
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false);
  
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, data: null });
  const calendarRef = useRef(null);

  const isAdmin = !!session;

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    
    fetchEvents();

    const fetchRole = async (email) => {
      const { data, error } = await supabase.from('user_roles').select('role').eq('email', email).single();
      if (data && !error) {
        setUserRole(data.role);
      } else {
        setUserRole('user');
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.email) fetchRole(session.user.email);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.email) {
        fetchRole(session.user.email);
      } else {
        setUserRole('user');
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      subscription.unsubscribe();
    };
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase.from('bookings').select('*');
    if (error) return;

    const formattedEvents = data.map(booking => {
      const room = ROOMS.find(r => r.id === booking.room_id);
      return {
        id: booking.id,
        title: booking.title,
        start: booking.start_time,
        end: booking.end_time,
        backgroundColor: room ? room.color : '#94a3b8',
        borderColor: room ? room.color : '#94a3b8',
        extendedProps: {
          roomId: booking.room_id,
          roomName: booking.room_name,
          coffeeService: booking.coffee_service,
          userName: booking.user_name || 'Sin nombre',
          userCompany: booking.user_company || '-',
          userPhone: booking.user_phone || '-',
          userEmail: booking.user_email || '-',
          attendees: booking.attendees || 1,
          observaciones: booking.observaciones || ''
        }
      };
    });
    setEvents(formattedEvents);
  };

  const handleAuthAction = async () => {
    if (session) {
      await supabase.auth.signOut();
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleSaveEvent = (savedEvent) => {
    if (selectedEvent) {
      setEvents(events.map(e => e.id === savedEvent.id ? savedEvent : e));
    } else {
      setEvents([...events, savedEvent]);
    }
  };

  const handleDeleteEvent = (eventId) => {
    setEvents(events.filter(e => e.id !== eventId));
  };

  const handleEventClick = (clickInfo) => {
    if (!isAdmin) {
      alert('Solo los administradores pueden editar o eliminar reservas.');
      return;
    }
    setTooltip({ show: false, x: 0, y: 0, data: null });
    
    const { event } = clickInfo;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      roomId: event.extendedProps.roomId,
      coffeeService: event.extendedProps.coffeeService,
      userName: event.extendedProps.userName,
      userCompany: event.extendedProps.userCompany,
      userPhone: event.extendedProps.userPhone,
      userEmail: event.extendedProps.userEmail,
      attendees: event.extendedProps.attendees,
      observaciones: event.extendedProps.observaciones
    });
    setPrefilledTime(null);
    setIsModalOpen(true);
  };

  const handleDateSelect = (selectInfo) => {
    if (!isAdmin) {
      alert('Solo los administradores pueden crear reservas.');
      selectInfo.view.calendar.unselect();
      return;
    }
    
    const pad = (n) => n.toString().padStart(2, '0');
    const s = selectInfo.start;
    const e = selectInfo.end;
    
    setPrefilledTime({
      date: `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}`,
      startTime: `${pad(s.getHours())}:${pad(s.getMinutes())}`,
      endTime: `${pad(e.getHours())}:${pad(e.getMinutes())}`
    });
    
    setSelectedEvent(null);
    setIsModalOpen(true);
    
    selectInfo.view.calendar.unselect();
  };

  const handleMouseEnter = (info) => {
    if (isMobile) return;
    setTooltip({
      show: true,
      x: info.jsEvent.clientX,
      y: info.jsEvent.clientY,
      data: info.event
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, x: 0, y: 0, data: null });
  };

  const openNewModal = () => {
    setSelectedEvent(null);
    setPrefilledTime(null);
    setIsModalOpen(true);
  };

  const handleQuickDateChange = (e) => {
    if (calendarRef.current && e.target.value) {
      calendarRef.current.getApi().gotoDate(e.target.value);
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX;
    touchStartY.current = e.changedTouches[0].screenY;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX;
    touchEndY.current = e.changedTouches[0].screenY;
    handleSwipe();
  };

  const handleSwipe = () => {
    const swipeDistanceX = touchEndX.current - touchStartX.current;
    const swipeDistanceY = touchEndY.current - touchStartY.current;
    
    if (Math.abs(swipeDistanceX) > 60 && Math.abs(swipeDistanceX) > Math.abs(swipeDistanceY) * 1.5) {
      if (swipeDistanceX < 0) {
        calendarRef.current?.getApi().next();
      } else {
        calendarRef.current?.getApi().prev();
      }
    }
  };

  const filteredEvents = selectedRooms.length === 0 
    ? events 
    : events.filter(e => selectedRooms.includes(e.extendedProps.roomId));

  return (
    <div className="flex flex-col min-h-screen relative">
      <style>{`
        .fc-theme-standard td, .fc-theme-standard th { 
          border: 1px solid #e2e8f0 !important; 
        }
        .fc-timegrid-slot-label { 
          font-weight: 500; 
          color: #64748b; 
        }
        
        .room-filter-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.75rem;
          box-sizing: border-box;
          transition: all 0.2s;
          font-weight: 600;
          width: 140px;
          height: 42px;
          font-size: 0.875rem;
        }

        .date-picker-responsive {
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          background-color: #f8fafc;
          color: #334155;
          outline: none;
          cursor: pointer;
          box-sizing: border-box;
          font-weight: 500;
          padding: 0.6rem 1rem 0.6rem 2.5rem;
          font-size: 0.875rem;
        }

        @media (max-width: 639px) {
          .room-filter-btn {
            width: calc(33.333% - 7px);
            height: 38px;
            font-size: 0.7rem;
            padding: 0 4px;
            text-align: center;
          }
          
          .date-picker-responsive {
            padding: 0.5rem 0.5rem 0.5rem 2rem;
            font-size: 0.75rem;
            width: 130px;
          }

          .fc-header-toolbar {
            flex-wrap: wrap !important;
            gap: 0.5rem;
          }
          .fc .fc-toolbar-title {
            font-size: 1.1rem !important;
          }
          .fc .fc-button {
            padding: 0.3rem 0.5rem !important;
            font-size: 0.75rem !important;
          }

          .fc-col-header-cell-cushion {
            font-size: 0.7rem !important;
            padding: 4px 2px !important;
          }
          .fc-timegrid-slot-label-cushion {
            font-size: 0.65rem !important;
            padding: 2px !important;
          }
        }
      `}</style>

      <Header isAdmin={isAdmin} onLogin={handleAuthAction} />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8">
        
        <div 
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white px-6 py-5 rounded-2xl border border-gray-100" 
          style={{ marginTop: '1.5rem', marginBottom: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
        >
          <div className="w-full md:w-3/4 flex flex-wrap" style={{ gap: '3px' }}>
            <button
              onClick={() => setSelectedRooms([])}
              className="room-filter-btn"
              style={{ 
                backgroundColor: selectedRooms.length === 0 ? '#0f172a' : '#f1f5f9', 
                color: selectedRooms.length === 0 ? '#ffffff' : '#475569',
                border: selectedRooms.length === 0 ? '1px solid transparent' : '1px solid #e2e8f0',
              }}
            >
              Todas
            </button>
            {ROOMS.map(room => {
              const isSelected = selectedRooms.includes(room.id);
              return (
                <button
                  key={room.id}
                  onClick={() => {
                    if (isSelected) { setSelectedRooms(selectedRooms.filter(id => id !== room.id)); } 
                    else { setSelectedRooms([...selectedRooms, room.id]); }
                  }}
                  className="room-filter-btn"
                  style={{
                    backgroundColor: isSelected ? room.color : '#ffffff',
                    color: isSelected ? '#ffffff' : '#475569',
                    border: isSelected ? '1px solid transparent' : '1px solid #e2e8f0',
                    boxShadow: isSelected ? '0 4px 14px 0 rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {room.name}
                </button>
              );
            })}
          </div>

          <div className="w-full md:w-1/4 flex flex-wrap items-center md:justify-end gap-3">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <CalendarIcon size={16} color="#64748b" style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }} />
              <input 
                type="date" 
                onChange={handleQuickDateChange}
                className="date-picker-responsive"
              />
            </div>

            {isAdmin && userRole === 'admin' && (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsReportsModalOpen(true)} 
                  title="Ver Reportes"
                  className="transition hover:bg-slate-200"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
                >
                  <BarChart3 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsAuditModalOpen(true)} 
                  title="Ver Auditoría"
                  className="transition hover:bg-slate-200"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
                >
                  <ClipboardList className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100"
          style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}
        >
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            views={{
              timeGridFourDay: {
                type: 'timeGrid',
                duration: { days: 4 },
                buttonText: '4 Días'
              }
            }}
            initialView={isMobile ? 'timeGridFourDay' : 'timeGridWeek'}
            
            windowResize={(arg) => {
              const mobile = window.innerWidth < 640;
              if (mobile && arg.view.type === 'timeGridWeek') {
                arg.view.calendar.changeView('timeGridFourDay');
              } else if (!mobile && arg.view.type === 'timeGridFourDay') {
                arg.view.calendar.changeView('timeGridWeek');
              }
            }}

            firstDay={1}
            headerToolbar={{ 
              left: 'prev,next today', 
              center: 'title', 
              right: isMobile ? 'dayGridMonth,timeGridFourDay,timeGridDay' : 'dayGridMonth,timeGridWeek,timeGridDay' 
            }}
            buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', timeGridFourDay: '4 Días', day: 'Día' }}
            allDaySlot={false}
            slotMinTime="07:00:00"
            slotMaxTime="22:00:00"
            locale="es"
            events={filteredEvents}
            height="auto"
            
            selectable={true}
            selectMirror={true}
            select={handleDateSelect}
            
            eventClick={handleEventClick}
            eventMouseEnter={handleMouseEnter}
            eventMouseLeave={handleMouseLeave}
            eventContent={(eventInfo) => {
              const { extendedProps } = eventInfo.event;
              return (
                <div className="p-1 md:p-1.5 overflow-hidden rounded-md flex flex-col items-start justify-start h-full" style={{ borderLeft: '3px solid rgba(255,255,255,0.7)' }}>
                  <div style={{ fontSize: '9px', opacity: 0.9, marginBottom: '2px', fontWeight: '600' }}>
                    {eventInfo.timeText}
                  </div>
                  <div className="font-bold text-[10px] md:text-[12px] leading-tight text-white">{extendedProps.roomName}</div>
                </div>
              );
            }}
          />
        </div>
      </main>

      <Footer />
      
      {isAdmin && (
        <button 
          onClick={openNewModal} 
          title="Nueva Reserva"
          className="transition hover:scale-105"
          style={{ 
            position: 'fixed', 
            bottom: '2rem', 
            right: '2rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            backgroundColor: '#0098aa', 
            color: '#ffffff', 
            border: 'none', 
            boxShadow: '0 10px 25px -5px rgba(0, 152, 170, 0.5)', 
            boxSizing: 'border-box',
            zIndex: 999 
          }}
        >
          <Plus className="w-8 h-8" />
        </button>
      )}

      <BookingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        events={events}
        existingEvent={selectedEvent}
        prefilledTime={prefilledTime}
      />

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />

      <AuditModal 
        isOpen={isAuditModalOpen} 
        onClose={() => setIsAuditModalOpen(false)} 
      />

      <ReportsModal 
        isOpen={isReportsModalOpen} 
        onClose={() => setIsReportsModalOpen(false)} 
      />

      {tooltip.show && tooltip.data && !isMobile && (
        <div 
          style={{
            position: 'fixed',
            top: tooltip.y + 15, 
            left: tooltip.x + 15, 
            backgroundColor: '#ffffff',
            padding: '1rem',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid #e2e8f0',
            zIndex: 99999,
            minWidth: '220px',
            pointerEvents: 'none' 
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#0098aa', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            {tooltip.data.extendedProps.roomName}
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.75rem' }}>
            {tooltip.data.title}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <p><strong>Empresa:</strong> {tooltip.data.extendedProps.userCompany}</p>
            <p><strong>Solicitante:</strong> {tooltip.data.extendedProps.userName}</p>
            <p><strong>Teléfono:</strong> {tooltip.data.extendedProps.userPhone}</p>
            <p><strong>Email:</strong> {tooltip.data.extendedProps.userEmail}</p>
            <p><strong>Asistentes:</strong> {tooltip.data.extendedProps.attendees} personas</p>
            {tooltip.data.extendedProps.coffeeService && (
              <p style={{ marginTop: '0.5rem', color: '#b45309', fontWeight: '600' }}>☕ Requiere Coffee Break</p>
            )}
            {tooltip.data.extendedProps.observaciones && (
              <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0' }}>
                <p><strong>Observaciones:</strong> {tooltip.data.extendedProps.observaciones}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
