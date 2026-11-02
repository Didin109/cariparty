# ML Squad — versi GitHub Pages + EmailJS

Versi ini memakai Firebase Firestore untuk menyimpan postingan dan EmailJS untuk mengirim email pemberitahuan admin dari JavaScript browser. Tidak perlu Firebase Functions untuk pengiriman email.

## 1. File yang di-upload ke GitHub

Upload semua file di folder ini ke root repository GitHub:
- `index.html`
- `style.css`
- `app.js`
- `firestore.rules` (aturan database; bukan file website)

Aktifkan GitHub Pages dari Settings → Pages → Deploy from a branch → `main` → `/ (root)`.

## 2. Atur EmailJS

Konfigurasi yang diberikan sudah dipasang di `app.js`:
- Service ID: `service_52ukn1s`
- Template ID: `__ejs-test-mail-service__`
- Public Key: sudah diisi.

Catatan: Template ID yang diberikan terlihat seperti ID template uji. Jika pengiriman email gagal atau isi email tidak sesuai, buat template email baru di EmailJS, atur alamat penerima admin pada bagian **To Email**, lalu ganti Template ID di `app.js` dengan ID template baru.

Jangan masukkan Private Key EmailJS atau API Key Resend ke file JavaScript.

### Buat template email

Di EmailJS → Email Templates, buat template baru. Atur **To Email** ke alamat email admin yang kamu inginkan (tetap di dashboard template, bukan dari input pengunjung).

Contoh Subject:

```text
Postingan baru ML Squad: {{category_name}}
```

Contoh Content:

```text
Ada postingan baru di ML Squad.

Nama: {{nickname}}
Kategori: {{category_name}}
ID pemain: {{player_id}}
Zone ID: {{zone_id}}
Target like: {{target}}
Rank: {{rank}}
Role: {{role}}
Catatan: {{note}}
ID postingan: {{post_id}}
```

Nama variabel di template harus sama persis dengan yang ditulis di atas. Simpan template dan salin Template ID-nya.

Di pengaturan keamanan EmailJS, batasi Allowed Origins / domain website ke domain GitHub Pages milikmu jika pengaturan itu tersedia. Public Key memang digunakan di browser, tetapi tetap batasi domain dan aktifkan pembatasan pengiriman/rate limit untuk mengurangi spam.

## 3. Firebase

Project Firebase yang dipakai: `mobile-legendkomunitas`.

- Aktifkan Authentication → Sign-in method → Anonymous.
- Buat Firestore Database.
- Pasang isi `firestore.rules` melalui Firebase Console → Firestore Database → Rules, lalu Publish.
- Tambahkan domain GitHub Pages ke Authentication → Settings → Authorized domains jika diminta.

Firebase Web API Key di `app.js` adalah konfigurasi aplikasi web. Keamanan database tetap bergantung pada Firestore Rules.

## 4. Batas versi ini

- Email pemberitahuan dikirim ke admin setiap ada postingan baru.
- Versi ini belum mengirim email untuk komentar, chat, atau persetujuan karena fitur komentar/chat/persetujuan belum ada pada kode dasar ini.
- Pembersihan postingan otomatis mingguan tidak aktif pada versi tanpa Cloud Functions. Hapus postingan lama secara manual bila diperlukan.
- EmailJS memiliki batas penggunaan sesuai paket akun. Jangan mengirim email berulang-ulang untuk percobaan.
- Jangan pernah meminta pemain membagikan password, OTP, atau informasi login Mobile Legends.
