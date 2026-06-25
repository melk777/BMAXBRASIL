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
       12. CHECKOUT MERCADO PAGO (cadastro → preferência → redirect)
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

    function onlyDigits(value) {
        return String(value || '').replace(/\D/g, '');
    }

    function formatCpf(value) {
        const digits = onlyDigits(value).slice(0, 11);
        return digits
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }

    function formatCep(value) {
        return onlyDigits(value).slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
    }

    function formatPhone(value) {
        const digits = onlyDigits(value).slice(0, 11);
        if (digits.length <= 10) {
            return digits
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{4})(\d)/, '$1-$2');
        }
        return digits
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2');
    }

    function ensureCheckoutRegistrationModal() {
        let modal = document.getElementById('checkout-registration-modal');
        if (modal) return modal;

        const style = document.createElement('style');
        style.textContent = `
            .checkout-registration-modal { position: fixed; inset: 0; z-index: 3000; display: none; align-items: center; justify-content: center; padding: 1rem; background: rgba(0, 0, 0, 0.76); backdrop-filter: blur(14px); }
            .checkout-registration-modal.is-open { display: flex; }
            .checkout-registration-panel { width: min(760px, 100%); max-height: min(92vh, 860px); overflow-y: auto; border: 1px solid rgba(255,255,255,0.12); border-radius: 22px; background: #0b0b0d; color: #f5f5f7; box-shadow: 0 30px 90px rgba(0,0,0,0.55); }
            .checkout-registration-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; padding: 1.35rem 1.35rem 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
            .checkout-registration-header h2 { margin: 0; font-size: clamp(1.25rem, 4vw, 1.75rem); letter-spacing: 0; }
            .checkout-registration-header p { margin: 0.35rem 0 0; color: #a1a1a6; font-size: 0.95rem; line-height: 1.45; }
            .checkout-registration-close { width: 2.5rem; height: 2.5rem; border-radius: 999px; border: 1px solid rgba(255,255,255,0.16); background: transparent; color: #fff; cursor: pointer; font-size: 1.45rem; line-height: 1; }
            .checkout-registration-form { padding: 1.35rem; }
            .checkout-registration-summary { display: grid; gap: 0.15rem; margin-bottom: 1rem; padding: 0.85rem 1rem; border-radius: 14px; background: rgba(198,168,124,0.09); border: 1px solid rgba(198,168,124,0.22); color: #e8d7bd; font-size: 0.92rem; }
            .checkout-registration-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.85rem; }
            .checkout-registration-field { display: grid; gap: 0.35rem; }
            .checkout-registration-field--full { grid-column: 1 / -1; }
            .checkout-registration-field label { color: #d7d7dc; font-size: 0.78rem; font-weight: 700; letter-spacing: 0; }
            .checkout-registration-field input { width: 100%; min-height: 3rem; border: 1px solid rgba(255,255,255,0.16); border-radius: 12px; background: #050506; color: #fff; padding: 0.85rem 0.95rem; font-size: 0.98rem; outline: none; }
            .checkout-registration-field input:focus { border-color: #c6a87c; box-shadow: 0 0 0 3px rgba(198,168,124,0.18); }
            .checkout-registration-message { min-height: 1.25rem; margin-top: 0.85rem; color: #fca5a5; font-size: 0.9rem; }
            .checkout-registration-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; }
            .checkout-registration-secondary, .checkout-registration-primary { min-height: 3rem; border-radius: 999px; padding: 0.8rem 1.2rem; font-weight: 800; cursor: pointer; }
            .checkout-registration-secondary { border: 1px solid rgba(255,255,255,0.16); background: transparent; color: #fff; }
            .checkout-registration-primary { border: 0; background: #f5f5f7; color: #000; }
            @media (max-width: 680px) { .checkout-registration-grid { grid-template-columns: 1fr; } .checkout-registration-panel { border-radius: 16px; } .checkout-registration-actions button { width: 100%; } }
        `;
        document.head.appendChild(style);

        modal = document.createElement('div');
        modal.id = 'checkout-registration-modal';
        modal.className = 'checkout-registration-modal';
        modal.innerHTML = `
            <div class="checkout-registration-panel" role="dialog" aria-modal="true" aria-labelledby="checkout-registration-title">
                <div class="checkout-registration-header">
                    <div>
                        <h2 id="checkout-registration-title">Cadastro para compra</h2>
                        <p>Preencha seus dados para emissão, entrega e liberação do pagamento seguro.</p>
                    </div>
                    <button type="button" class="checkout-registration-close" data-close-checkout-registration aria-label="Fechar">×</button>
                </div>
                <form id="checkout-registration-form" class="checkout-registration-form" novalidate>
                    <div class="checkout-registration-summary">
                        <strong id="checkout-registration-product">Produto selecionado</strong>
                        <span id="checkout-registration-price">Valor da reserva</span>
                    </div>
                    <div class="checkout-registration-grid">
                        <div class="checkout-registration-field checkout-registration-field--full">
                            <label for="checkout-full-name">Nome completo</label>
                            <input id="checkout-full-name" name="nomeCompleto" autocomplete="name" required>
                        </div>
                        <div class="checkout-registration-field">
                            <label for="checkout-cpf">CPF</label>
                            <input id="checkout-cpf" name="cpf" inputmode="numeric" autocomplete="off" required>
                        </div>
                        <div class="checkout-registration-field">
                            <label for="checkout-email">E-mail</label>
                            <input id="checkout-email" name="email" type="email" autocomplete="email" required>
                        </div>
                        <div class="checkout-registration-field">
                            <label for="checkout-phone">Telefone</label>
                            <input id="checkout-phone" name="telefone" inputmode="tel" autocomplete="tel" required>
                        </div>
                        <div class="checkout-registration-field">
                            <label for="checkout-cep">CEP</label>
                            <input id="checkout-cep" name="cep" inputmode="numeric" autocomplete="postal-code" required>
                        </div>
                        <div class="checkout-registration-field checkout-registration-field--full">
                            <label for="checkout-address">Endereço</label>
                            <input id="checkout-address" name="endereco" autocomplete="street-address" placeholder="Rua, avenida, condomínio" required>
                        </div>
                        <div class="checkout-registration-field">
                            <label for="checkout-number">Número</label>
                            <input id="checkout-number" name="numero" autocomplete="address-line2" required>
                        </div>
                        <div class="checkout-registration-field">
                            <label for="checkout-complement">Complemento</label>
                            <input id="checkout-complement" name="complemento" autocomplete="address-line3" placeholder="Apto, bloco, casa">
                        </div>
                        <div class="checkout-registration-field">
                            <label for="checkout-neighborhood">Bairro</label>
                            <input id="checkout-neighborhood" name="bairro" required>
                        </div>
                        <div class="checkout-registration-field">
                            <label for="checkout-city">Cidade</label>
                            <input id="checkout-city" name="cidade" autocomplete="address-level2" required>
                        </div>
                        <div class="checkout-registration-field">
                            <label for="checkout-state">Estado</label>
                            <input id="checkout-state" name="estado" maxlength="2" autocomplete="address-level1" placeholder="SP" required>
                        </div>
                        <div class="checkout-registration-field checkout-registration-field--full">
                            <label for="checkout-reference">Ponto de referência</label>
                            <input id="checkout-reference" name="pontoReferencia" placeholder="Ex.: portaria azul, perto do mercado, casa de esquina" required>
                        </div>
                    </div>
                    <p id="checkout-registration-message" class="checkout-registration-message" aria-live="polite"></p>
                    <div class="checkout-registration-actions">
                        <button type="button" class="checkout-registration-secondary" data-close-checkout-registration>Cancelar</button>
                        <button type="submit" class="checkout-registration-primary">Continuar para pagamento</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        const cpfInput = modal.querySelector('#checkout-cpf');
        const phoneCheckoutInput = modal.querySelector('#checkout-phone');
        const cepInput = modal.querySelector('#checkout-cep');
        const stateInput = modal.querySelector('#checkout-state');

        cpfInput.addEventListener('input', () => { cpfInput.value = formatCpf(cpfInput.value); });
        phoneCheckoutInput.addEventListener('input', () => { phoneCheckoutInput.value = formatPhone(phoneCheckoutInput.value); });
        cepInput.addEventListener('input', () => { cepInput.value = formatCep(cepInput.value); });
        stateInput.addEventListener('input', () => { stateInput.value = stateInput.value.replace(/[^a-z]/gi, '').toUpperCase().slice(0, 2); });

        modal.addEventListener('click', (event) => {
            if (event.target === modal || event.target.closest('[data-close-checkout-registration]')) {
                modal.classList.remove('is-open');
                modal.dataset.checkoutButtonId = '';
            }
        });

        modal.querySelector('#checkout-registration-form').addEventListener('submit', (event) => {
            event.preventDefault();
            const buttonId = modal.dataset.checkoutButtonId;
            const button = buttonId ? document.querySelector(`[data-checkout-button-id="${buttonId}"]`) : null;
            if (!button) return;

            const customer = collectCheckoutCustomer(modal);
            const error = validateCheckoutCustomer(customer);
            const message = modal.querySelector('#checkout-registration-message');
            if (error) {
                message.textContent = error;
                return;
            }

            message.textContent = '';
            modal.classList.remove('is-open');
            redirectToMercadoPagoCheckout(button, customer);
        });

        return modal;
    }

    function collectCheckoutCustomer(modal) {
        return {
            nomeCompleto: modal.querySelector('#checkout-full-name')?.value.trim() || '',
            cpf: onlyDigits(modal.querySelector('#checkout-cpf')?.value),
            email: modal.querySelector('#checkout-email')?.value.trim() || '',
            telefone: onlyDigits(modal.querySelector('#checkout-phone')?.value),
            cep: onlyDigits(modal.querySelector('#checkout-cep')?.value),
            endereco: modal.querySelector('#checkout-address')?.value.trim() || '',
            numero: modal.querySelector('#checkout-number')?.value.trim() || '',
            complemento: modal.querySelector('#checkout-complement')?.value.trim() || '',
            bairro: modal.querySelector('#checkout-neighborhood')?.value.trim() || '',
            cidade: modal.querySelector('#checkout-city')?.value.trim() || '',
            estado: modal.querySelector('#checkout-state')?.value.trim().toUpperCase() || '',
            pontoReferencia: modal.querySelector('#checkout-reference')?.value.trim() || ''
        };
    }

    function validateCheckoutCustomer(customer) {
        if (customer.nomeCompleto.split(' ').filter(Boolean).length < 2) return 'Informe o nome completo.';
        if (!/^\d{11}$/.test(customer.cpf)) return 'Informe um CPF com 11 dígitos.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) return 'Informe um e-mail válido.';
        if (!/^\d{10,11}$/.test(customer.telefone)) return 'Informe um telefone com DDD.';
        if (!/^\d{8}$/.test(customer.cep)) return 'Informe um CEP com 8 dígitos.';
        if (!customer.endereco) return 'Informe o endereço completo.';
        if (!customer.numero) return 'Informe o número do endereço.';
        if (!customer.bairro) return 'Informe o bairro.';
        if (!customer.cidade) return 'Informe a cidade.';
        if (!/^[A-Z]{2}$/.test(customer.estado)) return 'Informe a sigla do estado com 2 letras.';
        if (!customer.pontoReferencia) return 'Informe um ponto de referência para entrega.';
        return '';
    }

    function selectedCheckoutProduct(button) {
        const nomeBase = button.getAttribute('data-produto');
        const preco = button.getAttribute('data-valor');
        const productId = button.getAttribute('data-product-id');
        const idCor = button.getAttribute('data-cor-id');
        const seletor = idCor ? document.getElementById(idCor) : null;
        const cor = seletor ? seletor.value.trim() : '';
        return {
            produto: `${nomeBase} — Cor: ${cor}`,
            preco,
            productId,
            cor
        };
    }

    function openCheckoutRegistration(button) {
        if (!button.dataset.checkoutButtonId) {
            button.dataset.checkoutButtonId = `checkout-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        }

        const modal = ensureCheckoutRegistrationModal();
        const { produto, preco, productId, cor } = selectedCheckoutProduct(button);
        const value = Number(String(preco).replace(',', '.'));
        const formattedValue = Number.isFinite(value)
            ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : 'Valor da reserva';

        modal.dataset.checkoutButtonId = button.dataset.checkoutButtonId;
        modal.querySelector('#checkout-registration-product').textContent = produto;
        modal.querySelector('#checkout-registration-price').textContent = formattedValue;
        modal.querySelector('#checkout-registration-message').textContent = '';
        modal.classList.add('is-open');
        setTimeout(() => modal.querySelector('#checkout-full-name')?.focus(), 30);
    }

    async function redirectToMercadoPagoCheckout(button, cliente) {
        const { produto, preco } = selectedCheckoutProduct(button);
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
                    valor: Number(String(preco).replace(',', '.')),
                    product_id: productId || undefined,
                    cor: cor || undefined,
                    quantity: 1,
                    cliente
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
        openCheckoutRegistration(btn);
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
