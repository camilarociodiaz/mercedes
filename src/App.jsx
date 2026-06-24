import React from 'react';
import GLAHorizontalCarousel from './components/GLAHorizontalCarousel';

function App() {
  return (
    <div className="w-full bg-black">
      {/* Sección de Introducción de la Landing */}
      <section className="w-full h-screen flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-zinc-900 to-black">
        <h1 className="text-5xl md:text-7xl font-thin tracking-widest mb-4">MERCEDES-BENZ</h1>
        <p className="text-zinc-400 text-sm md:text-lg max-w-xl font-light uppercase tracking-wider">
          El futuro de la conducción premium empieza aquí. Desliza hacia abajo.
        </p>
      </section>

      {/* NUESTRA SECCIÓN ANIMADA HORIZONTAL */}
      <GLAHorizontalCarousel />

      {/* Sección de Cierre / Características */}
      <section className="w-full h-screen flex items-center justify-center bg-white p-6">
        <div className="max-w-4xl text-center">
          <h3 className="text-3xl md:text-5xl font-light mb-6">Detalles que marcan la diferencia.</h3>
          <p className="text-zinc-500 font-light max-w-2xl mx-auto">
            Cada línea de la carrocería del GLA ha sido optimizada aerodinámicamente. Al interactuar mediante el scroll, se puede apreciar la fluidez de su silueta coupé.
          </p>
        </div>
      </section>
    </div>
  );
}

export default App;