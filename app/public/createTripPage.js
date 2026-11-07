let groupMemberInput = document.getElementById("groupMembers");
let addGroupMemberButton = document.getElementById("addGroupMember");
let friendTable = document.getElementById("addedFriends");

/*
Somehow we must be able to get the trip name first...
Unless..., we have a unique temporary trip name with a specific number as a dummy placeholder
And when we do get the trip name finalized, we change that trip name placeholder to the desired one
like... dummyValue<numberOfTripsInDB>
*/

function addNewGroupMember() {
	let groupMemberName = groupMemberInput.value;
	let eventName = "DUMMY"; 
	fetch("/addGroupMember", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			username: groupMemberName,
			eventName: eventName,
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

			let eventName = content.event_name;
			let username = content.username;

			deleteButton.addEventListener('click', () => {
				deleteGroupMember(eventName, username);
			});
			tdDelete.append(deleteButton);
			tr.append(tdUser);
			tr.append(tdDelete);
			friendTable.append(tr);
		}
	});
}

function deleteGroupMember(eventName, username) {
	console.log("Event Name:", eventName, "User Name:", username);
	fetch("/deleteGroupMember", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			eventName: eventName,
			username: username,
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

			let eventName = content.event_name;
			let username = content.username;

			deleteButton.textContent = "Delete";
			deleteButton.addEventListener('click', () => {
				deleteGroupMember(eventName, username);
			});
			tdDelete.append(deleteButton);
			tr.append(tdUser);
			tr.append(tdDelete);
			friendTable.append(tr);
		}
	});
} 

addGroupMemberButton.addEventListener("click", addNewGroupMember);
