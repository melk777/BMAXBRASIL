document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       1. SPLINE SCROLL INTERACTIVITY
    ============================================= */
    // Adiciona uma rotação suave (parallax rotation) ao container baseada no scroll.
    // Isso emula interatividade sem precisar injetar eventos complexos dentro do frame 3D.
    const splineContainer = document.getElementById('spline-hero-container');
    
    window.addEventListener('scroll', () => {
        if (!splineContainer) return;
        const scrollY = window.scrollY;
        
        // Em um projeto real, se acessar a API do spline: splineViewer.application...
        // Aqui usamos CSS dinâmico no wrapper para uma experiência de profundidade suave e imersiva.
        if (scrollY < window.innerHeight && window.innerWidth > 768) {
            // Passive vertical parallax only for desktop
            // No -50% offsets because it's already positioned by Grid
            const yPos = scrollY * 0.25;
            const rotationX = scrollY * -0.01;
            const scale = 1 + (scrollY * 0.0001);
            
            splineContainer.style.transform = `translate3d(0, ${yPos}px, 0) rotateX(${rotationX}deg) scale(${scale})`;
        } else if (window.innerWidth <= 768) {
            // Ensure no transform conflict on mobile
            splineContainer.style.transform = 'none';
        }
    });

    /* ==========================================
       2. HYPE DE ESTOQUE (DECREASING COUNTER)
    ============================================= */
    const countElements = document.querySelectorAll('.stock-count');
    
    // Simular que o estoque de 150 já baixou um pouco com as vendas reais e vai caindo.
    // Inicializa em 93 (exemplo psíquico de escassez forte)
    let currentStock = localStorage.getItem('iphone17_stock') 
                        ? parseInt(localStorage.getItem('iphone17_stock')) 
                        : 87;

    function updateStockVisuals(amount) {
        countElements.forEach(el => {
            el.textContent = amount;
            // Efeito visual rápido quando muda
            el.style.color = '#fff';
            el.style.fontWeight = 'bold';
            setTimeout(() => {
                el.style.color = '';
                el.style.fontWeight = '';
            }, 500);
        });
        localStorage.setItem('iphone17_stock', amount);
    }

    // Aplica o valor inicial rápido
    updateStockVisuals(currentStock);

    // Diminui proceduralmente para criar FOMO
    setInterval(() => {
        if (currentStock > 12 && Math.random() > 0.7) { // tem uma chance de não cair para não ser tão óbvio
            currentStock -= 1;
            updateStockVisuals(currentStock);
        }
    }, 15000); // Tenta atualizar a cada 15s

    /* ==========================================
       3. WHATSAPP MASK (IMask)
    ============================================= */
    const phoneInput = document.getElementById('whatsapp');
    if (phoneInput && window.IMask) {
        IMask(phoneInput, {
            mask: '(00) 00000-0000'
        });
    }

    /* ==========================================
       4. FORM SUBMISSION
    ============================================= */
    const form = document.getElementById('vip-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Reservando Vaga...';
            submitBtn.disabled = true;

            setTimeout(() => {
                form.reset();
                submitBtn.textContent = 'Você está na lista VIP!';
                
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }, 4000);
            }, 1000);
        });
    }

    /* ==========================================
       5. NAVBAR SCROLL EFFECT
    ============================================= */
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(0, 0, 0, 0.85)';
            navbar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
        } else {
            navbar.style.background = 'rgba(0, 0, 0, 0.6)';
            navbar.style.borderBottom = 'transparent';
        }
    });

    /* ==========================================
       6. ACCORDION (FAQ)
    ============================================= */
    const accordionItems = document.querySelectorAll('.accordion-item');
    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        header.addEventListener('click', () => {
            accordionItems.forEach(o => { if(o !== item) o.classList.remove('active'); });
            item.classList.toggle('active');
        });
    });

    /* ==========================================
       8. SCROLL FADE-IN OBSERVER
    ============================================= */
    const fadeObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { root: null, rootMargin: '0px', threshold: 0.05 });

    document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

    // Mobile fallback: force all fade-in elements visible after 600ms
    // Prevents products/sections from staying hidden if IntersectionObserver fails
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            document.querySelectorAll('.fade-in').forEach(el => {
                el.classList.add('visible');
            });
        }, 600);
    }

    /* ==========================================
       9. WIDGET DE PROVA SOCIAL (SCARCITY TOAST)
    ============================================= */
    const toast = document.getElementById('sales-toast');
    const toastMessage = document.getElementById('toast-message');
    
    const toastTexts = [
        'Sofia de São Paulo acaba de garantir seu iPhone 17 Pro.',
        'Matheus reservou um iPhone 17 Pro Max no Lote Exclusivo.',
        'Carla confirmou a aquisição de um iPhone 17.',
        'Pedro R. solicitou reserva de um iPhone 17 Pro.',
        'Ana Luiza garantiu uma unidade de iPhone 17 Pro Max.',
        'Roberto acaba de entrar no Grupo VIP e garantiu seu iPhone 17.'
    ];

    function showToast() {
        if (!toast) return;
        
        const randomText = toastTexts[Math.floor(Math.random() * toastTexts.length)];
        toastMessage.textContent = randomText;
        
        toast.classList.add('show');

        // Hide after 6 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            scheduleNextToast();
        }, 6000);
    }

    function scheduleNextToast() {
        // Random interval between 20s (20000ms) and 45s (45000ms)
        const minDelay = 20000;
        const maxDelay = 45000;
        const nextDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        setTimeout(showToast, nextDelay);
    }

    // Initial appearance after 5-10s
    setTimeout(showToast, Math.floor(Math.random() * 5000) + 5000);

    /* ==========================================
       10. MOBILE MENU TOGGLE
    ============================================= */
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.replace('ph-list', 'ph-x');
            } else {
                icon.classList.replace('ph-x', 'ph-list');
            }
        });

        // Close menu on link click
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileToggle.querySelector('i').classList.replace('ph-x', 'ph-list');
            });
        });
    }

    /* ==========================================
       11. PRODUCT SEARCH FILTER
    ============================================= */
    const searchInput = document.getElementById('navbar-search');
    const products = document.querySelectorAll('.product-card');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            
            products.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                if (title.includes(term)) {
                    card.classList.remove('hidden-search');
                } else {
                    card.classList.add('hidden-search');
                }
            });

            // Smooth scroll to products if user is searching and not there
            if (term.length > 2 && window.scrollY < 500) {
                document.getElementById('produtos').scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

});

// ============================================
// WIDGET COLOR SWATCHES (VARIAÇÕES DE COR)
// ============================================
window.changeProductColor = function(imgId, swatchElement) {
    const imgElement = document.getElementById(imgId);
    if (imgElement) {
        // Change the source of the image to the new color image
        imgElement.src = swatchElement.getAttribute('data-img');
        
        // Find parent container to manage active states
        const colorVariantsContainer = swatchElement.parentElement;
        const siblings = colorVariantsContainer.querySelectorAll('.color-swatch');
        
        // Remove active class from all swatches
        siblings.forEach(swatch => swatch.classList.remove('active'));
        
        // Add active class to the clicked swatch
        swatchElement.classList.add('active');
    }
}
