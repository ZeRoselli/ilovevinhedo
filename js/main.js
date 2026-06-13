document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("header");
  const hamburger = document.getElementById("hamburger");
  const nav = document.getElementById("nav");

  hamburger.addEventListener("click", () => nav.classList.toggle("nav--open"));
  document.querySelectorAll(".nav__link").forEach(l => l.addEventListener("click", () => nav.classList.remove("nav--open")));
  window.addEventListener("scroll", () => header.classList.toggle("header--scrolled", window.scrollY > 20));

  const newsGrid = document.getElementById("news-grid");
  const imagens = ["vinhedo4.jpg", "vinhedo5.jpg", "vinhedo7.jpg", "vinhedo8.jpg", "vinhedo6.jpg"];
  noticias.forEach((n, i) => {
    const featured = i === 0 ? " news-card--featured" : "";
    const el = document.createElement("a");
    el.href = "#";
    el.className = `news-card${featured}`;
    el.innerHTML = `
      <img src="img/${imagens[i]}" alt="${n.titulo}" class="news-card__image" loading="lazy">
      <div class="news-card__body">
        <div class="news-card__date">${n.data} · ${n.categoria}</div>
        <h3 class="news-card__title">${n.titulo}</h3>
        <p class="news-card__desc">${n.descricao}</p>
      </div>
    `;
    newsGrid.appendChild(el);
  });

  const eventsContainer = document.getElementById("events");
  eventos.forEach(e => {
    const el = document.createElement("div");
    el.className = "event";
    el.innerHTML = `
      <div class="event__date">
        <span class="event__date-day">${e.dia}</span>
        <span class="event__date-month">${e.mes}</span>
      </div>
      <div class="event__info">
        <h3 class="event__title">${e.titulo}</h3>
        <p class="event__desc">${e.descricao}</p>
      </div>
      <span class="event__tag">${e.tag}</span>
    `;
    eventsContainer.appendChild(el);
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = "1";
        e.target.style.transform = "translateY(0)";
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll(".news-card, .event").forEach(el => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = "opacity .6s ease, transform .6s ease";
    observer.observe(el);
  });
});
