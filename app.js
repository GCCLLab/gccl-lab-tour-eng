/**
 * GCCL Interactive Lab Tour — V3.3
 * Single Lab Tour page with Company Overview + Map + Contact integrated.
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------
  // View switching (landing / tour)
  // ---------------------------------------------------------------
  const views = {
    landing: document.getElementById("view-landing"),
    tour: document.getElementById("view-tour"),
  };

  function showView(name) {
    Object.entries(views).forEach(([key, el]) => {
      el.classList.toggle("is-active", key === name);
    });
    window.scrollTo({ top: 0, behavior: "auto" });
    if (name === "tour") {
      // the tour view is display:none until now, so map box has no size yet —
      // wait a frame for layout, then fit the map to the available space.
      requestAnimationFrame(fitMapFrame);
    }
  }

  document.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.goto));
  });

  // Start Tour goes straight to the Lab Tour screen
  document.getElementById("btn-start-tour").addEventListener("click", () => showView("tour"));

  // ---------------------------------------------------------------
  // Populate Company Overview (displayed at top of Lab Tour)
  // ---------------------------------------------------------------
  function renderOverview() {
    const d = GCCL_DATA.overview;
    document.getElementById("overview-title").textContent = d.name;
    document.getElementById("overview-video").src = d.video;
    document.getElementById("overview-description").textContent = d.description;
    const list = document.getElementById("overview-materials");
    list.innerHTML = "";
    d.materials.forEach((m) => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${m.url}" target="_blank" rel="noopener">${m.label}</a>`;
      list.appendChild(li);
    });
  }

  // ---------------------------------------------------------------
  // Populate Contact section
  // ---------------------------------------------------------------
  function renderContact() {
    const c = GCCL_DATA.contact;
    document.getElementById("contact-heading").textContent = c.heading;
    document.getElementById("contact-description").textContent = c.description;
    const cta = document.getElementById("contact-cta");
    cta.textContent = c.ctaLabel;
    cta.href = c.ctaUrl;
    document.getElementById("modal-contact").href = c.ctaUrl;

    const footer = document.getElementById("footer-links");
    footer.innerHTML = "";
    GCCL_DATA.links.forEach((l) => {
      const a = document.createElement("a");
      a.href = l.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = l.label;
      footer.appendChild(a);
    });
  }

  // ---------------------------------------------------------------
  // Map sizing — JS measures the available box and sets the map-frame's
  // width/height in px so it always matches the image's true aspect
  // ratio. This keeps the % based SVG hotspot overlay pixel-accurate.
  // ---------------------------------------------------------------
  const mapImage = document.getElementById("map-image");
  const mapFrame = document.getElementById("map-frame");
  const mapViewport = document.getElementById("map-viewport");

  function fitMapFrame() {
    if (!mapImage.naturalWidth) return;
    const aspect = mapImage.naturalWidth / mapImage.naturalHeight;
    const vw = mapViewport.clientWidth;
    const vh = mapViewport.clientHeight;
    if (!vw || !vh) return;
    let w = vw;
    let h = w / aspect;
    if (h > vh) {
      h = vh;
      w = h * aspect;
    }
    mapFrame.style.width = `${Math.round(w)}px`;
    mapFrame.style.height = `${Math.round(h)}px`;
  }

  if (mapImage.complete) {
    fitMapFrame();
  } else {
    mapImage.addEventListener("load", fitMapFrame);
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (views.tour.classList.contains("is-active")) fitMapFrame();
    }, 100);
  });

  // ---------------------------------------------------------------
  // Map hotspots (SVG polygons drawn from data.js coordinates)
  // ---------------------------------------------------------------
  const overlay = document.getElementById("map-overlay");
  const tooltip = document.getElementById("map-tooltip");
  const tooltipTitle = document.getElementById("tooltip-title");
  const tooltipServices = document.getElementById("tooltip-services");

  function pointsToAttr(points) {
    return points.map(([x, y]) => `${x},${y}`).join(" ");
  }

  function renderHotspots() {
    GCCL_DATA.labs.forEach((lab) => {
      const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      poly.setAttribute("points", pointsToAttr(lab.coords));
      poly.setAttribute("class", "hotspot");
      poly.dataset.labId = lab.id;

      poly.addEventListener("mouseenter", (e) => showTooltip(lab, e));
      poly.addEventListener("mousemove", (e) => positionTooltip(e));
      poly.addEventListener("mouseleave", hideTooltip);
      poly.addEventListener("click", () => openModal(lab));

      overlay.appendChild(poly);
    });
  }

  function showTooltip(lab, evt) {
    mapFrame.classList.add("has-hover");
    evt.target.classList.add("is-hovered");
    tooltipTitle.textContent = lab.name;
    tooltipServices.textContent = lab.description.slice(0, 80) + (lab.description.length > 80 ? "…" : "");
    tooltip.classList.add("is-visible");
    positionTooltip(evt);
  }

  function positionTooltip(evt) {
    const rect = mapFrame.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
  }

  function hideTooltip(evt) {
    mapFrame.classList.remove("has-hover");
    if (evt && evt.target) evt.target.classList.remove("is-hovered");
    tooltip.classList.remove("is-visible");
  }

  // ---------------------------------------------------------------
  // Unified Modal (lab info + video all in one)
  // ---------------------------------------------------------------
  const modalScrim = document.getElementById("modal-scrim");
  const modal = document.getElementById("modal");
  const modalVideo = document.getElementById("modal-video");

  function openModal(lab) {
    document.getElementById("modal-title").textContent = lab.name;
    document.getElementById("modal-description").textContent = lab.description;
    modalVideo.src = lab.video;

    const list = document.getElementById("modal-materials");
    list.innerHTML = "";
    lab.materials.forEach((m) => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${m.url}" target="_blank" rel="noopener">${m.label}</a>`;
      list.appendChild(li);
    });

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    modalScrim.classList.add("is-visible");
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    modalScrim.classList.remove("is-visible");
    modalVideo.src = ""; // stop playback
  }

  document.getElementById("modal-close").addEventListener("click", closeModal);
  modalScrim.addEventListener("click", (e) => {
    if (e.target === modalScrim) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (modal.classList.contains("is-open")) closeModal();
  });

  // ---------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------
  renderOverview();
  renderContact();
  renderHotspots();
  showView("landing");
})();
