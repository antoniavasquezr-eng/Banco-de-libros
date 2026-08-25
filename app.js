// ============================================================
// 1) CONFIGURA TU PROYECTO DE FIREBASE AQUÍ
// Ve a https://console.firebase.google.com -> tu proyecto ->
// Configuración del proyecto -> "Tus apps" -> Config del SDK
// y pega los valores abajo.
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyDoY6EXEb-a-S0-O7iEBhks3jQt8BS0-YI",
    authDomain: "fundacion-banco-libros-f413e.firebaseapp.com",
    databaseURL: "https://fundacion-banco-libros-f413e-default-rtdb.firebaseio.com",
    projectId: "fundacion-banco-libros-f413e",
    storageBucket: "fundacion-banco-libros-f413e.firebasestorage.app",
    messagingSenderId: "203369651335",
    appId: "1:203369651335:web:6bd7d5d992baa44ab5ec22",
    measurementId: "G-ZSD5MD9HGT"
  };

// Detecta si sigue con valores de ejemplo
const configPendiente = firebaseConfig.apiKey === "TU_API_KEY";
if (configPendiente) {
  document.getElementById("avisoConfig").style.display = "block";
}

let db = null;
let recursos = []; // caché local

// Intenta cargar Firebase solo si hay configuración real
async function iniciarFirebase() {
  if (configPendiente) {
    // Modo demo: usa datos de ejemplo en memoria
    recursos = datosDemo();
    renderizar();
    return;
  }
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const {
      getFirestore, collection, addDoc, getDocs,
      deleteDoc, doc, onSnapshot, orderBy, query
    } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    window.__fs = { collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, orderBy, query };

    const q = query(collection(db, "recursos"), orderBy("creado", "desc"));
    onSnapshot(q, (snap) => {
      recursos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderizar();
    });
  } catch (err) {
    console.error("Error conectando a Firebase:", err);
    recursos = datosDemo();
    renderizar();
  }
}

function datosDemo() {
  return [
    {
      id: "demo1",
      tipo: "libro",
      titulo: "Cuentos del Sur",
      autor: "Recopilación local",
      curso: "1° a 4° básico",
      desc: "Antología de cuentos breves para fomentar la lectura en aula multigrado.",
      link: "#"
    },
    {
      id: "demo2",
      tipo: "actividad",
      titulo: "Guía de observación de plantas nativas",
      autor: "Profe Marcela",
      curso: "5° a 8° básico",
      desc: "Actividad práctica de ciencias naturales para realizar en el patio de la escuela.",
      link: "#"
    },
    {
      id: "demo3",
      tipo: "libro",
      titulo: "Matemática con el entorno",
      autor: "Editorial rural",
      curso: "Preescolar",
      desc: "Ejercicios de conteo y formas usando elementos del campo.",
      link: "#"
    }
  ];
}

// ---------- Render ----------
function renderizar() {
  const texto = document.getElementById("buscador").value.toLowerCase();
  const tipo = document.getElementById("filtroTipo").value;
  const curso = document.getElementById("filtroCurso").value;

  const filtrados = recursos.filter(r => {
    const coincideTexto = !texto ||
      (r.titulo || "").toLowerCase().includes(texto) ||
      (r.autor || "").toLowerCase().includes(texto) ||
      (r.desc || "").toLowerCase().includes(texto);
    const coincideTipo = !tipo || r.tipo === tipo;
    const coincideCurso = !curso || r.curso === curso;
    return coincideTexto && coincideTipo && coincideCurso;
  });

  document.getElementById("contador").textContent =
    `${filtrados.length} recurso${filtrados.length === 1 ? "" : "s"} encontrado${filtrados.length === 1 ? "" : "s"}`;

  const grid = document.getElementById("grid");
  const vacio = document.getElementById("vacio");
  grid.innerHTML = "";

  if (filtrados.length === 0) {
    vacio.style.display = "block";
    return;
  }
  vacio.style.display = "none";

  filtrados.forEach(r => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-top">
        <span class="tag ${r.tipo === 'actividad' ? 'tipo-actividad' : ''}">${r.tipo === 'actividad' ? 'Actividad' : 'Libro'}</span>
        <button class="borrar" title="Eliminar" onclick="eliminarRecurso('${r.id}')">✕</button>
      </div>
      <div class="card-body">
        <h3>${escapar(r.titulo)}</h3>
        <div class="meta">${escapar(r.autor || "Autor no indicado")} · ${escapar(r.curso || "Sin curso")}</div>
        <div class="desc">${escapar(r.desc || "")}</div>
      </div>
      <div class="card-footer">
        <a href="${r.link || '#'}" target="_blank" rel="noopener">Ver / descargar →</a>
      </div>
    `;
    grid.appendChild(card);
  });
}

function escapar(str) {
  const d = document.createElement("div");
  d.textContent = str || "";
  return d.innerHTML;
}

// ---------- Filtros ----------
document.getElementById("buscador").addEventListener("input", renderizar);
document.getElementById("filtroTipo").addEventListener("change", renderizar);
document.getElementById("filtroCurso").addEventListener("change", renderizar);

// ---------- Modal ----------
window.abrirModal = function () {
  document.getElementById("overlay").classList.add("activo");
};
window.cerrarModal = function () {
  document.getElementById("overlay").classList.remove("activo");
};

window.guardarRecurso = async function () {
  const nuevo = {
    tipo: document.getElementById("f-tipo").value,
    titulo: document.getElementById("f-titulo").value.trim(),
    autor: document.getElementById("f-autor").value.trim(),
    curso: document.getElementById("f-curso").value,
    desc: document.getElementById("f-desc").value.trim(),
    link: document.getElementById("f-link").value.trim(),
    creado: Date.now()
  };

  if (!nuevo.titulo) {
    alert("Por favor ingresa al menos el título del recurso.");
    return;
  }

  if (configPendiente || !db) {
    // Modo demo: guarda solo en memoria
    nuevo.id = "local-" + Date.now();
    recursos.unshift(nuevo);
    renderizar();
  } else {
    const { collection, addDoc } = window.__fs;
    await addDoc(collection(db, "recursos"), nuevo);
  }

  document.getElementById("f-titulo").value = "";
  document.getElementById("f-autor").value = "";
  document.getElementById("f-desc").value = "";
  document.getElementById("f-link").value = "";
  cerrarModal();
};

window.eliminarRecurso = async function (id) {
  if (!confirm("¿Eliminar este recurso?")) return;

  if (configPendiente || !db || id.startsWith("local-") || id.startsWith("demo")) {
    recursos = recursos.filter(r => r.id !== id);
    renderizar();
    return;
  }
  const { doc, deleteDoc } = window.__fs;
  await deleteDoc(doc(db, "recursos", id));
};

iniciarFirebase();
