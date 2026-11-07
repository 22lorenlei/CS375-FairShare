let groupMemberInput = document.getElementById("groupMembers");
let addGroupMemberButton = document.getElementById("addGroupMember");
let friendTable = document.getElementById("addedFriends");
let submitTripButton = document.getElementById("submitTripButton");

let tripNameInput = document.getElementById("tripName");
let startDateInput = document.getElementById("startDate");
let endDateInput = document.getElementById("endDate");
let initialBudgetInput = document.getElementById("initialBudget");

let createTripSection = document.getElementById("createTripSection");
let addEventsSection = document.getElementById("addEventsSection");

let costNameInput = document.getElementById("costName");
let categoryInput = document.getElementById("category");
let eventStartDateInput = document.getElementById("eventStartDate");
let eventEndDateInput = document.getElementById("eventEndDate");
let totalCostInput = document.getElementById("totalCost");
let addEventButton = document.getElementById("addEvent");
let locationInput = document.getElementById("location");
let currentEventsTable = document.getElementById("currentEventsTable");

let editCostNameInput = document.getElementById("editCostName");
let editCategoryInput = document.getElementById("editCategory");
let editEventStartDateInput = document.getElementById("editEventStartDate");
let editEventEndDateInput = document.getElementById("editEventEndDate");
let editTotalCostInput = document.getElementById("editTotalCost");
let editAddEventButton = document.getElementById("editAddEvent");
let editLocationInput = document.getElementById("editLocation");

let editEventButton = document.getElementById("editEvent");
let closeEditEventButton = document.getElementById("closeEditEvent");
let editEventModal = document.getElementById("editEventModal");

/*
Somehow we must be able to get the trip name first...
Unless..., we have a unique temporary trip name with a specific number as a dummy placeholder
And when we do get the trip name finalized, we change that trip name placeholder to the desired one
like... dummyValue<numberOfTripsInDB>
*/

let createTripStep = true;
let addEventsStep = false;

function closeEditEventModal() {
	editEventModal.close();
}

function addEvent() {
	let costName = costNameInput.value;
	let category = categoryInput.value;
	let eventStartDate = eventStartDateInput.value;
	let eventEndDate = eventEndDateInput.value;
	let totalCost = totalCostInput.value;
	let locationName = locationInput.value;
	let tripName = tripNameInput.value;

	fetch("/addEvent", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			costName: costName,
			category: category,
			eventStartDate: eventStartDate,
			eventEndDate: eventEndDate,
			totalCost: totalCost,
			locationName: locationName,
			tripName: tripName
		}),
	}).then(response => {
		console.log("Response:", response);
		return response.json();
	}).then(body => {
		console.log("Body:", body);

		if (body.status === "OK") {
			currentEventsTable.textContent = "";
			costNameInput.value = "";
			categoryInput.value = "";
			eventStartDateInput.value = "";
			eventEndDateInput.value = "";
			totalCostInput.value = "";
			locationInput.value = "";

			let contents = body.result.rows;			
			for (let content of contents) {
				console.log(content);
				let tr = document.createElement("tr");
				for (let [key, value] of Object.entries(content)) {
					let td = document.createElement("td");
					td.textContent = value;
					tr.append(td);
				}
				let tdDelete = document.createElement("td");
				let deleteButton = document.createElement("button");
				deleteButton.textContent = "Delete";
				deleteButton.addEventListener('click', () => {
					deleteEvent(content["trip_name"], content["cost_name"], content["category"]);
				});
				tdDelete.append(deleteButton);
				tr.append(tdDelete);
				
				/*
				let tdEdit = document.createElement("td");
				let editButton = document.createElement("button");
				editButton.textContent = "Edit";
				editButton.addEventListener('click', () => {
					editEvent(tripName, costName, category);
				});
				tr.append(tdEdit);
				*/

				currentEventsTable.append(tr);
			}
		} else {
			console.log(body.status);
		}
	});
}

function editEvent(tripName, costName, category) {
	editEventModal.showModal();
	fetch("/editEvent", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			tripName: tripName,
			costName: costName,
			category: category
		}),
	}).then(response => {
		console.log("Response:", response);
		return response.json();
	}).then(body => {
		console.log("Body:", body);
		if (body.status === "OK") {
			let contents = body.rows;
			let content = contents[0];
			
			let costName = content.cost_name;
			let category = content.category;
			let totalPrice = content.total_price;
			let startDate = content.start_date;
			let endDate = content.end_date;
			let locationName = content["location"];

			editCostNameInput.value = costName;
			editCategoryInput.value = category;
			editEventStartDateInput.value = startDate;
			editEventEndDateInput.value = endDate;
			editTotalCostInput.value = totalPrice;
			editLocationInput.value = locationName;
		}
	});
}

function deleteEvent(tripName, costName, category) {
	fetch("/deleteEvent", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			tripName: tripName,
			costName: costName,
			category: category,
		}),
	}).then(response => {
		console.log("Response:", response);
		return response.json();
	}).then(body => {
		console.log("Body:", body);
		if (body.status === "OK") {
			currentEventsTable.textContent = "";
			let contents = body.result.rows;			
			for (let content of contents) {
				console.log(content);
				let tr = document.createElement("tr");
				for (let [key, value] of Object.entries(content)) {
					let td = document.createElement("td");
					td.textContent = value;
					tr.append(td);
				}
				let tdDelete = document.createElement("td");
				let deleteButton = document.createElement("button");
				deleteButton.textContent = "Delete";
				deleteButton.addEventListener('click', () => {
					deleteEvent(content["trip_name"], content["cost_name"], content["category"]);
				});
				tdDelete.append(deleteButton);
				tr.append(tdDelete);
			
				/*
				let tdEdit = document.createElement("td");
				let editButton = document.createElement("button");
				editButton.textContent = "Edit";
				editButton.addEventListener('click', () => {
					editEvent(tripName, costName, category);
				});
				tr.append(tdEdit);
				*/

				currentEventsTable.append(tr);
			}
		} else {
			console.log(body.status);
		}
	});
}

function createTripSubmit() {
	let tripName = tripNameInput.value;
	let startDate = startDateInput.value;
	let endDate = endDateInput.value;
	let initialBudget = initialBudgetInput.value;

	fetch("/createTrip", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			tripName: tripName,
			startDate: startDate,
			endDate: endDate,
			initialBudget: initialBudget
		}),
	}).then(response => {
		console.log("Response:", response);
		return response.json();
	}).then(body => {
		console.log("Body YOOOOO:", body);
		console.log(body.status);
		if (body.status === "OK") {
			createTripStep = false;
			addEventsStep = true;
			console.log("HERE?");
			addEventsSection.classList.remove('grayed-out-container');
			createTripSection.classList.add('grayed-out-container');
		} else {
			console.log(body.status);
		}
	});
}

function addNewGroupMember() {
	let groupMemberName = groupMemberInput.value;
	let tripName = "DUMMY"; 
	fetch("/addGroupMember", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			username: groupMemberName,
			tripName: tripName,
			isOwner: false
		}),
	}).then(response => {
		console.log("Response:", response);
		return response.json();
	}).then(body => {
		console.log("Body:", body);
		friendTable.textContent = "";
		let contents = body.rows;
		console.log(contents);
		for (let content of contents) {
			let tr = document.createElement("tr");
			let tdUser = document.createElement("td");
			tdUser.textContent = content.username;
			let tdDelete = document.createElement("td");
			let deleteButton = document.createElement("button");
			deleteButton.textContent = "Delete";

			let tripName = content.trip_name;
			let username = content.username;

			deleteButton.addEventListener('click', () => {
				deleteGroupMember(tripName, username);
			});
			tdDelete.append(deleteButton);
			tr.append(tdUser);
			tr.append(tdDelete);
			friendTable.append(tr);
		}
	});
}

function deleteGroupMember(tripName, username) {
	console.log("Event Name:", tripName, "User Name:", username);
	fetch("/deleteGroupMember", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			tripName: tripName,
			username: username
		}),
	}).then(response => {
		console.log("Response:", response);
		return response.json();
	}).then(body => {
		console.log("Body after delete:", body);
		friendTable.textContent = "";
		let contents = body.rows;
		console.log(contents);
		for (let content of contents) {
			console.log("do i get here");
			let tr = document.createElement("tr");
			let tdUser = document.createElement("td");
			tdUser.textContent = content.username;
			let tdDelete = document.createElement("td");
			let deleteButton = document.createElement("button");

			let tripName = content.trip_name;
			let username = content.username;

			deleteButton.textContent = "Delete";
			deleteButton.addEventListener('click', () => {
				deleteGroupMember(tripName, username);
			});
			tdDelete.append(deleteButton);
			tr.append(tdUser);
			tr.append(tdDelete);
			friendTable.append(tr);
		}
	});
}

addGroupMemberButton.addEventListener("click", addNewGroupMember);
submitTripButton.addEventListener("click", createTripSubmit);
addEventButton.addEventListener("click", addEvent);
closeEditEventButton.addEventListener("click", closeEditEventModal);
