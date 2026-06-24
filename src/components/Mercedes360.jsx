import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 16; 
const imagesUrls = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
  const frameNum = String(i + 1).padStart(2, '0');
  return `/images/GLA/gla-${frameNum}.avif`;
});

const Mercedes360 = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pre-carga de imágenes en memoria
  useEffect(() => {
    const loadedImages = [];
    let loadedCount = 0;

    imagesUrls.forEach((url, index) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loadedImages[index] = img;
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          setImages(loadedImages);
          setLoading(false);
        }
      };
    });
  }, []);

  // Control del scroll con GSAP
  useEffect(() => {
    if (loading || images.length === 0) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Ajustamos la resolución del canvas
    canvas.width = 1920;  
    canvas.height = 1080;

    // Primer render
    context.drawImage(images[0], 0, 0, canvas.width, canvas.height);

    const carState = { frame: 0 };

    const tl = gsap.to(carState, {
      frame: TOTAL_FRAMES - 1,
      snap: "frame",
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "+=3500", // Controla la duración del scroll (más alto = más lento)
        scrub: 0.5,     // Suavizado del movimiento
        pin: true,      // Clava la sección en pantalla
      },
      onUpdate: () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(images[carState.frame], 0, 0, canvas.width, canvas.height);
      }
    });

    // Animación extra para los textos (Estilo Polestar)
    gsap.fromTo(".text-fade", 
      { opacity: 1, y: 0 },
      {
        opacity: 0,
        y: -50,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=1000",
          scrub: true,
        }
      }
    );

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [loading, images]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#1a161d] text-white text-xl font-light tracking-widest">
        CARGANDO EXPERIENCIA MERCEDES-BENZ...
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-screen bg-[#1a161d] relative overflow-hidden">
      {/* Contenedor de la interfaz / Textos */}
      <div className="absolute inset-0 flex flex-col justify-between p-12 md:p-24 z-10 pointer-events-none">
        <div className="text-fade max-w-md">
          <span className="text-xs uppercase tracking-widest text-gray-400">Nuevo</span>
          <h2 className="text-4xl md:text-6xl font-extralight tracking-tight mt-2 text-white">Mercedes-Benz GLA</h2>
          <p className="text-gray-400 mt-4 font-light">Diseño dinámico, confort inteligente y la sofisticación que te define en cada kilómetro.</p>
        </div>
        
        <div className="flex justify-between items-center text-xs tracking-widest text-gray-500 uppercase">
          <div>01 / 360° INTERACTIVE</div>
          <div>SCROLL PARA ROTAR ↓</div>
        </div>
      </div>

      {/* El Canvas donde se dibuja el coche cuadro por cuadro */}
      <div className="w-full h-full flex items-center justify-center">
        <canvas 
          ref={canvasRef} 
          className="w-full h-[80vh] md:h-full object-contain select-none pointer-events-none"
        />
      </div>
    </div>
  );
};

export default Mercedes360;