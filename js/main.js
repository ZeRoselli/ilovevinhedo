document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("header");
  const hamburger = document.getElementById("hamburger");
  const nav = document.getElementById("nav");

  hamburger.addEventListener("click", () => nav.classList.toggle("nav--open"));
  document.querySelectorAll(".nav__link").forEach(l => l.addEventListener("click", () => nav.classList.remove("nav--open")));
  window.addEventListener("scroll", () => header.classList.toggle("header--scrolled", window.scrollY > 20));

  const newsGrid = document.getElementById("news-grid");
  const imagens = ["vinhedo10.jpg", "vinhedo7.jpg", "vinhedo8.jpg", "vinhedo9.jpg", "vinhedo4.jpg"];
  noticias.forEach((n, i) => {
    const featured = i === 0 ? " news-card--featured" : "";
    const el = document.createElement("a");
    el.href = "#";
    el.className = `news-card${featured}`;
    el.innerHTML = `
      <img src="img/${imagens[i] || imagens[0]}" alt="${n.titulo}" class="news-card__image" loading="lazy">
      <div class="news-card__body">
        <div class="news-card__date">${n.data} · ${n.categoria}</div>
        <h3 class="news-card__title">${n.titulo}</h3>
        <p class="news-card__desc">${n.descricao}</p>
      </div>
    `;
    newsGrid.appendChild(el);
  });

  const eventsTrack = document.getElementById("eventsTrack");
  const coresEventos = [
    "linear-gradient(135deg, #667eea, #764ba2)",
    "linear-gradient(135deg, #f093fb, #f5576c)",
    "linear-gradient(135deg, #4facfe, #00f2fe)",
    "linear-gradient(135deg, #43e97b, #38f9d7)",
    "linear-gradient(135deg, #fa709a, #fee140)"
  ];
  eventos.forEach((e, i) => {
    const el = document.createElement("div");
    el.className = "event-card";
    el.innerHTML = `
      <div class="event-card__image">
        <div class="event-card__image-bg" style="background:${coresEventos[i % coresEventos.length]}"></div>
        <div class="event-card__image-overlay"></div>
        <div class="event-card__date">
          <span class="event-card__date-day">${e.dia}</span>
          <span class="event-card__date-month">${e.mes}</span>
        </div>
      </div>
      <div class="event-card__body">
        <h3 class="event-card__title">${e.titulo}</h3>
        <p class="event-card__desc">${e.descricao}</p>
        <span class="event-card__tag">${e.tag}</span>
      </div>
    `;
    eventsTrack.appendChild(el);
  });

  document.querySelector('.carousel__btn--next').addEventListener('click', () => {
    eventsTrack.scrollBy({ left: 344, behavior: 'smooth' });
  });
  document.querySelector('.carousel__btn--prev').addEventListener('click', () => {
    eventsTrack.scrollBy({ left: -344, behavior: 'smooth' });
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
  document.querySelectorAll(".news-card, .event-card, .guia-card, .stat").forEach(el => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = "opacity .6s ease, transform .6s ease";
    observer.observe(el);
  });

  let slideIndex = 0;
  const slides = document.querySelectorAll('.hero__slide');
  if (slides.length > 1) {
    setInterval(() => {
      slides[slideIndex].classList.remove('hero__slide--active');
      slideIndex = (slideIndex + 1) % slides.length;
      slides[slideIndex].classList.add('hero__slide--active');
    }, 6000);
  }

  const hero = document.getElementById('hero');
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    if (hero && scrolled < window.innerHeight) {
      const activeSlide = document.querySelector('.hero__slide--active');
      if (activeSlide) {
        activeSlide.style.transform = `scale(${1.1 - scrolled * 0.0003})`;
      }
    }
  });

  const statObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const target = parseInt(el.dataset.target);
        const isK = el.classList.contains('stat__number--k');
        const duration = 2000;
        const start = performance.now();
        function update(current) {
          const progress = Math.min((current - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = Math.floor(eased * target);
          el.textContent = value;
          if (isK) el.classList.add('stat__number--k');
          if (progress < 1) requestAnimationFrame(update);
          else { el.textContent = target; if (isK) el.classList.add('stat__number--k'); }
        }
        requestAnimationFrame(update);
        statObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat__number').forEach(el => statObserver.observe(el));
});
