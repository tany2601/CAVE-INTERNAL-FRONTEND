// Runs before first paint (loaded as a blocking script from index.html, kept as a file so the page
// needs no inline scripts and can use a strict Content-Security-Policy).
try {
  // Light theme is for the dashboards only, so it applies at launch only to a signed-in session that
  // was last on a dashboard screen (sign-in and check-in are always dark).
  var s = sessionStorage.getItem("cave-screen");
  var signedIn = !!sessionStorage.getItem("cave-auth");
  if (localStorage.getItem("cave-theme") === "light" && signedIn && s !== "welcome") {
    document.documentElement.dataset.theme = "light";
  }
} catch (e) {}
