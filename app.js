// app.js
import { loadData, saveData, addTransaction, updateTransaction, deleteTransaction, importData, resetData, getCurrentUser, login, register, logout } from './storage.js';
import { generateId, formatCurrency, formatDate, sanitizeHTML, createElement } from './utils.js';

// State
let appData = null;
let currentFilter = 'all';
let currentSearch = '';
let deleteTimeout = null;
let pendingDeleteTxn = null;

// DOM Elements
const els = {
    authView: document.getElementById('authView'),
    appHeader: document.getElementById('appHeader'),
    appMain: document.getElementById('appMain'),
    btnLogout: document.getElementById('btnLogout'),
    authForm: document.getElementById('authForm'),
    authFormTitle: document.getElementById('authFormTitle'),
    btnToggleAuth: document.getElementById('btnToggleAuth'),
    btnAuthSubmit: document.getElementById('btnAuthSubmit'),
    authToggleText: document.getElementById('authToggleText'),
    usernameInput: document.getElementById('username'),
    passwordInput: document.getElementById('password'),

    netBalance: document.getElementById('netBalance'),
    totalIncome: document.getElementById('totalIncome'),
    totalExpense: document.getElementById('totalExpense'),
    
    budgetTotal: document.getElementById('budgetTotal'),
    budgetSpent: document.getElementById('budgetSpent'),
    budgetProgressFill: document.getElementById('budgetProgressFill'),
    budgetWarning: document.getElementById('budgetWarning'),
    btnSetBudget: document.getElementById('btnSetBudget'),
    
    transactionsList: document.getElementById('transactionsList'),
    emptyState: document.getElementById('emptyState'),
    searchTransactions: document.getElementById('searchTransactions'),
    filterType: document.getElementById('filterType'),
    
    btnAddTransaction: document.getElementById('btnAddTransaction'),
    btnEmptyStateAdd: document.getElementById('btnEmptyStateAdd'),
    
    transactionModal: document.getElementById('transactionModal'),
    transactionForm: document.getElementById('transactionForm'),
    btnCancelTransaction: document.getElementById('btnCancelTransaction'),
    modalTitle: document.getElementById('modalTitle'),
    txnId: document.getElementById('txnId'),
    
    settingsModal: document.getElementById('settingsModal'),
    btnSettings: document.getElementById('btnSettings'),
    btnCloseSettings: document.getElementById('btnCloseSettings'),
    currencySymbol: document.getElementById('currencySymbol'),
    btnExport: document.getElementById('btnExport'),
    btnImport: document.getElementById('btnImport'),
    btnResetData: document.getElementById('btnResetData'),
    
    toastContainer: document.getElementById('toastContainer'),
    trendChart: document.getElementById('trendChart'),
    categoryBreakdownList: document.getElementById('categoryBreakdownList')
};

// Initialization
let isLoginMode = true;

function init() {
    bindEvents();
    checkAuth();
}

async function checkAuth() {
    if (getCurrentUser()) {
        appData = await loadData();
        showAppView();
    } else {
        showAuthView();
    }
}

function showAuthView() {
    els.authView.classList.remove('hidden');
    els.appHeader.classList.add('hidden');
    els.appMain.classList.add('hidden');
    els.btnAddTransaction.classList.add('hidden');
}

function showAppView() {
    els.authView.classList.add('hidden');
    els.appHeader.classList.remove('hidden');
    els.appMain.classList.remove('hidden');
    els.btnAddTransaction.classList.remove('hidden');
    renderAll();
}

function bindEvents() {
    // Auth
    els.btnLogout.addEventListener('click', () => {
        logout();
        checkAuth();
    });
    
    els.btnToggleAuth.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        els.authFormTitle.textContent = isLoginMode ? 'Login' : 'Register';
        els.btnAuthSubmit.textContent = isLoginMode ? 'Login' : 'Register';
        els.authToggleText.textContent = isLoginMode ? "Don't have an account?" : "Already have an account?";
        els.btnToggleAuth.textContent = isLoginMode ? "Register" : "Login";
    });
    
    els.authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const u = els.usernameInput.value.trim();
        const p = els.passwordInput.value.trim();
        if (!u || !p) return showToast("Please fill all fields", "error");
        
        if (isLoginMode) {
            if (await login(u, p)) {
                els.authForm.reset();
                await checkAuth();
            } else {
                showToast("Invalid credentials", "error");
            }
        } else {
            if (await register(u, p)) {
                els.authForm.reset();
                await checkAuth();
                showToast("Account created!", "success");
            } else {
                showToast("Username already taken", "error");
            }
        }
    });

    // Transaction Modal
    els.btnAddTransaction.addEventListener('click', () => openTransactionModal());
    els.btnEmptyStateAdd.addEventListener('click', () => openTransactionModal());
    els.btnCancelTransaction.addEventListener('click', () => els.transactionModal.close());
    els.transactionForm.addEventListener('submit', handleTransactionSubmit);
    
    // Filters
    els.searchTransactions.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        renderTransactions();
    });
    els.filterType.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        renderTransactions();
    });
    
    // Settings & Budget
    els.btnSettings.addEventListener('click', openSettingsModal);
    els.btnCloseSettings.addEventListener('click', () => els.settingsModal.close());
    els.currencySymbol.addEventListener('change', handleCurrencyChange);
    els.btnSetBudget.addEventListener('click', promptSetBudget);
    
    // Data Actions
    els.btnExport.addEventListener('click', exportToCSV);
    els.btnImport.addEventListener('change', handleImport);
    els.btnResetData.addEventListener('click', handleResetData);
}

// Rendering
function renderAll() {
    renderDashboard();
    renderTransactions();
    renderChart();
    renderCategoryBreakdown();
}

function renderDashboard() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let income = 0;
    let expense = 0;
    
    appData.transactions.forEach(txn => {
        const d = new Date(txn.date);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            if (txn.type === 'income') income += txn.amount;
            else expense += txn.amount;
        }
    });
    
    const net = income - expense;
    const sym = appData.settings.currency;
    
    els.netBalance.textContent = formatCurrency(net, sym);
    els.totalIncome.textContent = formatCurrency(income, sym);
    els.totalExpense.textContent = formatCurrency(expense, sym);
    
    // Budget
    els.budgetTotal.textContent = formatCurrency(appData.budget, sym);
    els.budgetSpent.textContent = formatCurrency(expense, sym);
    
    if (appData.budget > 0) {
        const percent = Math.min((expense / appData.budget) * 100, 100);
        els.budgetProgressFill.style.width = `${percent}%`;
        
        if (percent >= 100) {
            els.budgetProgressFill.style.backgroundColor = 'var(--error)';
            els.budgetWarning.textContent = "You have exceeded your monthly budget!";
            els.budgetWarning.classList.remove('hidden');
            els.budgetWarning.classList.add('error');
        } else if (percent >= 80) {
            els.budgetProgressFill.style.backgroundColor = 'var(--warning)';
            els.budgetWarning.textContent = "You are nearing your budget limit!";
            els.budgetWarning.classList.remove('hidden', 'error');
        } else {
            els.budgetProgressFill.style.backgroundColor = 'var(--accent)';
            els.budgetWarning.classList.add('hidden');
        }
    } else {
        els.budgetProgressFill.style.width = '0%';
        els.budgetWarning.classList.add('hidden');
    }
}

function renderTransactions() {
    els.transactionsList.innerHTML = '';
    
    let filtered = appData.transactions.filter(txn => {
        const matchType = currentFilter === 'all' || txn.type === currentFilter;
        const matchSearch = !currentSearch || 
            txn.note.toLowerCase().includes(currentSearch) || 
            txn.category.toLowerCase().includes(currentSearch);
        return matchType && matchSearch;
    });
    
    // Sort descending by date, then by creation time
    filtered.sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date);
        if (dateDiff !== 0) return dateDiff;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    if (filtered.length === 0) {
        els.transactionsList.classList.add('hidden');
        els.emptyState.classList.remove('hidden');
    } else {
        els.transactionsList.classList.remove('hidden');
        els.emptyState.classList.add('hidden');
        
        filtered.forEach(txn => {
            const el = createTransactionElement(txn);
            els.transactionsList.appendChild(el);
        });
    }
}

function createTransactionElement(txn) {
    const sym = appData.settings.currency;
    const isIncome = txn.type === 'income';
    const amountStr = (isIncome ? '+' : '-') + formatCurrency(txn.amount, sym);
    
    const div = document.createElement('div');
    div.className = 'transaction-item';
    
    // Icon logic based on category (simplified)
    const iconLetter = sanitizeHTML(txn.category.charAt(0).toUpperCase());
    
    div.innerHTML = `
        <div class="transaction-info">
            <div class="transaction-icon">${iconLetter}</div>
            <div class="transaction-details">
                <span class="transaction-category">${sanitizeHTML(txn.category)}</span>
                ${txn.note ? `<span class="transaction-note">${sanitizeHTML(txn.note)}</span>` : ''}
            </div>
        </div>
        <div class="transaction-meta">
            <span class="amount-small ${isIncome ? 'success' : ''}">${amountStr}</span>
            <span class="transaction-date">${formatDate(txn.date)}</span>
            <div class="transaction-actions">
                <button class="icon-button btn-edit" aria-label="Edit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="icon-button danger btn-delete" aria-label="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        </div>
    `;
    
    div.querySelector('.btn-edit').addEventListener('click', () => openTransactionModal(txn));
    div.querySelector('.btn-delete').addEventListener('click', () => initiateDelete(txn.id));
    
    return div;
}

// Form Handlers
function openTransactionModal(txn = null) {
    els.transactionForm.reset();
    
    if (txn) {
        els.modalTitle.textContent = 'Edit Transaction';
        els.txnId.value = txn.id;
        document.getElementById(`type${txn.type === 'expense' ? 'Expense' : 'Income'}`).checked = true;
        els.transactionForm.amount.value = txn.amount;
        els.transactionForm.category.value = txn.category;
        els.transactionForm.date.value = txn.date;
        els.transactionForm.note.value = txn.note || '';
    } else {
        els.modalTitle.textContent = 'Add Transaction';
        els.txnId.value = '';
        els.transactionForm.date.value = new Date().toISOString().split('T')[0];
    }
    
    els.transactionModal.showModal();
}

async function handleTransactionSubmit(e) {
    e.preventDefault();
    const fd = new FormData(els.transactionForm);
    
    const txn = {
        id: fd.get('txnId') || generateId(),
        type: fd.get('type'),
        amount: parseFloat(fd.get('amount')),
        category: fd.get('category').trim(),
        date: fd.get('date'),
        note: fd.get('note').trim(),
        updatedAt: new Date().toISOString()
    };
    
    if (!txn.amount || txn.amount <= 0 || !txn.category || !txn.date) {
        showToast("Invalid form data", "error");
        return;
    }

    if (fd.get('txnId')) {
        // Edit existing
        const index = appData.transactions.findIndex(t => t.id === txn.id);
        if (index > -1) {
            txn.createdAt = appData.transactions[index].createdAt;
            appData.transactions[index] = txn;
        }
    } else {
        // Add new
        txn.createdAt = txn.updatedAt;
        appData.transactions.push(txn);
    }
    
    await saveData(appData);
    els.transactionModal.close();
    renderAll();
    showToast("Transaction saved");
}

// Delete with Undo
async function initiateDelete(id) {
    const index = appData.transactions.findIndex(t => t.id === id);
    if (index === -1) return;
    
    // Store temporarily and remove from view
    pendingDeleteTxn = appData.transactions[index];
    appData.transactions.splice(index, 1);
    await saveData(appData);
    renderAll();
    
    // Clear any existing timeout
    if (deleteTimeout) clearTimeout(deleteTimeout);
    
    showToast("Transaction deleted", "info", {
        actionText: "UNDO",
        onAction: async () => {
            if (pendingDeleteTxn) {
                appData.transactions.push(pendingDeleteTxn);
                await saveData(appData);
                renderAll();
                pendingDeleteTxn = null;
                showToast("Transaction restored");
            }
        }
    });
    
    deleteTimeout = setTimeout(() => {
        pendingDeleteTxn = null; // permanently deleted
    }, 5000);
}

// Settings & Budget Handlers
function openSettingsModal() {
    els.currencySymbol.value = appData.settings.currency;
    els.settingsModal.showModal();
}

async function handleCurrencyChange(e) {
    appData.settings.currency = e.target.value.trim() || '₹';
    await saveData(appData);
    renderAll();
}

async function promptSetBudget() {
    const current = appData.budget || 0;
    const input = prompt("Enter monthly budget amount:", current);
    if (input !== null) {
        const val = parseFloat(input);
        if (!isNaN(val) && val >= 0) {
            appData.budget = val;
            await saveData(appData);
            renderDashboard();
        } else {
            showToast("Invalid budget amount", "error");
        }
    }
}

// Data Export/Import/Reset
function exportToCSV() {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Note'];
    const rows = appData.transactions.map(t => [
        t.date,
        t.type,
        `"${t.category.replace(/"/g, '""')}"`,
        t.amount,
        `"${(t.note || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(',') + "\n" 
        + rows.map(e => e.join(',')).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `expense_tracker_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(event) {
        const success = await importData(event.target.result);
        if (success) {
            appData = await loadData();
            renderAll();
            showToast("Data imported successfully", "success");
            els.settingsModal.close();
        } else {
            showToast("Failed to import: invalid format", "error");
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
}

async function handleResetData() {
    if (confirm("Are you sure you want to delete ALL data? This cannot be undone.")) {
        await resetData();
        appData = await loadData();
        renderAll();
        showToast("All data reset", "info");
        els.settingsModal.close();
    }
}

// Toast System
function showToast(message, type = 'info', options = null) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let html = `<span>${sanitizeHTML(message)}</span>`;
    
    if (options && options.actionText) {
        html += `<button class="toast-action">${sanitizeHTML(options.actionText)}</button>`;
    }
    
    toast.innerHTML = html;
    
    if (options && options.onAction) {
        toast.querySelector('.toast-action').addEventListener('click', () => {
            options.onAction();
            removeToast(toast);
        });
    }
    
    els.toastContainer.appendChild(toast);
    
    // Auto remove after 5s unless action is clicked
    setTimeout(() => {
        if (toast.parentElement) {
            removeToast(toast);
        }
    }, 5000);
}

function removeToast(toast) {
    toast.classList.add('hiding');
    toast.addEventListener('animationend', () => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
    });
}

// Simple Native Chart (Spend Trend)
function renderChart() {
    const canvas = els.trendChart;
    const ctx = canvas.getContext('2d');
    
    // Setup responsive canvas size
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Aggregate daily spend
    const dailySpend = new Array(daysInMonth).fill(0);
    appData.transactions.forEach(txn => {
        if (txn.type === 'expense') {
            const d = new Date(txn.date);
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                dailySpend[d.getDate() - 1] += txn.amount;
            }
        }
    });
    
    // Cumulative spend
    let currentTotal = 0;
    const cumulativeSpend = dailySpend.map(spend => {
        currentTotal += spend;
        return currentTotal;
    });
    
    const maxSpend = Math.max(...cumulativeSpend, 1); // Avoid div by 0
    
    // Drawing
    const padding = 10;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;
    
    // Draw grid line for budget if set
    if (appData.budget > 0) {
        const y = padding + height - (Math.min(appData.budget, maxSpend) / maxSpend) * height;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + width, y);
        ctx.strokeStyle = '#333333';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Draw area line
    ctx.beginPath();
    ctx.moveTo(padding, padding + height);
    
    cumulativeSpend.forEach((val, i) => {
        const x = padding + (i / (daysInMonth - 1)) * width;
        const y = padding + height - (val / maxSpend) * height;
        ctx.lineTo(x, y);
    });
    
    // Stroke line
    ctx.strokeStyle = '#4ADE80';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    // Fill area
    ctx.lineTo(padding + width, padding + height);
    ctx.lineTo(padding, padding + height);
    
    const gradient = ctx.createLinearGradient(0, padding, 0, padding + height);
    gradient.addColorStop(0, 'rgba(74, 222, 128, 0.2)');
    gradient.addColorStop(1, 'rgba(74, 222, 128, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();
}

// Handle resize for chart
window.addEventListener('resize', () => {
    // debounce resize
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(renderChart, 200);
});

const CATEGORY_COLORS = {
    'food & dining': '#4ADE80',      // Mint Green
    'transportation': '#60A5FA',     // Blue
    'shopping': '#F87171',           // Red
    'bills & utilities': '#FBBF24',  // Amber/Yellow
    'entertainment': '#C084FC',      // Purple
    'salary': '#34D399',             // Emerald
    'other': '#9CA3AF'               // Gray
};

function renderCategoryBreakdown() {
    els.categoryBreakdownList.innerHTML = '';
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Group monthly expenses by category
    const categoryTotals = {};
    let totalExpense = 0;
    
    appData.transactions.forEach(txn => {
        if (txn.type === 'expense') {
            const d = new Date(txn.date);
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                const cat = txn.category.trim();
                categoryTotals[cat] = (categoryTotals[cat] || 0) + txn.amount;
                totalExpense += txn.amount;
            }
        }
    });
    
    if (totalExpense === 0) {
        els.categoryBreakdownList.innerHTML = `<p class="muted" style="font-size: 0.875rem; text-align: center; padding: var(--space-4) 0;">No expenses logged this month.</p>`;
        return;
    }
    
    // Convert to array and sort descending
    const sortedCategories = Object.entries(categoryTotals)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount);
        
    // Take top 3, and group remaining as "Other"
    const topCategories = [];
    let otherSum = 0;
    
    sortedCategories.forEach((cat, idx) => {
        if (idx < 3) {
            topCategories.push(cat);
        } else {
            otherSum += cat.amount;
        }
    });
    
    if (otherSum > 0) {
        topCategories.push({ name: 'Other', amount: otherSum });
    }
    
    const sym = appData.settings.currency;
    
    topCategories.forEach(cat => {
        const percent = (cat.amount / totalExpense) * 100;
        const color = CATEGORY_COLORS[cat.name.toLowerCase()] || CATEGORY_COLORS['other'];
        
        const item = document.createElement('div');
        item.className = 'category-breakdown-item';
        item.innerHTML = `
            <div class="category-info-row">
                <div class="category-name-group">
                    <span class="category-color-dot" style="background-color: ${color};"></span>
                    <span>${sanitizeHTML(cat.name)}</span>
                    <span class="category-percentage">${percent.toFixed(0)}%</span>
                </div>
                <div class="category-amount-group">
                    ${formatCurrency(cat.amount, sym)}
                </div>
            </div>
            <div class="category-progress-bg">
                <div class="category-progress-fill" style="width: ${percent}%; background-color: ${color};"></div>
            </div>
        `;
        els.categoryBreakdownList.appendChild(item);
    });
}

// Boot
init();
