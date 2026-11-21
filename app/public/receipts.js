let receiptParams = new URLSearchParams(window.location.search);
let tripId = receiptParams.get("tripId") || receiptParams.get("id");
let tripData;
let money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
});

let pageMessage = document.getElementById("pageMessage");
let editor = document.getElementById("receiptEditor");
let viewer = document.getElementById("receiptViewer");
let receiptForm = document.getElementById("receiptForm");
let itemsDiv = document.getElementById("receiptItems");
let formMessage = document.getElementById("receiptFormMessage");
let saving = false;

// Helpers for creating receipt content safely.
function element(tag, text, className) {
    let node = document.createElement(tag);

    if (text !== undefined) {
        node.textContent = text;
    }

    if (className) {
        node.className = className;
    }

    return node;
}

function username(id) {
    let member = tripData.members.find(function (person) {
        return person.id === Number(id);
    });

    return member ? member.username : "Former member";
}

function dollars(cents) {
    return money.format(cents / 100);
}

function dateText(date) {
    return new Date(date + "T00:00:00").toLocaleDateString("en-US");
}

function apiPath(id) {
    return "/trips/" + tripId + "/receipts" + (id ? "/" + id : "");
}

function action(text, handler, className) {
    let button = element("button", text, className || "view-button");
    button.type = "button";
    button.addEventListener("click", handler);
    return button;
}

function labeled(text, input) {
    let label = element("label", text);
    label.appendChild(input);
    return label;
}

async function request(url, options) {
    let response = await fetch(url, options);

    if (response.status === 401) {
        window.location.replace("/login.html");
        throw new Error("Please log in again.");
    }

    let data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Could not load receipts.");
    }

    return data;
}

// Load the shared navbar and connect Log Out.
fetch("/navbar.html")
.then(function (response) {
    if (!response.ok) {
        throw new Error("Could not load navigation.");
    }

    return response.text();
})
.then(function (html) {
    let documentCopy = new DOMParser().parseFromString(html, "text/html");
    let nav = documentCopy.querySelector("nav");
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
.catch(function (error) {
    pageMessage.textContent = error.message;
});

// Display the trip's saved receipts.
async function loadReceipts() {
    let data = await request(apiPath());
    let list = document.getElementById("receiptList");
    list.replaceChildren();

    pageMessage.textContent = data.receipts.length
        ? ""
        : "No receipts yet. Add your first receipt.";

    data.receipts.forEach(function (receipt) {
        let card = element("article", undefined, "receipt-panel receipt-card");
        let info = element("div");
        let description = dateText(receipt.date) + " · " + receipt.category +
            " · Paid by " + receipt.payer;

        info.append(
            element("h3", receipt.title),
            element("p", description)
        );

        let controls = element("div", undefined, "receipt-card-actions");
        let viewButton = action("View Receipt", function () {
            openReceipt(receipt.id);
        });

        controls.append(
            element("strong", money.format(Number(receipt.total))),
            viewButton
        );

        card.append(info, controls);
        list.appendChild(card);
    });
}

function itemValues() {
    return Array.from(itemsDiv.children).map(function (row) {
        return {
            name: row.querySelector('[data-field="name"]').value.trim(),
            quantity: Number(row.querySelector('[data-field="quantity"]').value),
            unitPrice: row.querySelector('[data-field="price"]').value
        };
    });
}

function summary(data, container) {
    container.appendChild(element("h3", "Receipt total"));

    let totals = element("dl", undefined, "receipt-totals");
    totals.append(
        element("dt", "Total"),
        element("dd", dollars(data.totalCents))
    );

    container.appendChild(totals);
}

function makeTable(headers, rows) {
    let scroll = element("div", undefined, "receipt-table-scroll");
    let table = element("table");
    let head = element("thead");
    let header = element("tr");
    let body = element("tbody");

    headers.forEach(function (text) {
        header.appendChild(element("th", text));
    });
    head.appendChild(header);

    rows.forEach(function (values) {
        let row = element("tr");

        values.forEach(function (text) {
            row.appendChild(element("td", text));
        });

        body.appendChild(row);
    });

    table.append(head, body);
    scroll.appendChild(table);
    return scroll;
}

function updatePreview() {
    let preview = document.getElementById("receiptPreview");
    preview.replaceChildren();

    try {
        let totals = ReceiptMath.calculate(itemValues());
        summary(totals, preview);
    } catch (error) {
        preview.appendChild(element("p", error.message, "receipt-muted"));
    }
}

// Add a blank item row to the receipt form.
function addItem() {
    if (itemsDiv.children.length >= 100) {
        formMessage.textContent = "Maximum 100 items.";
        return;
    }

    let row = element("fieldset", undefined, "receipt-item");
    row.appendChild(element("legend", "Receipt item"));

    let fields = element("div", undefined, "receipt-item-fields");
    let inputs = [
        { label: "Item name", field: "name", type: "text", value: "" },
        { label: "Quantity", field: "quantity", type: "number", value: "1" },
        { label: "Price per item ($)", field: "price", type: "number", value: "" }
    ];

    inputs.forEach(function (entry) {
        let input = document.createElement("input");
        input.type = entry.type;
        input.dataset.field = entry.field;
        input.value = entry.value;
        input.required = true;

        if (entry.field === "name") {
            input.maxLength = 150;
        } else if (entry.field === "quantity") {
            input.min = "1";
            input.max = "999";
            input.step = "1";
        } else {
            input.min = "0.01";
            input.max = "99999999.99";
            input.step = "0.01";
        }

        fields.appendChild(labeled(entry.label, input));
    });

    let removeButton = action("Remove Item", function () {
        row.remove();
        updatePreview();
    }, "receipt-delete");

    row.append(fields, removeButton);
    itemsDiv.appendChild(row);
    updatePreview();
}

function showEditor() {
    receiptForm.reset();
    itemsDiv.replaceChildren();
    formMessage.textContent = "";

    let today = new Date();
    let year = today.getFullYear();
    let month = String(today.getMonth() + 1).padStart(2, "0");
    let day = String(today.getDate()).padStart(2, "0");
    document.getElementById("receiptDate").value = year + "-" + month + "-" + day;

    let payer = document.getElementById("receiptPaidBy");
    payer.replaceChildren();

    tripData.members.forEach(function (member) {
        let option = element("option", member.username);
        option.value = member.id;
        payer.appendChild(option);
    });

    payer.value = tripData.userId;
    addItem();
    editor.showModal();
}

document.getElementById("addReceipt").addEventListener("click", function () {
    if (tripData) {
        showEditor();
    }
});

document.getElementById("addReceiptItem").addEventListener("click", addItem);

document.getElementById("closeReceiptEditor").addEventListener("click", function () {
    if (!saving) {
        editor.close();
    }
});

document.getElementById("closeReceiptViewer").addEventListener("click", function () {
    viewer.close();
});

editor.addEventListener("cancel", function (event) {
    if (saving) {
        event.preventDefault();
    }
});

receiptForm.addEventListener("input", updatePreview);

// Save the receipt and let the server create its linked expense.
receiptForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (saving) {
        return;
    }

    formMessage.textContent = "";
    let button = document.getElementById("saveReceipt");

    try {
        ReceiptMath.calculate(itemValues());
        saving = true;
        button.disabled = true;

        let body = {
            title: document.getElementById("receiptTitle").value.trim(),
            date: document.getElementById("receiptDate").value,
            category: document.getElementById("receiptCategory").value,
            paidBy: Number(document.getElementById("receiptPaidBy").value),
            items: itemValues()
        };

        let result = await request(apiPath(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        editor.close();

        try {
            await loadReceipts();
            await openReceipt(result.id);
        } catch (error) {
            pageMessage.textContent = "Receipt saved. Reload to refresh receipts.";
        }
    } catch (error) {
        formMessage.textContent = error.message;
    } finally {
        saving = false;
        button.disabled = false;
    }
});

async function openReceipt(id) {
    try {
        let receipt = await request(apiPath(id));
        let details = document.getElementById("receiptDetails");
        details.replaceChildren();

        let title = element("h2", receipt.title);
        title.id = "receiptViewTitle";

        let description = dateText(receipt.date) + " · " + receipt.category +
            " · Paid by " + username(receipt.paid_by);
        details.append(title, element("p", description, "receipt-muted"));

        let rows = receipt.items.map(function (item) {
            return [
                item.name,
                item.quantity,
                money.format(Number(item.unitPrice)),
                dollars(item.totalCents)
            ];
        });

        details.appendChild(makeTable(["Item", "Qty", "Unit price", "Total"], rows));
        summary(receipt.breakdown, details);

        if (!viewer.open) {
            viewer.showModal();
        }
    } catch (error) {
        pageMessage.textContent = error.message;
    }
}

async function initialize() {
    if (!tripId ||
        !/^\d+$/.test(tripId) ||
        !Number.isSafeInteger(Number(tripId)) ||
        Number(tripId) < 1) {
        pageMessage.textContent = "Choose a trip from My Trips to continue.";
        return;
    }

    receiptParams.set("tripId", tripId);
    history.replaceState(null, "", location.pathname + "?" + receiptParams.toString());
    loadTripNavigation("receipts");

    try {
        tripData = await request("/trips/" + tripId);
        document.title = "FairShare - " + tripData.trip.name + " Receipts";
        document.getElementById("addReceipt").disabled = false;
        await loadReceipts();

        let receiptId = receiptParams.get("receiptId");

        if (receiptId && /^\d+$/.test(receiptId)) {
            await openReceipt(receiptId);
        }
    } catch (error) {
        pageMessage.textContent = error.message;
    }
}

initialize();
