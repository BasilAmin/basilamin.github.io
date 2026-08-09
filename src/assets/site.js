const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initThemeToggle() {
  const button = document.querySelector("[data-theme-toggle]");
  const label = document.querySelector("[data-theme-label]");
  const themeColor = document.querySelector("[data-theme-color]");
  if (!(button instanceof HTMLButtonElement) || !(label instanceof HTMLElement)) return;
  const system = window.matchMedia("(prefers-color-scheme: light)");
  const stored = () => {
    try {
      return localStorage.getItem("basil-theme");
    } catch {
      return null;
    }
  };
  const apply = (theme) => {
    const next = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    label.textContent = next === "dark" ? "Light" : "Dark";
    button.setAttribute("aria-label", `Switch to ${next === "dark" ? "light" : "dark"} theme`);
    if (themeColor instanceof HTMLMetaElement) {
      const background = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
      if (background) themeColor.content = background;
    }
  };
  apply(document.documentElement.dataset.theme || stored() || (system.matches ? "light" : "dark"));
  button.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    apply(next);
    try {
      localStorage.setItem("basil-theme", next);
    } catch {
      return;
    }
  });
  system.addEventListener?.("change", (event) => {
    if (!stored()) apply(event.matches ? "light" : "dark");
  });
}

function initReveal() {
  const elements = [...document.querySelectorAll("[data-reveal]")];
  if (!elements.length) return;
  if (reducedMotion || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -9%", threshold: 0.08 });
  elements.forEach((element) => observer.observe(element));
}

function initCopyButtons() {
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.getAttribute("data-copy");
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        const label = button.textContent;
        button.textContent = "Copied";
        window.setTimeout(() => {
          button.textContent = label;
        }, 1200);
      } catch {
        window.location.href = `mailto:${value}`;
      }
    });
  });
}

function initProjectFilter() {
  const input = document.querySelector("[data-filter-input]");
  const status = document.querySelector("[data-filter-status]");
  const rows = [...document.querySelectorAll("[data-filter-row]")];
  const empty = document.querySelector("[data-filter-empty]");
  if (!(input instanceof HTMLInputElement) || !(status instanceof HTMLSelectElement) || !rows.length) return;
  const update = () => {
    const query = input.value.trim().toLowerCase();
    const selectedStatus = status.value;
    let visible = 0;
    rows.forEach((row) => {
      const matchesQuery = !query || (row.getAttribute("data-search") || "").includes(query);
      const matchesStatus = !selectedStatus || row.getAttribute("data-status") === selectedStatus;
      row.hidden = !(matchesQuery && matchesStatus);
      if (!row.hidden) visible += 1;
    });
    if (empty instanceof HTMLElement) empty.hidden = visible > 0;
  };
  input.addEventListener("input", update);
  status.addEventListener("change", update);
}

function initScrambleText() {
  if (reducedMotion) return;
  const alphabet = "0123456789ABCDEFGHJKLMNPRSTUVWXYZ/\\+-";
  const revealQueue = [];

  document.querySelectorAll("[data-scramble]").forEach((element) => {
    if (!(element instanceof HTMLElement)) return;
    const original = element.textContent || "";
    if (!original.trim()) return;

    const copy = document.createElement("span");
    const noise = document.createElement("span");
    const shard = document.createElement("span");
    copy.className = "scramble-copy";
    noise.className = "scramble-noise";
    shard.className = "scramble-shard";
    copy.textContent = original;
    noise.setAttribute("aria-hidden", "true");
    shard.setAttribute("aria-hidden", "true");
    element.replaceChildren(copy, noise, shard);
    element.classList.add("scramble-ready");

    let animation = 0;
    let timeout = 0;
    let hoverLocked = false;
    let hoverRelease = 0;

    const run = (duration = 420) => {
      if (element.classList.contains("is-scrambling")) return;
      window.cancelAnimationFrame(animation);
      window.clearTimeout(timeout);
      const started = performance.now();
      element.classList.add("is-scrambling");

      const draw = (time) => {
        const progress = Math.min(1, (time - started) / duration);
        const resolved = Math.floor((1 - Math.pow(1 - progress, 3)) * original.length);
        const disrupted = [...original].map((character, index) => {
          if (/\s/.test(character) || index < resolved) return character;
          if (index > resolved + 5) return character;
          if (/[a-z]/.test(character)) return "abcdefghijkmnpqrstuvwxyz"[Math.floor(Math.random() * 24)];
          if (/[A-Z]/.test(character)) return "ABCDEFGHJKLMNPRSTUVWXYZ"[Math.floor(Math.random() * 23)];
          if (/\d/.test(character)) return "0123456789"[Math.floor(Math.random() * 10)];
          return alphabet[Math.floor(Math.random() * alphabet.length)];
        }).join("");
        noise.textContent = disrupted;
        shard.textContent = disrupted;

        if (progress < 1) {
          animation = window.requestAnimationFrame(draw);
          return;
        }

        noise.textContent = "";
        shard.textContent = "";
        element.classList.remove("is-scrambling");
      };

      animation = window.requestAnimationFrame(draw);
    };

    element.addEventListener("pointerenter", () => {
      if (hoverLocked) return;
      hoverLocked = true;
      run(340);
    });
    element.addEventListener("pointerleave", () => {
      window.clearTimeout(hoverRelease);
      hoverRelease = window.setTimeout(() => {
        if (!element.matches(":hover")) hoverLocked = false;
      }, 120);
    });
    element.addEventListener("focus", () => run(340));

    if (element.hasAttribute("data-scramble-start")) {
      const delay = Number(element.getAttribute("data-scramble-start"));
      timeout = window.setTimeout(() => run(560), Number.isFinite(delay) ? delay : 0);
    }

    if (element.hasAttribute("data-scramble-reveal")) revealQueue.push({ element, run });
  });

  if (!revealQueue.length) return;
  if (!("IntersectionObserver" in window)) {
    revealQueue.forEach(({ run }) => run(460));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const item = revealQueue.find(({ element }) => element === entry.target);
      item?.run(460);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -10%", threshold: 0.35 });

  revealQueue.forEach(({ element }) => observer.observe(element));
}

function initCommandPalette() {
  const dialog = document.querySelector("[data-command-dialog]");
  const input = document.querySelector("[data-command-input]");
  const results = document.querySelector("[data-command-results]");
  if (!(dialog instanceof HTMLDialogElement) || !(input instanceof HTMLInputElement) || !(results instanceof HTMLElement)) return;
  let index = [];
  let selected = 0;
  let loading;
  const load = () => {
    loading ||= fetch("/search.json").then((response) => {
      if (!response.ok) throw new Error("Search index unavailable");
      return response.json();
    }).then((items) => {
      index = Array.isArray(items) ? items : [];
    }).catch(() => {
      index = [];
    });
    return loading;
  };
  const score = (item, query) => {
    const title = item.title.toLowerCase();
    const description = item.description.toLowerCase();
    const tags = item.tags.join(" ").toLowerCase();
    const text = item.text.toLowerCase();
    if (title === query) return 100;
    if (title.startsWith(query)) return 80;
    if (title.includes(query)) return 60;
    if (tags.includes(query)) return 40;
    if (description.includes(query)) return 30;
    if (text.includes(query)) return 10;
    return 0;
  };
  const render = () => {
    const query = input.value.trim().toLowerCase();
    const matches = query
      ? index.map((item) => ({ item, score: score(item, query) })).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title)).slice(0, 9).map((entry) => entry.item)
      : index.slice(0, 7);
    selected = Math.min(selected, Math.max(0, matches.length - 1));
    results.replaceChildren();
    if (!matches.length) {
      const message = document.createElement("p");
      message.textContent = query ? "No matching pages." : "Start typing to search every published page.";
      results.append(message);
      return;
    }
    matches.forEach((item, itemIndex) => {
      const link = document.createElement("a");
      link.className = "command-result";
      link.href = item.href;
      link.setAttribute("aria-selected", String(itemIndex === selected));
      const kind = document.createElement("span");
      kind.textContent = item.kind;
      const copy = document.createElement("span");
      const heading = document.createElement("strong");
      const description = document.createElement("p");
      heading.textContent = item.title;
      description.textContent = item.description;
      copy.append(heading, description);
      link.append(kind, copy);
      results.append(link);
    });
  };
  const open = async () => {
    if (!dialog.open) dialog.showModal();
    document.body.dataset.commandOpen = "true";
    input.value = "";
    selected = 0;
    await load();
    render();
    input.focus();
  };
  const close = () => {
    if (dialog.open) dialog.close();
    delete document.body.dataset.commandOpen;
  };
  document.querySelectorAll("[data-command-open]").forEach((button) => button.addEventListener("click", open));
  document.querySelectorAll("[data-command-close]").forEach((button) => button.addEventListener("click", close));
  dialog.addEventListener("close", () => delete document.body.dataset.commandOpen);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  input.addEventListener("input", () => {
    selected = 0;
    render();
  });
  input.addEventListener("keydown", (event) => {
    const links = [...results.querySelectorAll("a")];
    if (event.key === "ArrowDown") {
      event.preventDefault();
      selected = Math.min(selected + 1, links.length - 1);
      render();
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      selected = Math.max(0, selected - 1);
      render();
    }
    if (event.key === "Enter" && links[selected]) {
      event.preventDefault();
      links[selected].click();
    }
  });
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;
    if (event.key === "Escape" && dialog.open) {
      event.preventDefault();
      close();
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      open();
    }
    if (event.key === "/" && !typing && !dialog.open) {
      event.preventDefault();
      open();
    }
  });
}


function initLocalClock() {
  const clock = document.querySelector("[data-location-clock]");
  const location = document.querySelector("[data-clock-location]");
  const time = document.querySelector("[data-clock-time]");
  const age = document.querySelector("[data-live-age]");
  const dialog = document.querySelector("[data-location-dialog]");
  const form = document.querySelector("[data-location-form]");
  const labelInput = document.querySelector("[data-location-label-input]");
  const zoneInput = document.querySelector("[data-location-zone-input]");
  const error = document.querySelector("[data-location-error]");
  if (!(clock instanceof HTMLButtonElement) || !(location instanceof HTMLElement) || !(time instanceof HTMLTimeElement) || !(age instanceof HTMLElement)) return;

  const defaults = {
    label: clock.dataset.defaultLocation || "Dublin",
    zone: clock.dataset.defaultTimeZone || "Europe/Dublin"
  };
  const birth = new Date(`${clock.dataset.birthDate || "2009-02-20"}T00:00:00Z`);
  const readStored = () => {
    try {
      const value = JSON.parse(localStorage.getItem("basil-location") || "null");
      return value && typeof value.label === "string" && typeof value.zone === "string" ? value : defaults;
    } catch {
      return defaults;
    }
  };
  const validZone = (zone) => {
    try {
      new Intl.DateTimeFormat("en-IE", { timeZone: zone }).format();
      return true;
    } catch {
      return false;
    }
  };
  const exactAge = (now) => {
    let year = now.getUTCFullYear();
    const birthdayThisYear = new Date(Date.UTC(year, birth.getUTCMonth(), birth.getUTCDate()));
    const last = now < birthdayThisYear
      ? new Date(Date.UTC(year - 1, birth.getUTCMonth(), birth.getUTCDate()))
      : birthdayThisYear;
    const next = new Date(Date.UTC(last.getUTCFullYear() + 1, birth.getUTCMonth(), birth.getUTCDate()));
    return last.getUTCFullYear() - birth.getUTCFullYear() + (now - last) / (next - last);
  };
  let settings = readStored();

  const render = () => {
    const now = new Date();
    location.textContent = settings.label;
    time.textContent = new Intl.DateTimeFormat("en-IE", {
      timeZone: settings.zone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(now);
    time.dateTime = now.toISOString();
    age.textContent = exactAge(now).toFixed(6);
    clock.setAttribute("aria-label", `${settings.label} time ${time.textContent}. Age ${age.textContent} years. Change displayed location and time zone.`);
  };

  const close = () => {
    if (dialog instanceof HTMLDialogElement && dialog.open) dialog.close();
    delete document.body.dataset.locationOpen;
  };
  const open = () => {
    if (!(dialog instanceof HTMLDialogElement) || !(labelInput instanceof HTMLInputElement) || !(zoneInput instanceof HTMLInputElement)) return;
    labelInput.value = settings.label;
    zoneInput.value = settings.zone;
    if (error instanceof HTMLElement) error.textContent = "";
    document.body.dataset.locationOpen = "true";
    dialog.showModal();
    labelInput.focus();
    labelInput.select();
  };

  clock.addEventListener("click", open);
  document.querySelectorAll("[data-location-close]").forEach((button) => button.addEventListener("click", close));
  document.querySelectorAll("[data-location-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!(labelInput instanceof HTMLInputElement) || !(zoneInput instanceof HTMLInputElement)) return;
      labelInput.value = button.getAttribute("data-location-label") || "";
      zoneInput.value = button.getAttribute("data-location-zone") || "";
      if (error instanceof HTMLElement) error.textContent = "";
    });
  });
  document.querySelectorAll("[data-location-reset]").forEach((button) => {
    button.addEventListener("click", () => {
      settings = defaults;
      try {
        localStorage.removeItem("basil-location");
      } catch {
        render();
      }
      render();
      close();
    });
  });
  if (form instanceof HTMLFormElement) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!(labelInput instanceof HTMLInputElement) || !(zoneInput instanceof HTMLInputElement)) return;
      const label = labelInput.value.trim();
      const zone = zoneInput.value.trim();
      if (!label || !validZone(zone)) {
        if (error instanceof HTMLElement) error.textContent = "Enter a place name and a valid IANA time zone such as Europe/Dublin.";
        return;
      }
      settings = { label, zone };
      try {
        localStorage.setItem("basil-location", JSON.stringify(settings));
      } catch {
        settings = { label, zone };
      }
      render();
      close();
    });
  }
  if (dialog instanceof HTMLDialogElement) {
    dialog.addEventListener("close", () => delete document.body.dataset.locationOpen);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) close();
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dialog instanceof HTMLDialogElement && dialog.open) close();
  });
  render();
  window.setInterval(render, 1000);
}

function initBlackHoleCursor() {
  const precisePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (reducedMotion || !precisePointer.matches) return;

  const cursor = document.createElement("div");
  cursor.className = "black-hole-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML = '<span class="black-hole-lens"></span><span class="black-hole-accretion"></span><span class="black-hole-ring"></span><span class="black-hole-core"></span>';
  document.body.append(cursor);
  document.documentElement.dataset.blackHoleCursor = "true";

  let attracted;
  const release = () => {
    if (!(attracted instanceof HTMLElement)) return;
    attracted.classList.remove("is-attracted");
    attracted.style.removeProperty("--gravity-x");
    attracted.style.removeProperty("--gravity-y");
    attracted.style.removeProperty("--gravity-tilt");
    attracted = undefined;
  };

  document.addEventListener("pointermove", (event) => {
    if (event.pointerType && event.pointerType !== "mouse") return;
    cursor.style.setProperty("--cursor-x", `${event.clientX}px`);
    cursor.style.setProperty("--cursor-y", `${event.clientY}px`);
    if (event.target instanceof HTMLIFrameElement) {
      cursor.classList.remove("is-visible", "is-interacting", "is-consuming");
      release();
      return;
    }
    cursor.classList.add("is-visible");

    const target = event.target instanceof Element
      ? event.target.closest("a, button, input, select, textarea, summary, [role='button']")
      : null;
    if (!(target instanceof HTMLElement) || target.hasAttribute("disabled")) {
      release();
      cursor.classList.remove("is-interacting");
      return;
    }

    if (attracted !== target) {
      release();
      attracted = target;
      attracted.classList.add("is-attracted");
    }
    const bounds = target.getBoundingClientRect();
    const pullX = Math.max(-3, Math.min(3, (event.clientX - (bounds.left + bounds.width / 2)) * 0.045));
    const pullY = Math.max(-3, Math.min(3, (event.clientY - (bounds.top + bounds.height / 2)) * 0.045));
    target.style.setProperty("--gravity-x", `${pullX.toFixed(2)}px`);
    target.style.setProperty("--gravity-y", `${pullY.toFixed(2)}px`);
    target.style.setProperty("--gravity-tilt", `${(-pullX * 0.42).toFixed(2)}deg`);
    cursor.classList.add("is-interacting");
  });

  document.addEventListener("pointerdown", () => cursor.classList.add("is-consuming"));
  document.addEventListener("pointerup", () => cursor.classList.remove("is-consuming"));
  document.documentElement.addEventListener("mouseleave", () => {
    cursor.classList.remove("is-visible", "is-interacting", "is-consuming");
    release();
  });
  window.addEventListener("blur", () => {
    cursor.classList.remove("is-visible", "is-interacting", "is-consuming");
    release();
  });
}

function initWebGLRobot() {
  const canvas = document.querySelector(".robot-webgl");
  const scene = canvas?.closest(".portal-scene");
  if (!(canvas instanceof HTMLCanvasElement) || !(scene instanceof HTMLElement) || reducedMotion) return;
  const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false });
  if (!gl) return;

  const vertexSource = `
    attribute vec3 position;
    attribute vec3 normal;
    uniform mat4 projection;
    uniform mat4 view;
    uniform mat4 model;
    varying vec3 vNormal;
    varying vec3 vWorld;
    void main(){
      vec4 world = model * vec4(position, 1.0);
      vWorld = world.xyz;
      vNormal = normalize(mat3(model) * normal);
      gl_Position = projection * view * world;
    }`;
  const fragmentSource = `
    precision mediump float;
    uniform vec3 color;
    uniform vec3 emission;
    uniform float opacity;
    varying vec3 vNormal;
    varying vec3 vWorld;
    void main(){
      vec3 n = normalize(vNormal);
      vec3 key = normalize(vec3(-0.7, 0.9, 1.4));
      vec3 fill = normalize(vec3(0.9, -0.25, 0.5));
      float diffuse = max(dot(n, key), 0.0) * 0.72 + max(dot(n, fill), 0.0) * 0.2;
      vec3 eye = normalize(vec3(0.0, 0.0, 7.0) - vWorld);
      vec3 halfVector = normalize(key + eye);
      float specular = pow(max(dot(n, halfVector), 0.0), 42.0);
      float rim = pow(1.0 - max(dot(n, eye), 0.0), 2.4);
      vec3 shaded = color * (0.34 + diffuse) + vec3(specular * 0.95) + color * rim * 0.18 + emission;
      gl_FragColor = vec4(shaded, opacity);
    }`;
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Shader compilation failed");
    return shader;
  };

  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  } catch {
    return;
  }
  gl.useProgram(program);

  const locations = {
    position: gl.getAttribLocation(program, "position"),
    normal: gl.getAttribLocation(program, "normal"),
    projection: gl.getUniformLocation(program, "projection"),
    view: gl.getUniformLocation(program, "view"),
    model: gl.getUniformLocation(program, "model"),
    color: gl.getUniformLocation(program, "color"),
    emission: gl.getUniformLocation(program, "emission"),
    opacity: gl.getUniformLocation(program, "opacity")
  };
  const mesh = (vertices, normals, indices) => {
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    return { vertexBuffer, normalBuffer, indexBuffer, count: indices.length };
  };
  const sphere = (rows = 20, columns = 28) => {
    const vertices = [], normals = [], indices = [];
    for (let row = 0; row <= rows; row += 1) {
      const latitude = row * Math.PI / rows;
      for (let column = 0; column <= columns; column += 1) {
        const longitude = column * Math.PI * 2 / columns;
        const x = Math.sin(latitude) * Math.cos(longitude);
        const y = Math.cos(latitude);
        const z = Math.sin(latitude) * Math.sin(longitude);
        vertices.push(x, y, z); normals.push(x, y, z);
      }
    }
    for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) {
      const a = row * (columns + 1) + column;
      const b = a + columns + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
    return mesh(vertices, normals, indices);
  };
  const torus = (major = 0.72, minor = 0.055, rows = 28, columns = 10) => {
    const vertices = [], normals = [], indices = [];
    for (let row = 0; row <= rows; row += 1) {
      const u = row * Math.PI * 2 / rows;
      for (let column = 0; column <= columns; column += 1) {
        const v = column * Math.PI * 2 / columns;
        const x = (major + minor * Math.cos(v)) * Math.cos(u);
        const y = minor * Math.sin(v);
        const z = (major + minor * Math.cos(v)) * Math.sin(u);
        vertices.push(x, y, z); normals.push(Math.cos(v) * Math.cos(u), Math.sin(v), Math.cos(v) * Math.sin(u));
      }
    }
    for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) {
      const a = row * (columns + 1) + column;
      const b = a + columns + 1;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
    return mesh(vertices, normals, indices);
  };
  const cylinder = (sides = 16) => {
    const vertices = [], normals = [], indices = [];
    for (let i = 0; i <= sides; i += 1) {
      const angle = i * Math.PI * 2 / sides;
      const x = Math.cos(angle), z = Math.sin(angle);
      vertices.push(x, -1, z, x, 1, z); normals.push(x, 0, z, x, 0, z);
    }
    for (let i = 0; i < sides; i += 1) {
      const a = i * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    return mesh(vertices, normals, indices);
  };

  const sphereMesh = sphere();
  const torusMesh = torus();
  const cylinderMesh = cylinder();
  const identity = () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  const multiply = (a, b) => {
    const out = new Float32Array(16);
    for (let column = 0; column < 4; column += 1) for (let row = 0; row < 4; row += 1) {
      out[column * 4 + row] = a[row] * b[column * 4] + a[4 + row] * b[column * 4 + 1] + a[8 + row] * b[column * 4 + 2] + a[12 + row] * b[column * 4 + 3];
    }
    return out;
  };
  const transform = (translation = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) => {
    const [x, y, z] = rotation, sx = Math.sin(x), cx = Math.cos(x), sy = Math.sin(y), cy = Math.cos(y), sz = Math.sin(z), cz = Math.cos(z);
    const rx = new Float32Array([1, 0, 0, 0, 0, cx, sx, 0, 0, -sx, cx, 0, 0, 0, 0, 1]);
    const ry = new Float32Array([cy, 0, -sy, 0, 0, 1, 0, 0, sy, 0, cy, 0, 0, 0, 0, 1]);
    const rz = new Float32Array([cz, sz, 0, 0, -sz, cz, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    const matrix = multiply(multiply(rz, ry), rx);
    matrix[0] *= scale[0]; matrix[1] *= scale[0]; matrix[2] *= scale[0];
    matrix[4] *= scale[1]; matrix[5] *= scale[1]; matrix[6] *= scale[1];
    matrix[8] *= scale[2]; matrix[9] *= scale[2]; matrix[10] *= scale[2];
    matrix[12] = translation[0]; matrix[13] = translation[1]; matrix[14] = translation[2];
    return matrix;
  };
  const draw = (shape, parent, position, rotation, scale, color, emission = [0, 0, 0], opacity = 1) => {
    const model = multiply(parent, transform(position, rotation, scale));
    gl.uniformMatrix4fv(locations.model, false, model);
    gl.uniform3fv(locations.color, color); gl.uniform3fv(locations.emission, emission); gl.uniform1f(locations.opacity, opacity);
    gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer); gl.vertexAttribPointer(locations.position, 3, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(locations.position);
    gl.bindBuffer(gl.ARRAY_BUFFER, shape.normalBuffer); gl.vertexAttribPointer(locations.normal, 3, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(locations.normal);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.indexBuffer); gl.drawElements(gl.TRIANGLES, shape.count, gl.UNSIGNED_SHORT, 0);
  };
  const projection = (aspect) => {
    const field = 1 / Math.tan(Math.PI / 7), near = 0.1, far = 100;
    return new Float32Array([field / aspect, 0, 0, 0, 0, field, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0]);
  };
  const view = identity(); view[14] = -7;
  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(scene.clientWidth * ratio));
    const height = Math.max(1, Math.round(scene.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    gl.viewport(0, 0, width, height);
    gl.uniformMatrix4fv(locations.projection, false, projection(width / height));
    gl.uniformMatrix4fv(locations.view, false, view);
  };
  new ResizeObserver(resize).observe(scene);
  resize();
  gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  scene.classList.add("webgl-ready");
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    scene.classList.remove("webgl-ready");
  });

  const start = performance.now();
  const render = (time) => {
    resize();
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const phase = ((time - start) % 12000) / 12000;
    if (phase <= 0.505) {
      const travel = Math.min(1, phase / 0.5);
      const eased = travel * travel * (3 - 2 * travel);
      const x = -2.05 + eased * 4.12;
      const y = -2.05 + eased * 4.15 + Math.sin(eased * Math.PI) * 0.42;
      const z = Math.sin(eased * Math.PI) * 1.1;
      const thresholdScale = Math.min(1, travel / 0.08, (1 - travel) / 0.06);
      const scale = Math.max(0.04, thresholdScale) * (scene.clientWidth < 180 ? 0.72 : 1.05);
      const body = transform([x, y, z], [time * 0.0017, Math.sin(time * 0.0023) * 0.62 + time * 0.0011, Math.sin(time * 0.0031) * 0.18], [scale, scale, scale]);
      const eyeX = Math.sin(time * 0.011) * 0.12;
      const eyeY = Math.cos(time * 0.014) * 0.11;
      draw(sphereMesh, body, [0, 0, 0], [0, 0, 0], [1, 1, 0.92], [0.72, 0.76, 0.78]);
      draw(sphereMesh, body, [-0.68, 0, 0], [0, 0.2, 0], [0.36, 0.76, 0.64], [0.9, 0.92, 0.93]);
      draw(sphereMesh, body, [0.68, 0, 0], [0, -0.2, 0], [0.36, 0.76, 0.64], [0.9, 0.92, 0.93]);
      draw(torusMesh, body, [0, 0, 0], [Math.PI / 2, 0, 0], [1.01, 1.01, 1.01], [0.2, 0.23, 0.25]);
      draw(torusMesh, body, [0, 0, 0], [0, 0, Math.PI / 2], [1.01, 1.01, 1.01], [0.42, 0.46, 0.48]);
      draw(torusMesh, body, [0, 0.73, 0], [0, 0, 0], [0.58, 0.9, 0.72], [0.35, 0.39, 0.42]);
      draw(torusMesh, body, [0, -0.73, 0], [0, 0, 0], [0.58, 0.9, 0.72], [0.35, 0.39, 0.42]);
      draw(cylinderMesh, body, [0.68, 0.42, 0], [0, 0, -0.78], [0.045, 0.36, 0.045], [0.46, 0.5, 0.52]);
      draw(sphereMesh, body, [0, 0, 0.79], [0, 0, 0], [0.52, 0.52, 0.16], [0.055, 0.065, 0.07]);
      draw(torusMesh, body, [0, 0, 0.84], [Math.PI / 2, 0, 0], [0.47, 0.47, 0.47], [0.22, 0.25, 0.27]);
      draw(sphereMesh, body, [eyeX, eyeY, 0.97], [0, 0, 0], [0.2, 0.2, 0.1], [0.65, 0.015, 0.01], [0.55, 0.01, 0.005]);
      draw(sphereMesh, body, [eyeX - 0.04, eyeY + 0.05, 1.055], [0, 0, 0], [0.045, 0.045, 0.025], [1, 0.8, 0.75], [0.7, 0.3, 0.25]);
    }
    window.requestAnimationFrame(render);
  };
  window.requestAnimationFrame(render);
}

initThemeToggle();
initReveal();
initCopyButtons();
initProjectFilter();
initScrambleText();
initCommandPalette();
initLocalClock();
initBlackHoleCursor();
initWebGLRobot();
