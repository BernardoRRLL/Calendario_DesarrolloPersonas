import React from 'react';
import { Settings, User } from 'lucide-react';

export default function Header({ session, userRole, onLogout, onOpenConfig }) {
  return (
    <header style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Fila Superior: Fondo Gris, Logos y Título */}
      <div style={{ backgroundColor: '#36424a', width: '100%' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'nowrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'clamp(10px, 2vw, 15px) 20px',
          maxWidth: '1400px',
          margin: '0 auto',
          boxSizing: 'border-box',
          gap: '10px'
        }}>
          {/* Logo Izquierdo */}
          <img 
            src="./Codelco_Ventanas.png" 
            alt="Codelco" 
            style={{ height: 'clamp(35px, 8vw, 65px)', width: 'auto', objectFit: 'contain' }} 
          />
          
          {/* Título Central */}
          <h1 style={{ 
            color: '#ffffff', 
            margin: 0, 
            fontSize: 'clamp(1.1rem, 4vw, 2.2rem)',
            fontWeight: 600, 
            textAlign: 'center', 
            flex: 1,
            lineHeight: 1.1
          }}>
            Reserva de Salas - Desarrollo de Personas
          </h1>
          
          {/* Logo Derecho */}
          <img 
            src="./somos_protagonistas.png" 
            alt="Somos Protagonistas" 
            style={{ height: 'clamp(35px, 8vw, 65px)', width: 'auto', objectFit: 'contain' }} 
          />
        </div>
      </div>
      
      {/* 2. Fila Intermedia: Línea Naranja */}
      <div style={{ height: '5px', backgroundColor: '#e45302', width: '100%' }}></div>

      {/* 3. Fila Inferior: Barra Turquesa de Controles (Solo visible si hay sesión) */}
      {session && (
        <div style={{ backgroundColor: '#0098aa', width: '100%' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            padding: '8px 20px',
            maxWidth: '1400px',
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box',
            gap: '15px',
            color: '#ffffff',
            fontSize: '0.9rem'
          }}>
            
            {/* Información del Usuario */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User className="w-4 h-4" />
              <span style={{ fontWeight: 500 }}>
                {session.user.email} {userRole === 'admin' ? '(Admin)' : '(Usuario)'}
              </span>
            </div>

            {/* Ícono de Configuración */}
            <button 
              onClick={onOpenConfig}
              title="Cambiar Contraseña"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', backgroundColor: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Botón de Cerrar Sesión */}
            <button 
              onClick={onLogout}
              title="Cerrar Sesión"
              style={{ display: 'flex', alignItems: 'center', padding: '4px 12px', backgroundColor: 'transparent', border: '1px solid #ffffff', borderRadius: '4px', color: '#ffffff', cursor: 'pointer', fontWeight: 500, transition: 'background-color 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Cerrar Sesión
            </button>
            
          </div>
        </div>
      )}
    </header>
  );
}
