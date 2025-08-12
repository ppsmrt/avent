document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const showSignup = document.getElementById("showSignup");
  const showLogin = document.getElementById("showLogin");

  showSignup.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.classList.remove("form-active");
    loginForm.classList.add("form-hidden");
    signupForm.classList.remove("form-hidden");
    signupForm.classList.add("form-active");
  });

  showLogin.addEventListener("click", (e) => {
    e.preventDefault();
    signupForm.classList.remove("form-active");
    signupForm.classList.add("form-hidden");
    loginForm.classList.remove("form-hidden");
    loginForm.classList.add("form-active");
  });
});