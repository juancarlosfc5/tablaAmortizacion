class LendingTable extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
    // Enlazar los controladores para facilitar su remoción
    this.handleLendingDone = this.handleLendingDone.bind(this);
    this.handleHistoryDetail = this.handleHistoryDetail.bind(this);
  }
  
  connectedCallback() {
    window.addEventListener('lendingCalculationDone', this.handleLendingDone);
    window.addEventListener('lendingHistoryDetail', this.handleHistoryDetail);
  }
  
  disconnectedCallback() {
    window.removeEventListener('lendingCalculationDone', this.handleLendingDone);
    window.removeEventListener('lendingHistoryDetail', this.handleHistoryDetail);
  }
  
  handleLendingDone(event) {
    const schedule = event.detail.schedule;
    this.updateTable(schedule);
  }
  
  handleHistoryDetail(event) {
    const schedule = event.detail.schedule;
    this.updateTable(schedule);
  }
  
  updateTable(schedule) {
    const tableContainer = this.shadowRoot.getElementById('table-container');
    tableContainer.innerHTML = this.renderTable(schedule);
  }
  
  renderTable(schedule) {
    let tableHtml = `
      <div class="container mt-3">
        <h3 class="mb-3">Tabla de Amortización</h3>
        <table class="table table-striped">
          <thead>
            <tr>
              <th>Cuota</th>
              <th>Saldo Inicial</th>
              <th>Cuota Mensual</th>
              <th>Intereses</th>
              <th>Amortización</th>
              <th>Saldo Restante</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    schedule.forEach(item => {
      tableHtml += `
        <tr>
          <td>${item.cuota}</td>
          <td>${item.saldoInicial}</td>
          <td>${item.cuotaMensual}</td>
          <td>${item.intereses}</td>
          <td>${item.amortizacion}</td>
          <td>${item.saldoRestante}</td>
        </tr>
      `;
    });
    
    tableHtml += `
          </tbody>
        </table>
      </div>
    `;
    return tableHtml;
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      <link 
        rel="stylesheet" 
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
      <div id="table-container"></div>
    `;
  }
}

customElements.define('lending-table', LendingTable); 