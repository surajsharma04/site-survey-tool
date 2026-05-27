import { useEffect } from 'react';
import gsap from 'gsap';

const MAGNETIC_SELECTOR = [
  '.primary-action',
  '.secondary-action',
  '.signout-action',
  '.profile-trigger',
  '.auth-submit',
  '.role-card',
].join(', ');

const TILT_SELECTOR = [
  '.metric-card',
  '.dashboard-hero',
  '.auth-chip',
  '.auth-card',
  '.role-card',
].join(', ');

const isTouchEnvironment = () =>
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || window.navigator.maxTouchPoints > 0);

export const useInteractiveEffects = (scopeRef) => {
  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope || typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches || isTouchEnvironment()) {
      return undefined;
    }

    const cleanups = [];

    scope.querySelectorAll(MAGNETIC_SELECTOR).forEach((element) => {
      const handleMove = (event) => {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;

        gsap.to(element, {
          x: x * 0.12,
          y: y * 0.12,
          duration: 0.22,
          ease: 'power3.out',
          overwrite: true,
        });
      };

      const handleLeave = () => {
        gsap.to(element, {
          x: 0,
          y: 0,
          duration: 0.35,
          ease: 'elastic.out(1, 0.45)',
          overwrite: true,
        });
      };

      element.addEventListener('pointermove', handleMove);
      element.addEventListener('pointerleave', handleLeave);

      cleanups.push(() => {
        element.removeEventListener('pointermove', handleMove);
        element.removeEventListener('pointerleave', handleLeave);
        gsap.set(element, { clearProps: 'x,y' });
      });
    });

    scope.querySelectorAll(TILT_SELECTOR).forEach((element) => {
      const handleMove = (event) => {
        const rect = element.getBoundingClientRect();
        const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
        const offsetY = (event.clientY - rect.top) / rect.height - 0.5;

        gsap.to(element, {
          rotateY: offsetX * 8,
          rotateX: offsetY * -8,
          transformPerspective: 1200,
          transformOrigin: 'center',
          duration: 0.26,
          ease: 'power2.out',
          overwrite: true,
        });
      };

      const handleLeave = () => {
        gsap.to(element, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.45,
          ease: 'power3.out',
          overwrite: true,
        });
      };

      element.addEventListener('pointermove', handleMove);
      element.addEventListener('pointerleave', handleLeave);

      cleanups.push(() => {
        element.removeEventListener('pointermove', handleMove);
        element.removeEventListener('pointerleave', handleLeave);
        gsap.set(element, { clearProps: 'rotateX,rotateY,transformPerspective,transformOrigin' });
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [scopeRef]);
};
