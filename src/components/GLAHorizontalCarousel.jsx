import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const TOTAL_FRAMES = 16;
const SLOT_COUNT = 3;
const LOOP_BLOCKS = 3;
const MIDDLE_BLOCK_INDEX = 1;

const slotContent = [
  {
    id: '01',
    badge: 'Mercedes 1',
    title: 'Mercedes-Benz GLA Vision',
    description:
      'A sculpted silhouette with dynamic lines and progressive detail language inspired by Polestar-like storytelling.',
  },
  {
    id: '02',
    badge: 'Mercedes 2',
    title: 'Mercedes-Benz GLA Momentum',
    description:
      'Confident proportions and a precise profile that evolves as the car rotates across every horizontal gesture.',
  },
  {
    id: '03',
    badge: 'Mercedes 3',
    title: 'Mercedes-Benz GLA Signature',
    description:
      'High-tech elegance with a refined exterior narrative, revealed frame by frame while the scene moves laterally.',
  },
];

const frameUrls = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
  const frameNum = String(i + 1).padStart(2, '0');
  return `/images/GLA/gla-${frameNum}.avif`;
});

const extendedSlots = Array.from({ length: SLOT_COUNT * LOOP_BLOCKS }, (_, index) => {
  const baseIndex = index % SLOT_COUNT;
  return {
    ...slotContent[baseIndex],
    visualIndex: index,
    baseIndex,
  };
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const GLAHorizontalCarousel = () => {
  const scrollRef = useRef(null);
  const cardRefs = useRef([]);
  const canvasRefs = useRef([]);
  const textRefs = useRef([]);
  const lastFramesRef = useRef(Array(extendedSlots.length).fill(-1));
  const rafIdRef = useRef(0);
  const isRecenteringRef = useRef(false);
  const isCenteredOnMountRef = useRef(false);
  const dragStateRef = useRef({
    isPointerDown: false,
    startX: 0,
    startScrollLeft: 0,
  });
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const preloadFrames = async () => {
      try {
        const loadedFrames = await Promise.all(
          frameUrls.map(
            (url) =>
              new Promise((resolve, reject) => {
                const image = new Image();
                image.src = url;
                image.onload = () => resolve(image);
                image.onerror = () => reject(new Error(`Failed to load ${url}`));
              })
          )
        );

        if (!cancelled) {
          setFrames(loadedFrames);
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError('No se pudieron cargar los fotogramas del carrusel.');
          setLoading(false);
        }
      }
    };

    preloadFrames();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading || loadError || frames.length !== TOTAL_FRAMES) {
      return;
    }

    const scroller = scrollRef.current;
    if (!scroller) {
      return;
    }

    if (lastFramesRef.current.length !== extendedSlots.length) {
      lastFramesRef.current = Array(extendedSlots.length).fill(-1);
    }

    const lastRenderedFrames = lastFramesRef.current;

    const getBlockSpan = () => {
      const firstInBlockA = cardRefs.current[0];
      const firstInBlockB = cardRefs.current[SLOT_COUNT];
      if (!firstInBlockA || !firstInBlockB) return 0;
      return firstInBlockB.offsetLeft - firstInBlockA.offsetLeft;
    };

    const recenterIfNeeded = () => {
      if (isRecenteringRef.current) return;

      const blockSpan = getBlockSpan();
      if (!blockSpan) return;

      const centerBlockStart = blockSpan * MIDDLE_BLOCK_INDEX;
      const minThreshold = centerBlockStart - blockSpan * 0.45;
      const maxThreshold = centerBlockStart + blockSpan * 0.45;
      const current = scroller.scrollLeft;

      if (current < minThreshold || current > maxThreshold) {
        const offsetFromCenterBlock = current - centerBlockStart;
        const normalizedOffset = ((offsetFromCenterBlock % blockSpan) + blockSpan) % blockSpan;
        const newScrollLeft = centerBlockStart + normalizedOffset;

        isRecenteringRef.current = true;
        scroller.scrollLeft = newScrollLeft;
        isRecenteringRef.current = false;
      }
    };

    const drawFrame = (canvas, context, image) => {
      if (!canvas || !context || !image) return;

      const width = canvas.width;
      const height = canvas.height;
      const imageAspect = image.width / image.height;
      const canvasAspect = width / height;

      let renderWidth;
      let renderHeight;
      const scaleFactor = 1.2;

      if (imageAspect > canvasAspect) {
        renderWidth = width;
        renderHeight = width / imageAspect;
      } else {
        renderHeight = height;
        renderWidth = height * imageAspect;
      }

      renderWidth *= scaleFactor;
      renderHeight *= scaleFactor;

      const x = (width - renderWidth) / 2;
      const y = (height - renderHeight) / 2;

      context.clearRect(0, 0, width, height);
      context.drawImage(image, x, y, renderWidth, renderHeight);
    };

    const setCardVisualState = (idx, focus) => {
      const card = cardRefs.current[idx];
      const textNode = textRefs.current[idx];
      if (!card || !textNode) return;

      const scale = 0.92 + focus * 0.08;
      const cardOpacity = 0.52 + focus * 0.48;
      const textOpacity = 0.2 + focus * 0.8;

      gsap.set(card, {
        scale,
        autoAlpha: cardOpacity,
        transformOrigin: 'center center',
      });

      gsap.set(textNode, {
        autoAlpha: textOpacity,
        y: (1 - focus) * 20,
      });
    };

    const updateFromScroll = () => {
      const viewportCenter = window.innerWidth / 2;

      recenterIfNeeded();

      for (let i = 0; i < extendedSlots.length; i += 1) {
        const card = cardRefs.current[i];
        const canvas = canvasRefs.current[i];
        const ctx = canvas?.getContext('2d');
        if (!card || !canvas || !ctx) continue;

        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;

        const distance = Math.abs(viewportCenter - centerX);
        const focus = 1 - clamp(distance / (window.innerWidth * 0.82), 0, 1);
        setCardVisualState(i, focus);

        const renderBuffer = window.innerWidth * 0.45;
        const isVisibleForRender = rect.right > -renderBuffer && rect.left < window.innerWidth + renderBuffer;
        if (!isVisibleForRender) {
          continue;
        }

        // frameProgress = 0 when card enters from right, 1 when it exits left.
        const frameProgress = clamp(
          (window.innerWidth + rect.width / 2 - centerX) / (window.innerWidth + rect.width),
          0,
          1
        );

        let displayedFrame;
        if (frameProgress <= 0.5) {
          displayedFrame = 1 + (frameProgress / 0.5) * 9;
        } else {
          displayedFrame = 10 + ((frameProgress - 0.5) / 0.5) * 6;
        }

        const frameIndex = clamp(Math.round(displayedFrame) - 1, 0, TOTAL_FRAMES - 1);
        if (frameIndex === lastRenderedFrames[i]) continue;

        drawFrame(canvas, ctx, frames[frameIndex]);
        lastRenderedFrames[i] = frameIndex;
      }
    };

    const requestUpdate = () => {
      if (rafIdRef.current) return;
      rafIdRef.current = window.requestAnimationFrame(() => {
        rafIdRef.current = 0;
        updateFromScroll();
      });
    };

    const resizeCanvases = () => {
      const dpr = window.devicePixelRatio || 1;

      canvasRefs.current.forEach((canvas, idx) => {
        if (!canvas) return;

        const bounds = canvas.getBoundingClientRect();
        canvas.width = Math.max(1, Math.floor(bounds.width * dpr));
        canvas.height = Math.max(1, Math.floor(bounds.height * dpr));

        const context = canvas.getContext('2d');
        if (!context) return;

        const initialFrame = lastRenderedFrames[idx] >= 0 ? lastRenderedFrames[idx] : 0;
        drawFrame(canvas, context, frames[initialFrame]);
      });
    };

    const centerOnMiddleBlock = () => {
      const blockSpan = getBlockSpan();
      if (!blockSpan) return;
      scroller.scrollLeft = blockSpan * MIDDLE_BLOCK_INDEX;
      isCenteredOnMountRef.current = true;
    };

    const onPointerDown = (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      dragStateRef.current.isPointerDown = true;
      dragStateRef.current.startX = event.clientX;
      dragStateRef.current.startScrollLeft = scroller.scrollLeft;

      scroller.setPointerCapture(event.pointerId);
      scroller.style.cursor = 'grabbing';
      scroller.style.userSelect = 'none';
    };

    const onPointerMove = (event) => {
      if (!dragStateRef.current.isPointerDown) return;

      const deltaX = event.clientX - dragStateRef.current.startX;
      scroller.scrollLeft = dragStateRef.current.startScrollLeft - deltaX;
      requestUpdate();
    };

    const onPointerUp = (event) => {
      if (!dragStateRef.current.isPointerDown) return;

      dragStateRef.current.isPointerDown = false;
      scroller.style.cursor = 'grab';
      scroller.style.userSelect = '';

      if (scroller.hasPointerCapture(event.pointerId)) {
        scroller.releasePointerCapture(event.pointerId);
      }

    };

    const onWheel = (event) => {
      const isMostlyVertical = Math.abs(event.deltaY) > Math.abs(event.deltaX);
      if (!isMostlyVertical) return;

      scroller.scrollLeft += event.deltaY;
      requestUpdate();
    };

    const onResize = () => {
      resizeCanvases();
      requestUpdate();
    };

    resizeCanvases();

    if (!isCenteredOnMountRef.current) {
      centerOnMiddleBlock();
    }

    requestUpdate();

    scroller.style.cursor = 'grab';
    scroller.addEventListener('scroll', requestUpdate);
    scroller.addEventListener('wheel', onWheel, { passive: true });
    scroller.addEventListener('pointerdown', onPointerDown);
    scroller.addEventListener('pointermove', onPointerMove);
    scroller.addEventListener('pointerup', onPointerUp);
    scroller.addEventListener('pointercancel', onPointerUp);

    window.addEventListener('resize', onResize);

    return () => {
      if (rafIdRef.current) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }

      scroller.removeEventListener('scroll', requestUpdate);
      scroller.removeEventListener('wheel', onWheel);
      scroller.removeEventListener('pointerdown', onPointerDown);
      scroller.removeEventListener('pointermove', onPointerMove);
      scroller.removeEventListener('pointerup', onPointerUp);
      scroller.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('resize', onResize);
    };
  }, [frames, loading, loadError]);

  if (loading) {
    return (
      <section className="h-screen w-full flex items-center justify-center bg-[#07080a] text-white text-lg md:text-xl font-light tracking-[0.2em] uppercase">
        Cargando secuencia Mercedes...
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="h-screen w-full flex items-center justify-center bg-[#07080a] text-white px-6 text-center">
        <p className="max-w-lg text-zinc-300">{loadError}</p>
      </section>
    );
  }

  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#07080a]">
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'url(/images/fondo-scroll.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          opacity: 1,
        }}
      />

      <div
        ref={scrollRef}
        className="relative h-full w-full overflow-x-auto overflow-y-hidden touch-pan-x z-10"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex h-full items-center gap-[2.8vw] px-[7vw] py-3 md:gap-[1.1vw] md:px-[12vw]">
          {extendedSlots.map((slot, idx) => (
            <article
              key={`${slot.id}-${slot.visualIndex}`}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              className="relative h-[94vh] w-[76vw] shrink-0 md:w-[52vw]"
            >
              <div
                ref={(el) => {
                  textRefs.current[idx] = el;
                }}
                className="pointer-events-none absolute left-6 top-8 z-20 md:left-16 md:top-12 max-w-xs md:max-w-sm"
              >
                <p className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-[#080C0F] font-semibold">Mercedes-Benz</p>
                <h2 className="mt-3 text-4xl md:text-7xl font-light tracking-tight text-[#080C0F] leading-none">{slot.title.split(' ').pop()}</h2>
               <div className="mt-6 py-2 px-4 bg-white w-fit rounded-full">
                <p className=" text-[9px] md:text-xs uppercase tracking-[0.3em] text-[#080C0F]">Ver más</p>
                 </div>
              </div>

              <div className="pointer-events-none absolute bottom-10 left-4 right-4 z-20 md:bottom-16 md:left-12 md:right-12">
                {/* <p className="text-xs md:text-sm leading-relaxed text-zinc-300 max-w-2xl">{slot.description}</p> */}
              </div>

              <div className="relative flex h-full items-center justify-center">
                <canvas
                  ref={(el) => {
                    canvasRefs.current[idx] = el;
                  }}
                  className="h-[78vh] w-full select-none"
                />
              </div>

              <div className="pointer-events-none absolute bottom-7 left-3 z-20 text-[10px] uppercase tracking-[0.25em] text-zinc-600 md:left-10 md:text-xs">
                {slot.id} / 03 - Drag or scroll horizontally
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GLAHorizontalCarousel;
