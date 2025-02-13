class LendingForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Enlazamos el método handleSubmit una sola vez
    this.handleSubmit = this.handleSubmit.bind(this);
    
    this.shadowRoot.innerHTML = `
      <link 
        rel="stylesheet" 
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
      <div class="container mt-3">
        <form id="loan-form">
          <div class="mb-3">
            <label for="amount" class="form-label">Monto del préstamo:</label>
            <input type="number" class="form-control" id="amount" step="0.01" required>
          </div>
          <div class="mb-3">
            <label for="rate" class="form-label">Tasa de interés anual (%):</label>
            <input type="number" class="form-control" id="rate" step="0.01" required>
          </div>
          <div class="mb-3">
            <label for="periods" class="form-label">Número de períodos (meses):</label>
            <input type="number" class="form-control" id="periods" required>
          </div>
          <div class="mb-3">
            <label for="user-name" class="form-label">Nombre del usuario:</label>
            <input type="text" class="form-control" id="user-name" required>
          </div>
          <div class="mb-3">
            <label for="clientId" class="form-label">Identificador del cliente:</label>
            <input type="text" class="form-control" id="clientId" required>
          </div>
          <div class="mb-3">
            <label for="amortization-type" class="form-label">Tipo de Amortización:</label>
            <select id="amortization-type" class="form-select" required>
              <option value="francesa" selected>Francesa (cuota fija)</option>
              <option value="americana">Americana</option>
            </select>
          </div>
          <button id="generate-btn" type="button" class="btn btn-primary">
            Generar Tabla de Amortización
          </button>
        </form>
      </div>
    `;
  }
  
  connectedCallback() {
    this.shadowRoot
      .getElementById('generate-btn')
      .addEventListener('click', this.handleSubmit);
  }
  
  disconnectedCallback() {
    this.shadowRoot
      .getElementById('generate-btn')
      .removeEventListener('click', this.handleSubmit);
  }
  
  // Método para calcular la amortización francesa (cuotas fijas)
  calculateAmortizationFrancesa(amount, rate, periods) {
    const monthlyRate = rate / 100 / 12;
    const cuotaMensual = amount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -periods));
    let saldoActual = amount;
    const schedule = [];
    for (let i = 1; i <= periods; i++) {
      const saldoInicial = saldoActual;
      const intereses = saldoInicial * monthlyRate;
      const amortizacion = cuotaMensual - intereses;
      let saldoRestante = saldoInicial - amortizacion;
      if (saldoRestante < 0.01) saldoRestante = 0;
      schedule.push({
        cuota: i,
        saldoInicial: saldoInicial.toFixed(2),
        cuotaMensual: cuotaMensual.toFixed(2),
        intereses: intereses.toFixed(2),
        amortizacion: amortizacion.toFixed(2),
        saldoRestante: saldoRestante.toFixed(2)
      });
      saldoActual = saldoRestante;
    }
    return schedule;
  }
  
  // Método para calcular la amortización americana
  // Se paga solo los intereses durante los primeros períodos y se amortiza el principal al final
  calculateAmortizationAmericana(amount, rate, periods) {
    const monthlyRate = rate / 100 / 12;
    const schedule = [];
    // Para los períodos previos al último, se paga únicamente el interés
    for (let i = 1; i < periods; i++) {
      const intereses = amount * monthlyRate;
      schedule.push({
        cuota: i,
        saldoInicial: amount.toFixed(2),
        cuotaMensual: intereses.toFixed(2),
        intereses: intereses.toFixed(2),
        amortizacion: "0.00",
        saldoRestante: amount.toFixed(2)
      });
    }
    // En el último período se paga también el principal (amortización completa)
    const intereses = amount * monthlyRate;
    schedule.push({
      cuota: periods,
      saldoInicial: amount.toFixed(2),
      cuotaMensual: (intereses + amount).toFixed(2),
      intereses: intereses.toFixed(2),
      amortizacion: amount.toFixed(2),
      saldoRestante: "0.00"
    });
    return schedule;
  }
  
  async handleSubmit(event) {
    event.preventDefault();
  
    const amount = parseFloat(this.shadowRoot.getElementById('amount').value);
    const rate = parseFloat(this.shadowRoot.getElementById('rate').value);
    const periods = parseInt(this.shadowRoot.getElementById('periods').value);
    const userName = this.shadowRoot.getElementById('user-name').value.trim();
    const clientId = this.shadowRoot.getElementById('clientId').value.trim();
    const amortizationType = this.shadowRoot.getElementById('amortization-type').value;
    
    let schedule = [];
    if (amortizationType === 'francesa') {
      schedule = this.calculateAmortizationFrancesa(amount, rate, periods);
    } else if (amortizationType === 'americana') {
      schedule = this.calculateAmortizationAmericana(amount, rate, periods);
    }
    
    // Despachamos el evento global para notificar al componente "lending-table"
    // Se utiliza el nombre 'lendingCalculationDone', que es el que escucha dicho componente.
    window.dispatchEvent(new CustomEvent('lendingCalculationDone', { detail: { schedule } }));
  
    // Guardar la cálculación en JSON Server
    const dataToSave = { amount, rate, periods, userName, clientId, amortizationType, schedule, date: new Date().toISOString() };
    try {
      const response = await fetch('http://localhost:3000/lendings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      if (!response.ok) throw new Error('Error al guardar la cálculación');
      console.log('Cálculo guardado exitosamente');
    } catch (error) {
      console.error('Error guardando la cálculación:', error);
    }
  }
}

customElements.define('lending-form', LendingForm); 