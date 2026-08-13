import React from 'react';
import { LogOut } from 'lucide-react';

export default function Header({ session, onLogout }) {
  return (
    <header style={{ backgroundColor: '#36424a', width: '100%' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'nowrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'clamp(10px, 2vw, 15px) 15px',
        maxWidth: '1300px',
        margin: '0 auto',
        gap: '10px'
      }}>
        {/* 1. Logo Izquierdo (Ruta relativa ajustada) */}
        <img 
          src="./Codelco_Ventanas.png" 
          alt="Codelco" 
          style={{ height: 'clamp(30px, 8vw, 60px)', width: 'auto', objectFit: 'contain' }} 
        />
        
        {/* 2. Título Central */}
        <h1 style={{ 
          color: '#ffffff', 
          margin: 0, 
          fontSize: 'clamp(1rem, 4vw, 2.2rem)',
          fontWeight: 600, 
          textAlign: 'center', 
          flex: 1,
          lineHeight: 1.1
        }}>
          Reserva de Salas - Desarrollo de Personas
        </h1>
        
        {/* 3. Bloque Derecho: Logo + Botón de Salir (Ruta relativa ajustada) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(5px, 2vw, 15px)' }}>
          <img 
            src="./somos_protagonistas.png" 
            alt="Somos Protagonistas" 
            className="hidden sm:block" 
            style={{ height: 'clamp(30px, 8vw, 60px)', width: 'auto', objectFit: 'contain' }} 
          />
          
          {session && (
            <button 
              onClick={onLogout}
              title="Cerrar Sesión"
              className="flex items-center gap-2 px-3 py-2 rounded-lg border font-medium transition bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline text-sm">Salir</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Línea naranja corporativa */}
      <div style={{ height: '5px', backgroundColor: '#e45302', width: '100%' }}></div>
    </header>
  );
}
