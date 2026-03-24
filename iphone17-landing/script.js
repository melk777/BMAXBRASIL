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
       4. FORM SUBMISSION → Google Sheets (Apps Script)
    ============================================= */
    const form = document.getElementById('vip-form');
    const formMessage = document.getElementById('form-message');

    function showFormMessage(text, isError) {
        if (!formMessage) return;
        formMessage.textContent = text;
        formMessage.classList.remove('hidden');
        formMessage.classList.toggle('message--error', !!isError);
        formMessage.classList.toggle('message--ok', !isError);
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name')?.value.trim() || '';
            const email = document.getElementById('email')?.value.trim() || '';
            const whatsapp = document.getElementById('whatsapp')?.value.trim() || '';
            const submitBtn = form.querySelector('.submit-btn');
            const originalText = submitBtn ? submitBtn.textContent : '';
            const webhook = window.BMAX_CONFIG && window.BMAX_CONFIG.sheetsWebhookUrl;

            if (!webhook || String(webhook).includes('SUBSTITUA')) {
                showFormMessage('Cole a URL do Web App do Google Apps Script em BMAX_CONFIG (index.html), depois implante o script na planilha.', true);
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Enviando...';
            }

            const payload = JSON.stringify({
                name,
                email,
                whatsapp,
                source: 'bmax-landing-vip'
            });

            const postPlain = () =>
                fetch(webhook, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                    body: payload
                });

            try {
                let res = await postPlain();
                let data = {};
                try {
                    data = await res.json();
                } catch (_) {
                    /* resposta vazia ou não-JSON — comum em alguns proxies */
                }

                if (data.duplicate) {
                    showFormMessage(data.message || 'Este e-mail já está na lista VIP.', false);
                    if (submitBtn) {
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                    }
                    return;
                }

                if (!res.ok || data.ok === false) {
                    throw new Error(data.error || data.message || `Erro ${res.status}`);
                }

                form.reset();
                showFormMessage('Cadastro recebido. Verifique seu e-mail e WhatsApp em breve.', false);
                if (submitBtn) {
                    submitBtn.textContent = 'Você está na lista VIP!';
                    setTimeout(() => {
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                    }, 4000);
                }
            } catch (err) {
                console.error(err);
                showFormMessage('Não foi possível enviar agora. Tente de novo em instantes ou verifique a URL do Apps Script.', true);
                if (submitBtn) {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            }
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

    /* Fallback global: garante Hero além do fold + seções visíveis se o observer falhar */
    setTimeout(() => {
        document.querySelectorAll('.fade-in:not(.visible)').forEach(el => el.classList.add('visible'));
    }, 1800);

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

        toast.classList.remove('hide-out');
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide-out');
            setTimeout(() => {
                toast.classList.remove('hide-out');
                scheduleNextToast();
            }, 520);
        }, 6200);
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
       11. PRODUCT SEARCH (navbar)
    ============================================= */
    const searchInput = document.getElementById('navbar-search');
    const produtosSection = document.getElementById('produtos');

    function cardSearchBlob(card) {
        const extra = (card.getAttribute('data-search') || '').toLowerCase();
        const h3 = card.querySelector('h3');
        const title = h3 ? h3.textContent.toLowerCase() : '';
        return `${extra} ${title}`;
    }

    function cardMatches(term, blob) {
        if (!term) return true;
        const words = term.toLowerCase().split(/\s+/).filter(Boolean);
        return words.every((w) => blob.includes(w));
    }

    function applyProductFilter(rawTerm) {
        const term = rawTerm.trim();
        const cards = document.querySelectorAll('.product-card');
        cards.forEach((card) => {
            const blob = cardSearchBlob(card);
            if (cardMatches(term, blob)) {
                card.classList.remove('product-card--filtered-out', 'hidden-search');
            } else {
                card.classList.add('product-card--filtered-out');
                card.classList.remove('hidden-search');
            }
        });
    }

    let searchScrollDone = false;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value;
            applyProductFilter(term);
            if (term.trim().length >= 2 && !searchScrollDone) {
                searchScrollDone = true;
                produtosSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            if (!term.trim()) searchScrollDone = false;
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyProductFilter(searchInput.value);
                produtosSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    /* ==========================================
       12. CHECKOUT MERCADO PAGO (preferência → redirect)
    ============================================= */
    function resolveCheckoutApiUrl(cfg) {
        const fallback = '/api/checkout';
        const pathRaw =
            (typeof cfg.checkoutApiPath === 'string' && cfg.checkoutApiPath.trim()) || '';
        const path = pathRaw ? (pathRaw.startsWith('/') ? pathRaw : `/${pathRaw}`) : '';

        const absRaw =
            typeof cfg.checkoutApiUrl === 'string' && cfg.checkoutApiUrl.trim()
                ? cfg.checkoutApiUrl.trim()
                : '';
        if (!path && !absRaw) return fallback;

        const hostNoWww = (h) => String(h || '').replace(/^www\./i, '');
        const pageHost = window.location.hostname;

        if (absRaw) {
            try {
                const u = new URL(absRaw);
                if (u.origin === window.location.origin) {
                    return u.pathname + u.search;
                }
                if (hostNoWww(u.hostname) === hostNoWww(pageHost)) {
                    /* evita cross-origin www ⇄ apex (preflight OPTIONS no apex devolve 307 sem CORS) */
                    return u.pathname + u.search || fallback;
                }
                return absRaw;
            } catch (_) {
                return absRaw;
            }
        }
        return path || fallback;
    }

    async function redirectToMercadoPagoCheckout(button) {
        const nomeBase = button.getAttribute('data-produto');
        const preco = button.getAttribute('data-valor');
        const idCor = button.getAttribute('data-cor-id');
        const seletor = idCor ? document.getElementById(idCor) : null;
        const cor = seletor ? seletor.value.trim() : '';
        const produto = `${nomeBase} — Cor: ${cor}`;

        const cfg = window.BMAX_CONFIG || {};
        const apiUrl = resolveCheckoutApiUrl(cfg);
        const label = button.textContent;
        button.setAttribute('aria-busy', 'true');
        button.style.pointerEvents = 'none';
        button.textContent = 'Abrindo checkout...';

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    produto,
                    valor: Number(String(preco).replace(',', '.'))
                })
            });

            const rawText = await response.text();
            let data = {};
            if (rawText && rawText.trim().startsWith('<')) {
                alert(
                    'A rota /api/checkout não está disponível neste endereço (o servidor devolveu HTML em vez da API). Publique o projeto na Vercel/Netlify com a pasta api/ e defina MP_ACCESS_TOKEN, ou defina checkoutApiUrl em BMAX_CONFIG com a URL completa da sua API.'
                );
                return;
            }
            try {
                data = rawText ? JSON.parse(rawText) : {};
            } catch (_) {
                data = {};
            }

            if (data.id) {
                window.location.href = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${encodeURIComponent(data.id)}`;
                return;
            }

            const detail = [data.message, data.details, data.error]
                .filter(Boolean)
                .join('\n\n') || `Resposta sem preferência (HTTP ${response.status}).`;

            alert(detail);
        } catch (err) {
            console.error(err);
            alert(
                'Não foi possível conectar à API de checkout. Confira rede, CORS e se a função /api/checkout está implantada. No Mercado Pago, use o Access Token (credenciais de produção ou teste), não a Public Key, na variável MP_ACCESS_TOKEN.'
            );
        } finally {
            button.textContent = label;
            button.style.pointerEvents = '';
            button.removeAttribute('aria-busy');
        }
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-reserva-venda');
        if (!btn) return;
        e.preventDefault();
        redirectToMercadoPagoCheckout(btn);
    });
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
