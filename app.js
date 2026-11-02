import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Konfigurasi web Firebase. Nilai ini bukan pengganti Security Rules.
const firebaseConfig = {
  apiKey: "AIzaSyA7nsVpFqnxa3tFheNfRvksTD0UqftTqgw",
  authDomain: "mobile-legendkomunitas.firebaseapp.com",
  projectId: "mobile-legendkomunitas",
  storageBucket: "mobile-legendkomunitas.firebasestorage.app",
  messagingSenderId: "968818166880",
  appId: "1:968818166880:web:ba6066885d606edae74705",
  measurementId: "G-EWXFPP9929"
};

// EmailJS: Service ID sudah diisi. Lengkapi Template ID dan Public Key dari dashboard EmailJS.
const EMAILJS_SERVICE_ID = "service_52ukn1s";
const EMAILJS_TEMPLATE_ID = "__ejs-test-mail-service__";
const EMAILJS_PUBLIC_KEY = "DzKlzGMlDG28VkA7U";
const emailjsConfigured =
  Boolean(EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const postsRef = collection(db, "posts");
const form = document.querySelector("#postForm");
const feed = document.querySelector("#feed");
const formMessage = document.querySelector("#formMessage");
let currentFilter = "all";
let posts = [];
let ready = false;

const $ = (s) => document.querySelector(s);
const escapeHtml = (value="") => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const selectedCategory = () => document.querySelector('input[name="category"]:checked').value;

document.querySelectorAll('input[name="category"]').forEach(input => input.addEventListener("change", () => {
  $("#likeFields").classList.toggle("hidden", selectedCategory() !== "like");
  $("#mabarFields").classList.toggle("hidden", selectedCategory() !== "mabar");
}));

document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t === tab));
  currentFilter = tab.dataset.filter;
  render();
}));

function formatTime(timestamp) {
  if (!timestamp?.toDate) return "Baru saja";
  return new Intl.DateTimeFormat("id-ID", {dateStyle:"medium", timeStyle:"short"}).format(timestamp.toDate());
}

function render() {
  const filtered = posts.filter(p => currentFilter === "all" || p.category === currentFilter);
  $("#feedTitle").textContent = currentFilter === "like" ? "Tukaran Like" : currentFilter === "mabar" ? "Cari Teman Mabar" : "Semua Postingan";
  $("#postCount").textContent = `${filtered.length} POST`;
  if (!ready) { feed.innerHTML = '<div class="loading">Menghubungkan ke komunitas...</div>'; return; }
  if (!filtered.length) {
    feed.innerHTML = '<div class="empty"><b>Belum ada postingan</b>Jadilah yang pertama berbagi di komunitas ML Squad! ✨</div>';
    return;
  }
  feed.innerHTML = filtered.map(p => {
    const isLike = p.category === "like";
    const detail = isLike
      ? `<span>💚 ${escapeHtml(p.target || "Saling like profil")}</span>`
      : `<span>🏆 ${escapeHtml(p.rank || "-")}</span><span>🎯 ${escapeHtml(p.role || "-")}</span>`;
    const note = p.note ? `<p class="note">${escapeHtml(p.note)}</p>` : "";
    const own = auth.currentUser && p.ownerUid === auth.currentUser.uid;
    return `<article class="post">
      <div class="post-top"><span class="badge ${isLike ? "" : "mabar"}">${isLike ? "💚 TUKARAN LIKE" : "🎮 CARI TEMAN MABAR"}</span><span class="status ${p.done ? "done" : ""}">${p.done ? "● SELESAI" : "● MENCARI"}</span></div>
      <div class="player"><h3>${escapeHtml(p.nickname)}</h3><span class="time">${formatTime(p.createdAt)}</span></div>
      <div class="details"><span>ID: ${escapeHtml(p.playerId)}</span><span>Zone: ${escapeHtml(p.zoneId)}</span>${detail}</div>
      ${note}
      <div class="post-actions">
        <button data-action="done" data-id="${p.id}" ${!own || p.done ? "disabled" : ""}>${isLike ? "Selesai tukaran" : "Sudah dapat teman"}</button>
        <button data-action="delete" data-id="${p.id}" ${!own ? "disabled" : ""}>Hapus</button>
      </div>
    </article>`;
  }).join("");
}

feed.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button || button.disabled) return;
  const post = posts.find(p => p.id === button.dataset.id);
  if (!post || post.ownerUid !== auth.currentUser?.uid) return;
  try {
    const ref = doc(db, "posts", post.id);
    if (button.dataset.action === "done") await updateDoc(ref, {done:true});
    if (button.dataset.action === "delete") {
      if (confirm("Hapus postingan ini?")) await deleteDoc(ref);
    }
  } catch (error) {
    alert("Aksi gagal. Coba lagi: " + error.message);
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!auth.currentUser) { formMessage.textContent = "Sedang menghubungkan akun. Coba lagi sebentar."; return; }
  const category = selectedCategory();
  const data = {
    category,
    nickname: $("#nickname").value.trim(),
    playerId: $("#playerId").value.trim(),
    zoneId: $("#zoneId").value.trim(),
    note: (category === "like" ? $("#likeNote").value : $("#mabarNote").value).trim(),
    done: false,
    ownerUid: auth.currentUser.uid,
    createdAt: serverTimestamp()
  };
  if (!data.nickname || !data.playerId || !data.zoneId) { formMessage.textContent = "Lengkapi nama, ID, dan Zone ID."; return; }
  if (!/^\d+$/.test(data.playerId) || !/^\d+$/.test(data.zoneId)) { formMessage.textContent = "ID dan Zone ID harus berupa angka."; return; }
  if (category === "like") data.target = $("#likeTarget").value;
  else { data.rank = $("#rank").value; data.role = $("#role").value; }
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true; submit.textContent = "Memublikasikan...";
  try {
    const createdPost = await addDoc(postsRef, data);
    form.reset();
    $("#likeFields").classList.remove("hidden"); $("#mabarFields").classList.add("hidden");

    // Email dikirim ke alamat admin yang diatur pada bagian To Email di template EmailJS.
    // Jika EmailJS belum lengkap/gagal, postingan Firebase tetap berhasil tersimpan.
    if (emailjsConfigured && window.emailjs) {
      try {
        await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          nickname: data.nickname,
          player_id: data.playerId,
          zone_id: data.zoneId,
          category: data.category,
          category_name: category === "like" ? "Tukaran Like" : "Cari Teman Mabar",
          target: data.target || "-",
          rank: data.rank || "-",
          role: data.role || "-",
          note: data.note || "-",
          post_id: createdPost.id
        }, { publicKey: EMAILJS_PUBLIC_KEY });
        formMessage.textContent = "Postingan berhasil! Email pemberitahuan juga terkirim. 🎉";
      } catch (emailError) {
        console.error("EmailJS gagal mengirim email:", emailError);
        formMessage.textContent = "Postingan berhasil, tetapi email pemberitahuan gagal. Periksa pengaturan EmailJS.";
      }
    } else {
      formMessage.textContent = "Postingan berhasil dipublikasikan! Email aktif setelah Template ID dan Public Key diisi.";
    }
  } catch (error) {
    formMessage.textContent = "Gagal memublikasikan. Periksa koneksi dan pengaturan Firebase.";
    console.error(error);
  } finally { submit.disabled = false; submit.textContent = "Publikasikan postingan ↗"; }
});

$("#copyDana").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText("0821-9152-3276");
    $("#copyMessage").textContent = "Nomor DANA berhasil disalin.";
  } catch { $("#copyMessage").textContent = "Browser tidak mengizinkan salin otomatis. Nomor: 0821-9152-3276"; }
});

$("#year").textContent = new Date().getFullYear();

try {
  await signInAnonymously(auth);
  onSnapshot(query(postsRef, orderBy("createdAt", "desc")), snapshot => {
    posts = snapshot.docs.map(d => ({id:d.id, ...d.data()}));
    ready = true; render();
  }, error => {
    console.error(error); ready = true;
    feed.innerHTML = '<div class="empty"><b>Belum bisa memuat postingan</b>Periksa konfigurasi Firebase Authentication dan Firestore Rules.</div>';
  });
} catch (error) {
  console.error(error); ready = true;
  feed.innerHTML = '<div class="empty"><b>Koneksi Firebase belum siap</b>Aktifkan Anonymous Authentication dan periksa konfigurasi API Key.</div>';
}
