import React, { useState } from 'react';
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

export default function ConfigModal({ isOpen, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetFormAndClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones de frontend
    if (newPassword.length < 6) {
      return setError('La nueva contraseña debe tener al menos 6 caracteres.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Las contraseñas nuevas no coinciden.');
    }
    if (currentPassword === newPassword) {
      return setError('La nueva contraseña no puede ser igual a la actual.');
    }

    setIsSubmitting(true);

    try {
      // 1. Extraer el correo de la sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        throw new Error('No se detectó una sesión activa.');
      }

      // 2. Validar la clave actual (Login silencioso)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('La contraseña actual es incorrecta.');
      }

      // 3. Actualizar a la nueva clave
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      // Éxito
      setSuccess('¡Contraseña actualizada con éxito!');
      
      // Limpiar y cerrar después de 2 segundos
      setTimeout(() => {
        resetFormAndClose();
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', zIndex: 9999, padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#ffffff', borderRadius: '1.25rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', zIndex: 10000, boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ padding: '1.25rem 2rem 1rem 2rem', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Cambiar Contraseña
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {error && (
            <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              {error}
            </div>
          )}
          
          {success && (
            <div style={{ padding: '0.75rem', backgroundColor: '#dcfce3', color: '#15803d', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              {success}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Contraseña Actual</label>
            <input 
              type="password" 
              required 
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)} 
              disabled={isSubmitting || success !== ''} 
              style={inputStyle} 
              placeholder="••••••" 
            />
          </div>

          <div style={{ borderTop: '1px dashed #e2e8f0', margin: '0.25rem 0' }}></div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nueva Contraseña</label>
            <input 
              type="password" 
              required 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              disabled={isSubmitting || success !== ''} 
              style={inputStyle} 
              placeholder="Mínimo 6 caracteres" 
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Confirmar Nueva Contraseña</label>
            <input 
              type="password" 
              required 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              disabled={isSubmitting || success !== ''} 
              style={inputStyle} 
              placeholder="Repita la nueva contraseña" 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', gap: '1rem' }}>
            <button 
              type="button" 
              onClick={resetFormAndClose} 
              disabled={isSubmitting} 
              style={{ padding: '0.65rem 1.25rem', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '0.75rem', fontWeight: '600', border: 'none', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || success !== ''} 
              style={{ padding: '0.65rem 1.25rem', backgroundColor: (isSubmitting || success !== '') ? '#94a3b8' : '#0098aa', color: '#ffffff', borderRadius: '0.75rem', fontWeight: '600', border: 'none', cursor: 'pointer' }}
            >
              {isSubmitting ? 'Verificando...' : 'Guardar'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
