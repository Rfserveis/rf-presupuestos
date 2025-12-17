// PlaceholderProximamente.jsx - Componente para calculadores en desarrollo
import React from 'react';

const PlaceholderProximamente = ({ titulo, icono, color = 'gray' }) => {
  const colores = {
    emerald: 'from-emerald-500 to-emerald-600',
    rose: 'from-rose-500 to-rose-600',
    red: 'from-red-500 to-red-600',
    gray: 'from-gray-500 to-gray-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className={`bg-gradient-to-r ${colores[color] || colores.gray} px-6 py-4`}>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          {icono} {titulo}
        </h2>
      </div>
      
      <div className="p-12 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h3 className="text-2xl font-bold text-gray-700 mb-2">Proximamente</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Este calculador esta en desarrollo. 
          Estamos trabajando para ofrecerte la mejor experiencia.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-sm text-gray-400">
          <span className="animate-pulse">●</span>
          En construccion
        </div>
      </div>
    </div>
  );
};

// Barandillas All Glass
export const CalculadorBarandillasAllGlass = () => (
  <PlaceholderProximamente 
    titulo="Barandillas All Glass" 
    icono="🛡️" 
    color="emerald" 
  />
);

// Escaleras D'Opera
export const CalculadorEscalerasOpera = () => (
  <PlaceholderProximamente 
    titulo="Escaleras D'Opera" 
    icono="🎭" 
    color="rose" 
  />
);

// Escaleras RF
export const CalculadorEscalerasRF = () => (
  <PlaceholderProximamente 
    titulo="Escaleras RF (Resistentes al Fuego)" 
    icono="🔥" 
    color="red" 
  />
);

export default PlaceholderProximamente;
