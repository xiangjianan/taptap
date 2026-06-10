const activeShot = document.querySelector("#active-shot");
const shotButtons = document.querySelectorAll(".shot-button");

shotButtons.forEach((button) => {
  button.addEventListener("click", () => {
    shotButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");

    activeShot.src = button.dataset.shot;
    activeShot.alt = button.dataset.alt;
  });
});

const revealItems = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const header = document.querySelector(".site-header");

window.addEventListener(
  "scroll",
  () => {
    header.classList.toggle("is-scrolled", window.scrollY > 20);
  },
  { passive: true }
);
