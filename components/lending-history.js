class LendingHistory extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <link 
        rel="stylesheet" 
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
      <div class="container mt-3">
        <h3 class="mb-3">Historial de Préstamos</h3>
        <div class="mb-3">
          <label for="history-clientId" class="form-label">Identificador del cliente:</label>
          <input type="text" class="form-control" id="history-clientId" placeholder="Ingrese su identificador">
        </div>
        <button id="load-history" class="btn btn-secondary mb-3">Cargar historial</button>
        <ul id="history-list" class="list-group"></ul>
      </div>
    `;
  }
  
  connectedCallback() {
    this.shadowRoot
      .getElementById('load-history')
      .addEventListener('click', this.loadHistory.bind(this));
  }
  
  disconnectedCallback() {
    this.shadowRoot
      .getElementById('load-history')
      .removeEventListener('click', this.loadHistory.bind(this));
  }
  
  async loadHistory() {
    const clientId = this.shadowRoot.getElementById('history-clientId').value.trim();
    if (!clientId) {
      alert('Por favor, ingrese el identificador del cliente para cargar su historial.');
      return;
    }
    try {
      const response = await fetch(`http://localhost:3000/lendings?clientId=${clientId}`);
      if (!response.ok) throw new Error('Error al cargar el historial');
      const lendings = await response.json();
      this.renderHistory(lendings);
    } catch (error) {
      console.error('Error cargando el historial:', error);
    }
  }
  
  renderHistory(lendings) {
    const historyList = this.shadowRoot.getElementById('history-list');
    historyList.innerHTML = '';
    if (lendings.length === 0) {
      historyList.innerHTML = '<li class="list-group-item">No se encontraron préstamos anteriores.</li>';
      return;
    }
    lendings.forEach(lending => {
      const listItem = document.createElement('li');
      listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
      listItem.innerHTML = `
        <div>
          <strong>${new Date(lending.date).toLocaleString()}</strong> - Monto: ${lending.amount}, Tasa: ${lending.rate}%, Periodos: ${lending.periods}
        </div>
        <button class="btn btn-sm btn-info" data-id="${lending.id}">Ver Detalle</button>
      `;
      listItem.querySelector('button').addEventListener('click', async () => {
        try {
          const res = await fetch(`http://localhost:3000/lendings/${lending.id}`);
          if (!res.ok) throw new Error('Error al cargar el detalle');
          const lendingDetail = await res.json();
          // Despachar evento para que el componente de la tabla muestre el detalle
          window.dispatchEvent(new CustomEvent('lendingHistoryDetail', { detail: { schedule: lendingDetail.schedule } }));
        } catch (error) {
          console.error('Error cargando el detalle:', error);
        }
      });
      historyList.appendChild(listItem);
    });
  }
}

customElements.define('lending-history', LendingHistory); 