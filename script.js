document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const charts = {};
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIconSun = document.getElementById('theme-icon-sun');
    const themeIconMoon = document.getElementById('theme-icon-moon');

    // --- Routing ---
    function showPage(pageId) {
        pages.forEach(page => page.classList.toggle('active', page.id === pageId));
        navLinks.forEach(link => {
            const linkPageId = link.getAttribute('href').substring(1);
            // FIX: Simplified the active class logic to prevent syntax errors.
            link.classList.toggle('active', linkPageId === pageId);
        });
        mobileMenu.classList.remove('open');
        window.scrollTo(0, 0);
    }

    function handleRouting() {
        const hash = window.location.hash.substring(1) || 'home';
        showPage(hash);
    }

    window.addEventListener('hashchange', handleRouting);
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = link.getAttribute('href');
        });
    });
    mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('open'));

    // --- Theme Toggle ---
    function applyTheme(isDark) {
         if (isDark) {
            document.documentElement.classList.add('dark');
            themeIconMoon.classList.add('hidden');
            themeIconSun.classList.remove('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            themeIconMoon.classList.remove('hidden');
            themeIconSun.classList.add('hidden');
        }
    }

    function initTheme() {
        const isDark = localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
        applyTheme(isDark);
        lucide.createIcons({ attrs: { 'stroke-width': 1.5 } });
    }

    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.theme = isDark ? 'dark' : 'light';
        applyTheme(isDark);
        
        // Re-render charts for new theme colors
        Object.values(charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        document.querySelectorAll('form').forEach(form => {
            if (form.oninput) form.oninput();
        });
    });

    // --- Utility Functions ---
    function formatCurrency(value, currency = 'NPR') { // Changed default currency to NPR
        return new Intl.NumberFormat('en-IN', { // Changed locale to en-IN for Indian Rupees
            style: 'currency', 
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }

    function syncSliderAndInput(sliderId, inputId, callback) {
        const slider = document.getElementById(sliderId);
        const input = document.getElementById(inputId);
        if (!slider || !input) return;
        slider.addEventListener('input', (e) => {
            input.value = e.target.value;
            if (callback) callback();
        });
        input.addEventListener('input', (e) => {
            slider.value = e.target.value;
            if (callback) callback();
        });
    }

    // --- Calculator Setup ---
    function setupLoanCalculator(id, title) {
        const page = document.getElementById(id);
        if (!page) return;
        page.innerHTML = `
            <div class="calculator-layout">
                <div class="form-container">
                    <h2>${title}</h2>
                    <form id="${id}-form">
                        <div class="form-group">
                            <label for="${id}-amount">Loan Amount (Rs.)</label>
                            <input type="number" id="${id}-amount" value="250000" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label for="${id}-interest">Annual Interest Rate (%)</label>
                            <input type="number" id="${id}-interest" step="0.01" value="3.5" class="form-input" required>
                            <input type="range" id="${id}-interest-slider" min="1" max="15" step="0.01" value="3.5">
                        </div>
                        <div class="form-group">
                            <label for="${id}-term">Loan Term (Years)</label>
                            <input type="number" id="${id}-term" value="30" class="form-input" required>
                            <input type="range" id="${id}-term-slider" min="1" max="40" value="30">
                        </div>
                    </form>
                </div>
                <div class="results-container">
                    <h3>Results</h3>
                    <div id="${id}-results" class="results-display"></div>
                    <div class="chart-container"><canvas id="${id}-chart"></canvas></div>
                </div>
            </div>`;
        const form = document.getElementById(`${id}-form`);
        const resultsDiv = document.getElementById(`${id}-results`);
        const chartCanvas = document.getElementById(`${id}-chart`);

        function calculate() {
            const amount = parseFloat(document.getElementById(`${id}-amount`).value) || 0;
            const interest = parseFloat(document.getElementById(`${id}-interest`).value) / 100 / 12;
            const term = parseFloat(document.getElementById(`${id}-term`).value) * 12;
            if (amount <= 0 || interest <= 0 || term <= 0) {
                resultsDiv.innerHTML = '<p>Please enter valid values.</p>';
                if (charts[id]) charts[id].destroy();
                return;
            }
            const x = Math.pow(1 + interest, term);
            const monthlyPayment = (amount * x * interest) / (x - 1);
            const totalPayment = monthlyPayment * term;
            const totalInterest = totalPayment - amount;
            resultsDiv.innerHTML = `
                <p><strong>Monthly Payment:</strong> <span class="highlight">${formatCurrency(monthlyPayment)}</span></p>
                <p><strong>Total Payment:</strong> ${formatCurrency(totalPayment)}</p>
                <p><strong>Total Interest:</strong> ${formatCurrency(totalInterest)}</p>`;
            displayChart(amount, totalInterest);
        }

        function displayChart(principal, interest) {
            if (charts[id]) charts[id].destroy();
            const isDark = document.documentElement.classList.contains('dark');
            charts[id] = new Chart(chartCanvas, {
                type: 'doughnut',
                data: {
                    labels: ['Principal', 'Interest'],
                    datasets: [{
                        data: [principal, interest],
                        backgroundColor: [isDark ? '#059669' : '#10b981', isDark ? '#047857' : '#34d399'],
                        borderColor: isDark ? 'var(--slate-800)' : 'var(--white)',
                        borderWidth: 4,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: isDark ? 'var(--slate-300)' : 'var(--slate-600)' } } }
                }
            });
        }
        form.oninput = calculate;
        syncSliderAndInput(`${id}-interest-slider`, `${id}-interest`, calculate);
        syncSliderAndInput(`${id}-term-slider`, `${id}-term`, calculate);
        calculate();
    }

    function setupCompoundCalculator(id, title, type) {
        const page = document.getElementById(id);
        if (!page) return;
        const initialLabel = type === 'investment' ? 'Initial Investment' : 'Initial Deposit';
        page.innerHTML = `
            <div class="calculator-layout">
                <div class="form-container">
                    <h2>${title}</h2>
                    <form id="${id}-form">
                        <div class="form-group">
                            <label for="${id}-initial">${initialLabel} (Rs.)</label>
                            <input type="number" id="${id}-initial" value="1000" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label for="${id}-monthly">Monthly Contribution (Rs.)</label>
                            <input type="number" id="${id}-monthly" value="100" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label for="${id}-interest">Annual Rate of Return (%)</label>
                            <input type="number" id="${id}-interest" step="0.01" value="7" class="form-input" required>
                            <input type="range" id="${id}-interest-slider" min="1" max="20" step="0.1" value="7">
                        </div>
                        <div class="form-group">
                            <label for="${id}-term">Time (Years)</label>
                            <input type="number" id="${id}-term" value="10" class="form-input" required>
                            <input type="range" id="${id}-term-slider" min="1" max="50" value="10">
                        </div>
                    </form>
                </div>
                <div class="results-container">
                    <h3>Results</h3>
                    <div id="${id}-results" class="results-display"></div>
                    <div class="chart-container"><canvas id="${id}-chart"></canvas></div>
                </div>
            </div>`;
        const form = document.getElementById(`${id}-form`);
        const resultsDiv = document.getElementById(`${id}-results`);
        const chartCanvas = document.getElementById(`${id}-chart`);

        function calculate() {
            const initial = parseFloat(document.getElementById(`${id}-initial`).value) || 0;
            const monthly = parseFloat(document.getElementById(`${id}-monthly`).value) || 0;
            const interest = parseFloat(document.getElementById(`${id}-interest`).value) / 100;
            const term = parseInt(document.getElementById(`${id}-term`).value) || 0;
            if (term <= 0) {
                resultsDiv.innerHTML = '<p>Please enter a valid term.</p>';
                if (charts[id]) charts[id].destroy();
                return;
            }
            
            const yearlyData = [{ year: 0, value: initial, contribution: initial }];
            let futureValue = initial;

            for (let year = 1; year <= term; year++) {
                let yearEndValue = yearlyData[year - 1].value;
                for (let month = 1; month <= 12; month++) {
                    yearEndValue += monthly;
                    yearEndValue *= (1 + interest / 12);
                }
                let currentTotalContribution = initial + (monthly * 12 * year);
                yearlyData.push({ year: year, value: yearEndValue, contribution: currentTotalContribution });
            }
            
            const finalValue = yearlyData[term].value;
            const totalContribution = initial + (monthly * term * 12);
            const totalInterest = finalValue - totalContribution;

            resultsDiv.innerHTML = `
                <p><strong>Future Value:</strong> <span class="highlight">${formatCurrency(finalValue)}</span></p>
                <p><strong>Total Contributions:</strong> ${formatCurrency(totalContribution)}</p>
                <p><strong>Total Interest Earned:</strong> ${formatCurrency(totalInterest)}</p>`;
            displayChart(yearlyData);
        }

        function displayChart(yearlyData) {
            if (charts[id]) charts[id].destroy();
            const isDark = document.documentElement.classList.contains('dark');
            charts[id] = new Chart(chartCanvas, {
                type: 'line',
                data: {
                    labels: yearlyData.map(d => `Year ${d.year}`),
                    datasets: [{
                        label: 'Total Contributions',
                        data: yearlyData.map(d => d.contribution),
                        backgroundColor: isDark ? 'rgba(100, 116, 139, 0.5)' : 'rgba(203, 213, 225, 0.5)',
                        borderColor: isDark ? '#64748b' : '#cbd5e1',
                        fill: true,
                    }, {
                        label: 'Future Value',
                        data: yearlyData.map(d => d.value),
                        backgroundColor: isDark ? 'rgba(5, 150, 105, 0.5)' : 'rgba(16, 185, 129, 0.5)',
                        borderColor: isDark ? '#059669' : '#10b981',
                        fill: true,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { ticks: { color: isDark ? 'var(--slate-400)' : 'var(--slate-500)' }, grid: { color: isDark ? 'var(--slate-700)' : 'var(--slate-200)'} },
                        x: { ticks: { color: isDark ? 'var(--slate-400)' : 'var(--slate-500)' }, grid: { color: isDark ? 'var(--slate-700)' : 'var(--slate-200)'} }
                    },
                    plugins: { legend: { position: 'bottom', labels: { color: isDark ? 'var(--slate-300)' : 'var(--slate-600)' } } }
                }
            });
        }
        form.oninput = calculate;
        syncSliderAndInput(`${id}-interest-slider`, `${id}-interest`, calculate);
        syncSliderAndInput(`${id}-term-slider`, `${id}-term`, calculate);
        calculate();
    }

    function setupBudgetPlanner(id, title) {
        const page = document.getElementById(id);
        if (!page) return;
        page.innerHTML = `
            <div class="calculator-layout">
                <div class="form-container">
                    <h2>${title}</h2>
                    <form id="${id}-form">
                        <div class="form-group">
                            <label for="${id}-income">Monthly Income (Rs.)</label>
                            <input type="number" id="${id}-income" value="5000" class="form-input">
                        </div>
                        <p style="font-weight: 600; margin-bottom: 1rem;">Monthly Expenses</p>
                        <div class="form-group">
                            <label for="${id}-housing">Housing</label>
                            <input type="number" id="${id}-housing" value="1500" class="form-input">
                        </div>
                        <div class="form-group">
                            <label for="${id}-food">Food & Groceries</label>
                            <input type="number" id="${id}-food" value="600" class="form-input">
                        </div>
                        <div class="form-group">
                            <label for="${id}-transport">Transportation</label>
                            <input type="number" id="${id}-transport" value="300" class="form-input">
                        </div>
                        <div class="form-group">
                            <label for="${id}-entertainment">Entertainment</label>
                            <input type="number" id="${id}-entertainment" value="200" class="form-input">
                        </div>
                        <div class="form-group">
                            <label for="${id}-savings">Savings & Investments</label>
                            <input type="number" id="${id}-savings" value="500" class="form-input">
                        </div>
                        <div class="form-group">
                            <label for="${id}-other">Other</label>
                            <input type="number" id="${id}-other" value="400" class="form-input">
                        </div>
                    </form>
                </div>
                <div class="results-container">
                    <h3>Budget Summary</h3>
                    <div id="${id}-results" class="results-display"></div>
                    <div class="chart-container"><canvas id="${id}-chart"></canvas></div>
                </div>
            </div>`;
        const form = document.getElementById(`${id}-form`);
        const resultsDiv = document.getElementById(`${id}-results`);
        const chartCanvas = document.getElementById(`${id}-chart`);

        function calculate() {
            const income = parseFloat(document.getElementById(`${id}-income`).value) || 0;
            const housing = parseFloat(document.getElementById(`${id}-housing`).value) || 0;
            const food = parseFloat(document.getElementById(`${id}-food`).value) || 0;
            const transport = parseFloat(document.getElementById(`${id}-transport`).value) || 0;
            const entertainment = parseFloat(document.getElementById(`${id}-entertainment`).value) || 0;
            const savings = parseFloat(document.getElementById(`${id}-savings`).value) || 0;
            const other = parseFloat(document.getElementById(`${id}-other`).value) || 0;

            const totalExpenses = housing + food + transport + entertainment + savings + other;
            const balance = income - totalExpenses;
            
            resultsDiv.innerHTML = `
                <p><strong>Total Income:</strong> ${formatCurrency(income)}</p>
                <p><strong>Total Expenses:</strong> ${formatCurrency(totalExpenses)}</p>
                <p><strong>Remaining Balance:</strong> <span class="highlight ${balance < 0 ? 'text-red-500' : ''}">${formatCurrency(balance)}</span></p>
            `;

            const expenseData = {
                labels: ['Housing', 'Food', 'Transport', 'Entertainment', 'Savings', 'Other'],
                values: [housing, food, transport, entertainment, savings, other]
            };
            displayChart(expenseData);
        }

        function displayChart(data) {
            if (charts[id]) charts[id].destroy();
            const isDark = document.documentElement.classList.contains('dark');
            charts[id] = new Chart(chartCanvas, {
                type: 'pie',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.values,
                        backgroundColor: [
                            '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#059669', '#047857'
                        ],
                        borderColor: isDark ? 'var(--slate-800)' : 'var(--white)',
                        borderWidth: 4,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: isDark ? 'var(--slate-300)' : 'var(--slate-600)' } } }
                }
            });
        }
        form.oninput = calculate;
        calculate();
    }

    function setupSalaryCalculator(id, title) {
        const page = document.getElementById(id);
        if (!page) return;
        page.innerHTML = `
            <div style="max-width: 42rem; margin: auto;">
                <div class="form-container">
                    <h2>${title}</h2>
                    <form id="${id}-form">
                        <div class="form-group">
                            <label for="${id}-gross">Gross Annual Salary (Rs.)</label>
                            <input type="number" id="${id}-gross" value="60000" class="form-input">
                        </div>
                        <div class="form-group">
                            <label for="${id}-tax">Income Tax Rate (%)</label>
                            <input type="number" id="${id}-tax" value="20" class="form-input">
                        </div>
                        <div class="form-group">
                            <label for="${id}-deductions">Other Monthly Deductions (Rs.)</label>
                            <input type="number" id="${id}-deductions" value="150" class="form-input">
                        </div>
                    </form>
                    <div id="${id}-results" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--slate-200);"></div>
                </div>
            </div>`;
        const form = document.getElementById(`${id}-form`);
        const resultsDiv = document.getElementById(`${id}-results`);

        function calculate() {
            const gross = parseFloat(document.getElementById(`${id}-gross`).value) || 0;
            const taxRate = parseFloat(document.getElementById(`${id}-tax`).value) || 0;
            const otherDeductionsMonthly = parseFloat(document.getElementById(`${id}-deductions`).value) || 0;

            const annualTax = gross * (taxRate / 100);
            const netAnnual = gross - annualTax - (otherDeductionsMonthly * 12);
            const netMonthly = netAnnual / 12;

            resultsDiv.innerHTML = `
                <div class="results-display">
                    <p><strong>Gross Annual Salary:</strong> ${formatCurrency(gross)}</p>
                    <p><strong>Annual Tax:</strong> ${formatCurrency(annualTax)}</p>
                    <p><strong>Net Annual Salary:</strong> ${formatCurrency(netAnnual)}</p>
                    <p><strong>Net Monthly Salary:</strong> <span class="highlight">${formatCurrency(netMonthly)}</span></p>
                </div>`;
        }
        form.oninput = calculate;
        calculate();
    }
    
    // --- Individual Calculator Initializations ---
    setupLoanCalculator('mortgage', 'Mortgage Calculator');
    setupLoanCalculator('loan', 'Loan Calculator');
    setupCompoundCalculator('savings', 'Savings Calculator', 'savings');
    setupCompoundCalculator('investment', 'Investment Calculator', 'investment');
    setupCompoundCalculator('retirement', 'Retirement Calculator', 'retirement');
    setupBudgetPlanner('budget', 'Budget Planner');
    setupSalaryCalculator('salary', 'Salary Calculator');

    const tipForm = document.getElementById('tip-form');
    if (tipForm) {
        function calculateTip() {
            const bill = parseFloat(document.getElementById('tip-bill').value) || 0;
            const tipPercentage = parseFloat(document.getElementById('tip-percentage').value) || 0;
            const split = parseInt(document.getElementById('tip-split').value) || 1;
            const resultsDiv = document.getElementById('tip-results');
            if (bill > 0) {
                const tipAmount = bill * (tipPercentage / 100);
                const totalAmount = bill + tipAmount;
                const perPerson = totalAmount / split;
                resultsDiv.innerHTML = `
                    <div class="results-display">
                        <p><strong>Tip Amount:</strong> ${formatCurrency(tipAmount)}</p>
                        <p><strong>Total Bill:</strong> ${formatCurrency(totalAmount)}</p>
                        ${split > 1 ? `<p><strong>Amount Per Person:</strong> <span class="highlight">${formatCurrency(perPerson)}</span></p>` : ''}
                    </div>`;
            } else {
                resultsDiv.innerHTML = '';
            }
        }
        tipForm.addEventListener('input', calculateTip);
        calculateTip();
    }

    const exchangeContainer = document.getElementById('exchange-container');
    if (exchangeContainer) {
        const fromSelect = document.getElementById('from-currency');
        const toSelect = document.getElementById('to-currency');
        const amountInput = document.getElementById('exchange-amount');
        const swapButton = document.getElementById('swap-currency');
        const rateInfo = document.getElementById('exchange-rate-info');
        const finalResult = document.getElementById('exchange-final-result');
        let rates = {};
        // Updated API URL to exchangerate.host for better flexibility and current rates
        const apiUrl = 'https://open.er-api.com/v6/latest'; 

        async function fetchRates() {
            try {
                const fromCurrency = fromSelect.value;
                // Fetch rates based on the 'from' currency
                const response = await fetch(`${apiUrl}?base=${fromCurrency}`); 
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                rates = data.rates; // Access the rates object
                populateCurrencies();
                calculateExchange();
            } catch (error) {
                rateInfo.textContent = 'Could not fetch exchange rates.';
                console.error("Exchange Rate API Error:", error);
            }
        }

        function populateCurrencies() {
            const popularCurrencies = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'NPR', 'NZD'];
            popularCurrencies.sort(); // Sort for better UX
            [fromSelect, toSelect].forEach(select => {
                select.innerHTML = popularCurrencies.map(currency => `<option value="${currency}">${currency}</option>`).join('');
            });
            fromSelect.value = 'USD';
            toSelect.value = 'NPR'; // Default to Nepali Rupee
        }

        function calculateExchange() {
            if (Object.keys(rates).length === 0) return;
            const fromCurrency = fromSelect.value;
            const toCurrency = toSelect.value;
            const amount = parseFloat(amountInput.value) || 0;
            
            // Calculate rate relative to 'fromCurrency'
            // Since the API returns rates relative to the base, we can directly use them.
            // If the base changes, we refetch rates, so `rates[toCurrency]` is already relative to `fromCurrency`.
            const rate = rates[toCurrency]; 
            
            const result = amount * rate;
            rateInfo.textContent = `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
            finalResult.textContent = formatCurrency(result, toCurrency);
        }

        function swapCurrencies() {
            const temp = fromSelect.value;
            fromSelect.value = toSelect.value;
            toSelect.value = temp;
            fetchRates(); // Re-fetch rates when currencies are swapped, as the base changes
        }
        [fromSelect, toSelect, amountInput].forEach(el => el.addEventListener('input', calculateExchange));
        // Add event listener to fromSelect to refetch rates when the base currency changes
        fromSelect.addEventListener('change', fetchRates); 
        swapButton.addEventListener('click', swapCurrencies);
        fetchRates();
    }

    // --- Initial Load ---
    initTheme();
    handleRouting();
});
