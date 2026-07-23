import React from 'react';
import { Lock, Unlock } from 'lucide-react';

export default function Header({ isAdmin, onLogin }) {
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
        {/* 1. Logo Izquierdo */}
        <img 
          src="/Codelco_Ventanas.png" 
          alt="Codelco" 
          style={{ height: 'clamp(30px, 8vw, 60px)', width: 'auto', objectFit: 'contain' }} 
        />
        
        {/* 2. Título Central (Cambié el texto para este proyecto) */}
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
        
        {/* 3. Bloque Derecho: Logo + Botón de Acceso */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(5px, 2vw, 15px)' }}>
          <img 
            src="/somos_protagonistas.png" 
            alt="Somos Protagonistas" 
            className="hidden sm:block" // Ocultamos el 2do logo en móviles muy pequeños para no romper el layout
            style={{ height: 'clamp(30px, 8vw, 60px)', width: 'auto', objectFit: 'contain' }} 
          />
          
          <button 
            onClick={onLogin}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-medium transition ${
              isAdmin 
                ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100' 
                : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
            }`}
          >
            {isAdmin ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {/* El texto del botón desaparece en móvil, queda solo el ícono */}
            <span className="hidden md:inline text-sm">
              {isAdmin ? 'Admin' : 'Acceso'}
            </span>
          </button>
        </div>
      </div>
      
      {/* Línea naranja corporativa */}
      <div style={{ height: '5px', backgroundColor: '#e45302', width: '100%' }}></div>
    </header>
  );
}