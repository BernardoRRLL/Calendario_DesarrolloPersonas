import React, { useState } from 'react';
import { supabase } from '../supabase';

export default function LoginModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Credenciales inválidas. Verifica tu correo y contraseña.');
    } else {
      // Limpiamos los campos al salir
      setEmail('');
      setPassword('');
      onClose();
    }
    setIsLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', zIndex: 9999, padding: '1rem' }}>
      <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', color: '#0f172a' }}>
          Acceso Administrativo
        </h2>
        
        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.5rem', color: '#475569' }}>Correo Electrónico</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' }} 
              placeholder="usuario@empresa.com"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.5rem', color: '#475569' }}>Contraseña</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' }} 
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: isLoading ? '#94a3b8' : '#0098aa', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
              {isLoading ? 'Autenticando...' : 'Ingresar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}