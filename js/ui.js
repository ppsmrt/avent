document.getElementById("toggleForm").addEventListener("click", (e) => {
  e.preventDefault();
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const toggleText = document.getElementById("toggleForm");

  if (loginForm.style.display === "none") {
    loginForm.style.display = "block";
    signupForm.style.display = "none";
    toggleText.textContent = "Don't have an account? Sign up";
  } else {
    loginForm.style.display = "none";
    signupForm.style.display = "block";
    toggleText.textContent = "Already have an account? Login";
  }
});