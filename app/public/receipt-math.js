// Shared by the form preview and server. Amounts are calculated in whole cents.
(function (root) {
    function moneyCents(value) {
        if (typeof value !== "string" || !/^\d{1,8}(\.\d{1,2})?$/.test(value)) {
            throw new Error("Enter amounts with at most two decimal places.");
        }

        let parts = value.split(".");
        let dollars = Number(parts[0]) * 100;
        let cents = Number((parts[1] || "").padEnd(2, "0"));

        return dollars + cents;
    }

    function calculate(items) {
        if (!Array.isArray(items) || !items.length || items.length > 100) {
            throw new Error("Add between 1 and 100 items.");
        }

        let subtotal = 0;
        let normalized = items.map(function (item) {
            if (!item ||
                typeof item.name !== "string" ||
                !item.name.trim() ||
                item.name.length > 150 ||
                !Number.isInteger(item.quantity) ||
                item.quantity < 1 ||
                item.quantity > 999) {
                throw new Error("Every item needs a name and quantity between 1 and 999.");
            }

            let unit = moneyCents(item.unitPrice);

            if (unit <= 0) {
                throw new Error("Item prices must be greater than zero.");
            }

            let total = unit * item.quantity;
            subtotal += total;

            return {
                name: item.name.trim(),
                quantity: item.quantity,
                unitPrice: (unit / 100).toFixed(2),
                totalCents: total
            };
        });

        if (subtotal > 9999999999) {
            throw new Error("Receipt total cannot exceed $99,999,999.99.");
        }

        return {
            items: normalized,
            subtotalCents: subtotal,
            totalCents: subtotal
        };
    }

    let api = { calculate, moneyCents };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    } else {
        root.ReceiptMath = api;
    }
})(typeof window !== "undefined" ? window : globalThis);
