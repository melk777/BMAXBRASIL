(function () {
  const { qs, formatCurrency, showToast } = window.BmaxUI;
  let customers = [];

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(value) {
    if (!value) return '-';
    return new Date(value).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  }

  function formatCpf(value) {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '-';
  }

  function formatPhone(value) {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return value || '-';
  }

  function formatCep(value) {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
    return digits.replace(/(\d{5})(\d{3})/, '$1-$2') || '-';
  }

  function addressLine(customer) {
    return [
      customer.address,
      customer.number,
      customer.complement,
      customer.neighborhood,
      customer.city && customer.state ? `${customer.city}/${customer.state}` : customer.city || customer.state,
      customer.cep ? `CEP ${formatCep(customer.cep)}` : ''
    ].filter(Boolean).join(', ');
  }

  function matchesSearch(customer, term) {
    if (!term) return true;
    const blob = [
      customer.full_name,
      customer.cpf,
      customer.email,
      customer.phone,
      customer.product_name,
      customer.city,
      customer.state,
      customer.neighborhood
    ].join(' ').toLowerCase();
    return term.toLowerCase().split(/\s+/).filter(Boolean).every((word) => blob.includes(word));
  }

  function statusLabel(status) {
    const labels = {
      checkout_created: 'Checkout criado',
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Recusado',
      cancelled: 'Cancelado'
    };
    return labels[status] || status || 'Checkout criado';
  }

  function renderCustomers() {
    const term = qs('#customer-search')?.value.trim() || '';
    const visible = customers.filter((customer) => matchesSearch(customer, term));
    qs('#customers-count').textContent = `${visible.length} cadastro${visible.length === 1 ? '' : 's'}`;
    qs('#customers-table').innerHTML = visible
      .map((customer) => `
        <tr>
          <td>
            <strong>${escapeHtml(customer.full_name)}</strong>
            <p class="text-xs text-slate-500">${escapeHtml(customer.email)}</p>
          </td>
          <td>
            <span class="font-semibold">${escapeHtml(formatCpf(customer.cpf))}</span>
            <p class="text-xs text-slate-500">${escapeHtml(formatPhone(customer.phone))}</p>
          </td>
          <td>
            <span>${escapeHtml(customer.product_name || '-')}</span>
            <p class="text-xs text-slate-500">${formatCurrency(customer.product_amount || 0)}</p>
          </td>
          <td>${escapeHtml(customer.city || '-')} / ${escapeHtml(customer.state || '-')}</td>
          <td><span class="status-pill active">${escapeHtml(statusLabel(customer.payment_status))}</span></td>
          <td>${formatDate(customer.created_at)}</td>
          <td class="text-right"><button class="btn-secondary" data-view-customer="${customer.id}"><i class="ph ph-eye"></i>Ver</button></td>
        </tr>
      `)
      .join('') || '<tr><td colspan="7" class="text-center text-slate-500">Nenhum cliente encontrado.</td></tr>';
  }

  function renderCustomerDetails(customer) {
    const details = qs('#customer-details');
    if (!customer) {
      details.innerHTML = '<p class="text-sm text-slate-500">Selecione um cliente para ver os dados completos.</p>';
      return;
    }

    details.innerHTML = `
      <div class="space-y-5">
        <div>
          <p class="text-xs font-bold uppercase text-slate-500">Cliente</p>
          <h3 class="mt-1 text-lg font-semibold">${escapeHtml(customer.full_name)}</h3>
          <p class="text-sm text-slate-500">${escapeHtml(customer.email)} · ${escapeHtml(formatPhone(customer.phone))}</p>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div><p class="text-xs font-bold uppercase text-slate-500">CPF</p><p>${escapeHtml(formatCpf(customer.cpf))}</p></div>
          <div><p class="text-xs font-bold uppercase text-slate-500">Data</p><p>${formatDate(customer.created_at)}</p></div>
          <div><p class="text-xs font-bold uppercase text-slate-500">Produto</p><p>${escapeHtml(customer.product_name || '-')}</p></div>
          <div><p class="text-xs font-bold uppercase text-slate-500">Valor</p><p>${formatCurrency(customer.product_amount || 0)}</p></div>
        </div>
        <div>
          <p class="text-xs font-bold uppercase text-slate-500">Endereço completo</p>
          <p class="mt-1 leading-relaxed">${escapeHtml(addressLine(customer))}</p>
        </div>
        <div>
          <p class="text-xs font-bold uppercase text-slate-500">Ponto de referência</p>
          <p class="mt-1 leading-relaxed">${escapeHtml(customer.reference_point || '-')}</p>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div><p class="text-xs font-bold uppercase text-slate-500">Preferência Mercado Pago</p><p class="break-all text-sm">${escapeHtml(customer.payment_preference_id || '-')}</p></div>
          <label class="block"><span class="form-label">Status</span><select id="customer-payment-status" class="form-select" data-customer-status="${customer.id}">
            ${['checkout_created', 'pending', 'approved', 'rejected', 'cancelled'].map((status) => `<option value="${status}" ${customer.payment_status === status ? 'selected' : ''}>${statusLabel(status)}</option>`).join('')}
          </select></label>
        </div>
      </div>
    `;
  }

  async function loadCustomers() {
    if (!window.BmaxAPI.configured) return;
    customers = await window.BmaxAPI.listCustomers();
    renderCustomers();
    renderCustomerDetails(customers[0]);
  }

  function bindCustomers() {
    qs('#customer-search')?.addEventListener('input', renderCustomers);
    qs('#customers-table')?.addEventListener('click', (event) => {
      const id = event.target.closest('[data-view-customer]')?.dataset.viewCustomer;
      if (!id) return;
      renderCustomerDetails(customers.find((customer) => customer.id === id));
    });
    qs('#customer-details')?.addEventListener('change', async (event) => {
      const id = event.target.dataset.customerStatus;
      if (!id) return;
      try {
        await window.BmaxAPI.updateCustomer(id, { payment_status: event.target.value });
        showToast('Status do cliente atualizado.');
        await loadCustomers();
        window.dispatchEvent(new CustomEvent('bmax:data-changed'));
      } catch (error) {
        showToast(error.message || 'Erro ao atualizar cliente.', 'error');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', bindCustomers);
  window.addEventListener('bmax:admin-ready', loadCustomers);
  window.addEventListener('bmax:data-changed', loadCustomers);
  window.addEventListener('bmax:route', (event) => {
    if (event.detail.route === 'customers') loadCustomers().catch((error) => showToast(error.message || 'Erro ao carregar clientes.', 'error'));
  });
})();
