import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useEffect } from 'react';

function ScrollAnimations() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-in-view');
        } else {
          entry.target.classList.remove('scroll-in-view');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    const observeElements = () => {
      // Target specific elements in the Landing page (e.g. sections, cards, feature blocks)
      // but avoid animating small dashboard UI elements unnecessarily.
      const selectors = [
        'section h2', 
        'section p', 
        'section .grid > div', 
        '.bg-white\\/60.backdrop-blur-xl',
        '.bg-white\\/40.backdrop-blur-xl'
      ];
      
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          // Exclude the Nav bar
          if (!el.closest('header') && !el.closest('.fixed')) {
            el.classList.add('scroll-animate');
            observer.observe(el);
          }
        });
      });
    };

    observeElements();
    
    // Re-run observer if DOM changes (React routing)
    const mo = new MutationObserver(() => observeElements());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}

function App() {
  return (
    <>
      <ScrollAnimations />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
