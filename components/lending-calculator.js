class LendingCalculator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
         .container {
           max-width: 600px;
           margin: 0 auto;
           font-family: Arial, sans-serif;
         }
         h2, h3 {
           text-align: center;
         }
         form {
           display: grid;
           grid-template-columns: 1fr 1fr;
           gap: 10px;
           margin-bottom: 20px;
         }
         form label {
           grid-column: span 2;
         }
         form input {
           padding: 5px;
           font-size: 1rem;
           width: 100%;
         }
         button {
           grid-column: span 2;
           padding: 10px;
           font-size: 1rem;
           cursor: pointer;
         }
         table {
           width: 100%;
           border-collapse: collapse;
         }
         th, td {
           border: 1px solid #ccc;
           padding: 5px;
           text-align: right;
         }
         th {
           background-color: #eee;
         }
         .history {
           margin-top: 30px;
         }
         ul {
           list-style: none;
           padding: 0;
         }
         li {
           margin-bottom: 5px;
         }
      </style>
      <div class="container">
         <h2>Calculadora de Préstamos</h2>
         <form id="loan-form">
           <label>
             Monto del préstamo:
             <input type="number" id="amount" step="0.01" required>
           </label>
           <label>
             Tasa de interés anual (%):
             <input type="number" id="rate" step="0.01" required>
           </label>
           <label>
             Número de períodos (meses):
             <input type="number" id="periods" required>
           </label>
           <label>
             Identificador del cliente:
             <input type="text" id="clientId" required>
           </label>
           <button type="submit">Generar Tabla de Amortización</button>
         </form>
         <div id="result">
           <!-- La tabla calculada se mostrará aquí -->
         </div>
         <div class="history">
           <h3>Cálculos Anteriores</h3>
           <button id="load-history">Cargar historial</button>
           <ul id="history-list"></ul>
         </div>
      </div>
    `;
  }

  connectedCallback() {
    this.shadowRoot
      .getElementById('loan-form')
      .addEventListener('submit', this.handleSubmit.bind(this));
    this.shadowRoot
      .getElementById('load-history')
      .addEventListener('click', this.loadHistory.bind(this));
  }

  disconnectedCallback() {
    this.shadowRoot
      .getElementById('loan-form')
      .removeEventListener('submit', this.handleSubmit.bind(this));
    this.shadowRoot
      .getElementById('load-history')
      .removeEventListener('click', this.loadHistory.bind(this));
  }

  // Calcula la tabla de amortización usando una tasa fija y pagos constantes (fórmula de préstamo)
  calculateAmortization(amount, rate, periods) {
    const monthlyRate = rate / 100 / 12;
    const payment = amount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -periods));
    let balance = amount;
    let schedule = [];
    for (let i = 1; i <= periods; i++) {
      const interest = balance * monthlyRate;
      const principal = payment - interest;
      balance = balance - principal;
      schedule.push({
         periodo: i,
         pago: payment.toFixed(2),
         intereses: interest.toFixed(2),
         amortizacion: principal.toFixed(2),
         saldo: balance > 0 ? balance.toFixed(2) : "0.00"
      });
    }
    return schedule;
  }

  renderTable(schedule) {
    let tableHtml = '<table><thead><tr><th>Periodo</th><th>Pago</th><th>Intereses</th><th>Amortización</th><th>Saldo</th></tr></thead><tbody>';
    schedule.forEach(item => {
      tableHtml += `<tr>
          <td>${item.periodo}</td>
          <td>${item.pago}</td>
          <td>${item.intereses}</td>
          <td>${item.amortizacion}</td>
          <td>${item.saldo}</td>
      </tr>`;
    });
    tableHtml += '</tbody></table>';
    return tableHtml;
  }

  async handleSubmit(event) {
    event.preventDefault();
    const amount = parseFloat(this.shadowRoot.getElementById('amount').value);
    const rate = parseFloat(this.shadowRoot.getElementById('rate').value);
    const periods = parseInt(this.shadowRoot.getElementById('periods').value);
    const clientId = this.shadowRoot.getElementById('clientId').value.trim();
    const schedule = this.calculateAmortization(amount, rate, periods);
    
    // Mostrar la tabla en pantalla
    this.shadowRoot.getElementById('result').innerHTML = this.renderTable(schedule);
    
    // Guardar la calculación en JSON Server
    const dataToSave = { amount, rate, periods, clientId, schedule, date: new Date().toISOString() };
    try {
      const response = await fetch('http://localhost:3000/calculations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSave)
      });
      if (!response.ok) throw new Error('Error al guardar la calculación');
      console.log('Calculación guardada con éxito');
    } catch (error) {
      console.error('Error guardando la calculación:', error);
    }
  }

  // Carga el historial de cálculos filtrando por el identificador del cliente
  async loadHistory() {
    const clientId = this.shadowRoot.getElementById('clientId').value.trim();
    if (!clientId) {
      alert('Por favor, ingrese el identificador del cliente para cargar su historial.');
      return;
    }
    try {
      const response = await fetch(`http://localhost:3000/calculations?clientId=${clientId}`);
      if (!response.ok) throw new Error('Error al cargar el historial');
      const calculations = await response.json();
      this.renderHistory(calculations);
    } catch (error) {
      console.error('Error cargando el historial:', error);
    }
  }

  renderHistory(calculations) {
    const list = this.shadowRoot.getElementById('history-list');
    list.innerHTML = '';
    if (calculations.length === 0) {
      list.innerHTML = '<li>No se encontraron cálculos anteriores.</li>';
      return;
    }
    calculations.forEach(calc => {
      const listItem = document.createElement('li');
      listItem.innerHTML = `
        <strong>${new Date(calc.date).toLocaleString()}</strong> - 
        Monto: ${calc.amount}, Tasa: ${calc.rate}%, Periodos: ${calc.periods}
        <button data-id="${calc.id}" class="view-calc">Ver Detalle</button>
      `;
      list.appendChild(listItem);
    });
    // Agregar listener para los botones de "Ver Detalle"
    this.shadowRoot.querySelectorAll('.view-calc').forEach(button => {
      button.addEventListener('click', async (event) => {
        const calcId = event.target.getAttribute('data-id');
        try {
          const response = await fetch(`http://localhost:3000/calculations/${calcId}`);
          if (!response.ok) throw new Error('Error al cargar el detalle');
          const calcDetail = await response.json();
          this.shadowRoot.getElementById('result').innerHTML = this.renderTable(calcDetail.schedule);
        } catch (error) {
          console.error('Error cargando el detalle:', error);
        }
      });
    });
  }
}

customElements.define('lending-calculator', LendingCalculator); 