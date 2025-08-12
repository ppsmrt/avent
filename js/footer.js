// footer.js
const footerHTML = `
<footer class="footer">
  <div class="footer-left">
    © <span id="year"></span> Avanta. All Rights Reserved.
  </div>
  <div class="footer-center">
    <a href="privacy.html">Privacy Policy</a>
    <a href="terms.html">Terms</a>
    <a href="support.html">Support</a>
  </div>
  <div class="footer-right">
    <a href="#"><img src="assets/icons/linkedin.svg" alt="LinkedIn" /></a>
    <a href="#"><img src="assets/icons/twitter.svg" alt="Twitter" /></a>
  </div>
</footer>
`;

document.addEventListener("DOMContentLoaded", () => {
  document.body.insertAdjacentHTML("beforeend", footerHTML);
  document.getElementById("year").textContent = new Date().getFullYear();
});