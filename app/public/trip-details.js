let expenseParams = new URLSearchParams(window.location.search);
let tripId = expenseParams.get("tripId") || expenseParams.get("id");
if (tripId) {
    expenseParams.set("tripId", tripId);
    window.history.replaceState(null, "", window.location.pathname + "?" + expenseParams.toString());
    loadTripNavigation("expenses");
}
let tripData;
let expenses = [];
let showAll = false;
let modal = document.getElementById("expenseModal");
let form = document.getElementById("expenseForm");
let pageMessage = document.getElementById("pageMessage");
let money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

async function request(url, options) {
    let response = await fetch(url, options);
    if (response.status === 401) {
        window.location.replace("/login.html");
        throw new Error("Please log in again");
    }
    let data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load trip");
    return data;
}

fetch("/navbar.html")
.then(function (response) {
    if (!response.ok) throw new Error("Could not load navigation");
    return response.text();
})
.then(function (html) {
    let nav = new DOMParser().parseFromString(html, "text/html").querySelector("nav");
    document.getElementById("navbar").appendChild(nav);
    document.getElementById("logout").addEventListener("click", async function () {
        this.disabled = true;
        try {
            await request("/logout", { method: "POST" });
            window.location.replace("/login.html");
        } catch (error) {
            pageMessage.textContent = error.message;
            this.disabled = false;
        }
    });
})
.catch(function (error) { pageMessage.textContent = error.message; });

async function loadTrip() {
    if (!tripId || !/^\d+$/.test(tripId) || !Number.isSafeInteger(Number(tripId)) || Number(tripId) < 1) {
        pageMessage.textContent = "Choose a trip from My Trips to continue.";
        return;
    }
    try {
        tripData = await request("/trips/" + tripId);
        document.title = "FairShare - " + tripData.trip.name;
        tripData.members.forEach(function (member) {
            let option = document.createElement("option");
            option.value = member.id;
            option.textContent = member.username;
            document.getElementById("expensePayer").appendChild(option);
        });
        await loadExpenses();
        document.getElementById("expensesSection").hidden = false;
    } catch (error) { pageMessage.textContent = error.message; }
}

async function loadExpenses() {
    let data = await request("/trips/" + tripId + "/expenses");
    expenses = data.expenses;
    renderExpenses();
}
function cents(amount) { return Math.round(Number(amount) * 100); }
function renderExpenses() {
    let spent = expenses.reduce(function (sum, expense) { return sum + cents(expense.amount); }, 0);
    let budget = cents(tripData.trip.starting_budget);
    document.getElementById("totalBudget").textContent = money.format(budget / 100);
    document.getElementById("totalSpent").textContent = money.format(spent / 100);
    document.getElementById("remaining").textContent = money.format((budget - spent) / 100);
    document.getElementById("remaining").classList.toggle("over-budget", spent > budget);
    let categories = document.getElementById("categories");
    categories.replaceChildren();
    let categoryNames = ["Lodging", "Food", "Transportation", "Activities", "Other"];
    for (let i = 0; i < expenses.length; i++) {
        if (!categoryNames.includes(expenses[i].category)) {
            categoryNames.push(expenses[i].category);
        }
    }
    let categoryOptions = document.getElementById("expenseCategoryOptions");
    categoryOptions.replaceChildren();
    for (let i = 0; i < categoryNames.length; i++) {
        let option = document.createElement("option");
        option.value = categoryNames[i];
        categoryOptions.appendChild(option);
    }
    categoryNames.forEach(function (category) {
        let total = expenses.filter(function (expense) { return expense.category === category; })
            .reduce(function (sum, expense) { return sum + cents(expense.amount); }, 0);
        let row = document.createElement("div");
        row.className = "category-row";
        let label = document.createElement("span");
        label.textContent = category;
        let value = document.createElement("span");
        value.textContent = money.format(total / 100);
        row.append(label, value);
        categories.appendChild(row);
    });
    let rows = document.getElementById("expenseRows");
    rows.replaceChildren();
    (showAll ? expenses : expenses.slice(0, 3)).forEach(function (expense) {
        let row = document.createElement("tr");
        let date = new Date(expense.expense_date + "T00:00:00");
        [expense.expense_date ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not set",
            expense.description, expense.category, expense.amount == null ? "Price unavailable" : money.format(Number(expense.amount)), expense.paid_by_username]
        .forEach(function (text) {
            let cell = document.createElement("td");
            cell.textContent = text;
            row.appendChild(cell);
        });
        let actions = document.createElement("td");
        if (expense.source === "event") {
            let link = document.createElement("a");
            link.href = "/itinerary.html?tripId=" + encodeURIComponent(tripId);
            link.textContent = "Manage in itinerary";
            actions.appendChild(link);
            row.appendChild(actions);
            rows.appendChild(row);
            return;
        }
        let button = document.createElement("button");
        button.type = "button";
        button.className = "delete-expense";
        button.textContent = "Delete";
        button.setAttribute("aria-label", "Delete expense: " + expense.description);
        button.addEventListener("click", async function () {
            if (!window.confirm('Delete "' + expense.description + '"? This cannot be undone.')) return;
            button.disabled = true;
            pageMessage.textContent = "";
            try {
                await request("/trips/" + tripId + "/expenses/" + expense.id, { method: "DELETE" });
                expenses = expenses.filter(function (item) { return item.source !== expense.source || item.id !== expense.id; });
                renderExpenses();
            } catch (error) {
                pageMessage.textContent = error.message;
                button.disabled = false;
            }
        });
        actions.appendChild(button);
        row.appendChild(actions);
        rows.appendChild(row);
    });
    document.getElementById("emptyExpenses").hidden = expenses.length > 0;
    document.getElementById("expenseTable").hidden = expenses.length === 0;
    document.getElementById("expensesHeading").textContent = showAll ? "All Expenses" : "Recent Expenses";
    document.getElementById("viewAllExpenses").hidden = expenses.length <= 3;
    document.getElementById("viewAllExpenses").textContent = showAll ? "Show Recent Expenses" : "View All Expenses";
}

document.getElementById("viewAllExpenses").addEventListener("click", function () {
    showAll = !showAll;
    renderExpenses();
});
document.getElementById("openExpense").addEventListener("click", function () {
    form.reset();
    document.getElementById("expenseMessage").textContent = "";
    document.getElementById("expensePayer").value = tripData.userId;
    let today = new Date();
    document.getElementById("expenseDate").value = today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    modal.showModal();
});
document.getElementById("closeExpense").addEventListener("click", function () { modal.close(); });
modal.addEventListener("click", function (event) {
    let rect = modal.getBoundingClientRect();
    if (event.target === modal && (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom)) modal.close();
});
form.addEventListener("submit", async function (event) {
    event.preventDefault();
    let button = document.getElementById("saveExpense");
    let message = document.getElementById("expenseMessage");
    message.textContent = "";
    button.disabled = true;
    try {
        await request("/trips/" + tripId + "/expenses", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                description: document.getElementById("expenseDescription").value.trim(),
                category: document.getElementById("expenseCategory").value.trim(),
                amount: document.getElementById("expenseAmount").value,
                date: document.getElementById("expenseDate").value,
                paidBy: Number(document.getElementById("expensePayer").value)
            })
        });
    } catch (error) {
        message.textContent = error.message;
        button.disabled = false;
        return;
    }
    modal.close();
    button.disabled = false;
    pageMessage.textContent = "";
    try { await loadExpenses(); }
    catch (error) { pageMessage.textContent = "Expense saved. Reload the page to refresh totals."; }
});
loadTrip();
