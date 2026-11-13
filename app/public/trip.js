// Load navbar
fetch("/navbar.html")
  .then((response) => {
    return response.text();
  })
  .then((html) => {
    let documentCopy = new DOMParser().parseFromString(html, "text/html");

    let navbar = documentCopy.querySelector("nav");

    document.getElementById("navbar").appendChild(navbar);

    document.getElementById("logout").addEventListener("click", () => {
      fetch("/logout", {
        method: "POST",
      }).then(() => {
        window.location.href = "/login.html";
      });
    });
  })
  .catch((error) => {
    console.log(error);
  });

// Load trip navigation
loadTripNavigation("overview");
