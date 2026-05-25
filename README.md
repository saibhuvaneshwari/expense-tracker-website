# Smart Budget Manager

A production-quality, offline-capable personal expense tracker built with Vanilla HTML, CSS, and JavaScript.

## Features
- **Offline First**: All data is securely stored in your browser's `localStorage`. No backend required.
- **Transactions CRUD**: Add, edit, and delete income/expenses. Features a 5-second "Undo Delete" capability.
- **Dashboard & Trends**: Track your total balance, monthly budget progress, and view your daily spend trend on a native canvas chart.
- **Budgeting**: Set a monthly budget and get visual warnings when you exceed 80% or 100% of your limit.
- **Data Portability**: Export your transactions to a `.csv` file or Import/Export the entire raw JSON payload for backups.
- **Matte Black Theme**: A sleek, dark-mode-first aesthetic with high-contrast elements and a mint green accent.
- **Responsive & Accessible**: Works perfectly on mobile and desktop. Supports keyboard navigation and respects `prefers-reduced-motion`.

## How to Run
This is a completely static web application. There is no build step or Node runtime required.
1. Download or clone the repository.
2. Open `index.html` directly in any modern web browser.
3. (Optional) Run using a simple static server like `npx serve` or Live Server extension in VS Code.

## Data Schema & Storage Versioning
Data is stored under the `localStorage` key `expenseTracker:data`.

### Schema (Version 1)
```json
{
  "version": 1,
  "settings": {
    "currency": "₹"
  },
  "budget": 50000,
  "transactions": [
    {
      "id": "abc123xy",
      "type": "expense",
      "amount": 150.50,
      "category": "Food & Dining",
      "date": "2026-05-05",
      "note": "Lunch with team",
      "createdAt": "2026-05-05T07:00:00.000Z",
      "updatedAt": "2026-05-05T07:00:00.000Z"
    }
  ]
}
```

### Storage Migrations
The app utilizes a central `migrate(data)` function in `storage.js`. When the app loads data, it checks the `version` property. If the data is from an older schema, it is seamlessly transformed to match the current format before the app initializes.

## Manual Test Checklist
1. **Initial Load**: Open `index.html`. Verify the dashboard is visible, styling is matte-black, and no console errors appear.
2. **Settings Modal**: Click the top-right gear icon. Change the currency symbol to `$` and close. Ensure the dashboard reflects `$` instead of `₹`.
3. **Add Transaction**: Click the bottom right `+` button. Add an Expense of 50 for "Food & Dining". Save. Ensure it appears in the list and the Net Balance/Expense totals update.
4. **Edit Transaction**: Hover over the transaction (or tap on mobile) to reveal the Edit/Delete actions. Click Edit, change the amount to 75, and Save. Ensure the totals and chart update immediately.
5. **Delete & Undo**: Click the Trash icon on the transaction. A toast will appear at the bottom saying "Transaction deleted" with an "UNDO" button.
   - Click "UNDO" within 5 seconds to restore the transaction.
   - Delete again, and wait 5 seconds. Ensure the toast disappears and the transaction is permanently removed.
6. **Budget Warning**: Click "Edit" next to Monthly Budget. Set the budget to 100. Add an expense of 85. The budget progress bar should turn yellow, warning you're nearing the limit. Add another expense of 20. The bar should turn red, indicating you've exceeded it.
7. **Filters**: Add one "Expense" and one "Income". Use the dropdown in the Transactions header to filter by Income only. Verify only the income is visible. Type a keyword into the Search bar and verify filtering works across notes and categories.
8. **Export/Import**: Open Settings, click "Export to CSV", and ensure a valid CSV file downloads.

## Future Improvements
- **Start-of-week Toggle**: Add an option in settings to determine if the week starts on Monday or Sunday for specific weekly summary charts.
- **Multiple Accounts/Wallets**: Track expenses across a Credit Card, Checking Account, and Cash.
- **Advanced Charts**: Introduce a Pie chart for category breakdowns using native SVG drawing.
