// Mendapatkan referensi ke elemen-elemen DOM
const taskInput = document.getElementById('taskInput');
const dateInput = document.getElementById('dateInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const aiSuggestBtn = document.getElementById('aiSuggestBtn');
const searchInput = document.getElementById('searchInput'); // Input pencarian baru
const searchBtn = document.getElementById('searchBtn');     // Tombol pencarian baru
const filterBtn = document.getElementById('filterBtn');
const historyBtn = document.getElementById('historyBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const taskList = document.getElementById('taskList');
const noTaskMessage = document.getElementById('noTaskMessage');

// Elemen modal kustom (untuk pesan konfirmasi/informasi)
const customModal = document.getElementById('customModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalConfirmBtn = document.getElementById('modalConfirmBtn');

// Elemen modal filter baru
const filterModal = document.getElementById('filterModal');
const filterOptionBtns = document.querySelectorAll('.filter-option-btn');
const closeFilterModalBtn = document.getElementById('closeFilterModalBtn');

// Elemen modal riwayat baru
const historyModal = document.getElementById('historyModal');
const historyList = document.getElementById('historyList');
const noHistoryMessage = document.getElementById('noHistoryMessage');
const closeHistoryModalBtn = document.getElementById('closeHistoryModalBtn');

// Elemen untuk konfigurasi database
const toggleDbConfigBtn = document.getElementById('toggleDbConfigBtn'); // Tombol untuk DB Config
const dbConfigSectionWrapper = document.getElementById('dbConfigSectionWrapper'); // Wrapper untuk DB Config
const connectDbBtn = document.getElementById('connectDbBtn');
const dbStatus = document.getElementById('dbStatus');
const dbHostInput = document.getElementById('dbHost');
const dbPortInput = document.getElementById('dbPort');
const dbUserInput = document.getElementById('dbUser');
const dbPasswordInput = document.getElementById('dbPassword');
const dbNameInput = document.getElementById('dbName');


// Elemen untuk pintasan keyboard
const toggleShortcutsBtn = document.getElementById('toggleShortcutsBtn'); // Tombol baru untuk Pintasan
const shortcutsModal = document.getElementById('shortcutsModal'); // Modal baru untuk Pintasan
const closeShortcutsModalBtn = document.getElementById('closeShortcutsModalBtn'); // Tombol tutup pintasan


// Konfigurasi API Gemini
const GEMINI_API_KEY = "AIzaSyCLIfb8QUy7Vf6Jn2am_ZkITekzO7SvJkw"; // API Key (API Key Demo)
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;


// Array untuk menyimpan tugas-tugas aktif
let tasks = [];
// Array untuk menyimpan tugas-tugas yang dihapus (riwayat)
let deletedTasks = [];
// Status filter: 'all', 'completed', 'pending'
let currentFilter = 'all';
// Query pencarian saat ini
let currentSearchQuery = '';

// Fungsi untuk memuat tugas dari Local Storage
function loadTasks() {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    }
    const storedDeletedTasks = localStorage.getItem('deletedTasks');
    if (storedDeletedTasks) {
        deletedTasks = JSON.parse(storedDeletedTasks);
    }
    renderTasks(); // Render tugas setelah dimuat
}

// Fungsi untuk menyimpan tugas ke Local Storage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('deletedTasks', JSON.stringify(deletedTasks));
}

// Helper function to determine due date class
function getDueDateClass(dueDateString) {
    if (!dueDateString) return 'due-date-normal'; // No due date, no special class

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate date comparison

    const dueDate = new Date(dueDateString);
    dueDate.setHours(0, 0, 0, 0); // Reset time for accurate date comparison

    if (dueDate < today) {
        return 'due-date-overdue'; // Past due
    } else {
        const diffTime = Math.abs(dueDate.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 3) { // Due in 3 days or less (including today)
            return 'due-date-imminent';
        }
    }
    return 'due-date-normal'; // Not imminent, not overdue
}


// Fungsi untuk merender (menampilkan) tugas di UI utama
function renderTasks() {
    taskList.innerHTML = ''; // Mengosongkan daftar tugas yang ada

    // Memfilter tugas berdasarkan currentFilter dan currentSearchQuery
    const filteredAndSearchedTasks = tasks.filter(task => {
        const matchesFilter = (currentFilter === 'completed' && task.completed) ||
                              (currentFilter === 'pending' && !task.completed) ||
                              currentFilter === 'all';
        
        const matchesSearch = task.text.toLowerCase().includes(currentSearchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    // Menampilkan pesan jika tidak ada tugas yang ditemukan setelah filter
    if (filteredAndSearchedTasks.length === 0) {
        noTaskMessage.style.display = 'block'; // Tampilkan pesan
    } else {
        noTaskMessage.style.display = 'none'; // Sembunyikan pesan
        // Membuat elemen untuk setiap tugas yang difilter
        filteredAndSearchedTasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.classList.add('task-item', 'py-3', 'border-b', 'border-gray-600', 'grid', 'grid-cols-4', 'gap-4', 'items-center');
            if (task.completed) {
                taskItem.classList.add('completed'); // Tambahkan kelas 'completed' jika tugas selesai
            }

            taskItem.innerHTML = `
                <div class="task-text col-span-1">${task.text}</div>
                <div class="task-date col-span-1 ${getDueDateClass(task.dueDate)}">${task.dueDate || 'Tidak ada tanggal'}</div>
                <div class="task-status col-span-1 ${task.completed ? 'task-status-completed' : 'task-status-pending'}">${task.completed ? 'Selesai' : 'Pending'}</div>
                <div class="task-actions col-span-1 flex gap-2 justify-center">
                    <button class="complete-btn bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm transition duration-200 ease-in-out" data-id="${task.id}">
                        <i class="fas ${task.completed ? 'fa-times' : 'fa-check'}"></i>
                    </button>
                    <button class="delete-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition duration-200 ease-in-out" data-id="${task.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            taskList.appendChild(taskItem);
        });
    }

    addEventListenersToTaskButtons(); // Menambahkan event listener ke tombol-tombol yang baru dibuat
}

// Fungsi untuk merender (menampilkan) tugas di UI riwayat
function renderHistoryTasks() {
    historyList.innerHTML = ''; // Mengosongkan daftar riwayat yang ada

    if (deletedTasks.length === 0) {
        noHistoryMessage.style.display = 'block'; // Tampilkan pesan
    } else {
        noHistoryMessage.style.display = 'none'; // Sembunyikan pesan
        deletedTasks.forEach(task => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item', 'py-3', 'border-b', 'border-gray-600', 'grid', 'grid-cols-3', 'gap-4', 'items-center');

            historyItem.innerHTML = `
                <div class="history-text col-span-1">${task.text}</div>
                <div class="history-date col-span-1">${task.dueDate || 'Tidak ada tanggal'}</div>
                <div class="history-actions col-span-1 flex gap-2 justify-center">
                    <button class="restore-btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition duration-200 ease-in-out" data-id="${task.id}">
                        <i class="fas fa-undo-alt"></i>
                    </button>
                    <button class="permanent-delete-btn bg-red-700 hover:bg-red-800 text-white px-3 py-1 rounded-md text-sm transition duration-200 ease-in-out" data-id="${task.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            historyList.appendChild(historyItem);
        });
    }
    addEventListenersToHistoryButtons(); // Menambahkan event listener ke tombol-tombol riwayat
}

// Fungsi untuk menambahkan event listener ke tombol-tombol tugas (selesai, hapus)
function addEventListenersToTaskButtons() {
    // Event listener untuk tombol 'Selesai'/'Batalkan'
    document.querySelectorAll('.complete-btn').forEach(button => {
        button.onclick = (event) => {
            const taskId = event.target.dataset.id;
            toggleTaskCompletion(taskId);
        };
    });

    // Event listener untuk tombol 'Hapus' (memindahkan ke riwayat)
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.onclick = async (event) => {
            const taskId = event.target.dataset.id;
            const confirmed = await showModal('Konfirmasi', 'Apakah Anda yakin ingin menghapus tugas ini? Tugas akan dipindahkan ke riwayat.', true);
            if (confirmed) {
                softDeleteTask(taskId); // Panggil fungsi soft delete
                await showModal('Berhasil!', 'Tugas berhasil dihapus dan dipindahkan ke riwayat.');
            }
        };
    });
}

// Fungsi untuk menambahkan event listener ke tombol-tombol riwayat (pulihkan, hapus permanen)
function addEventListenersToHistoryButtons() {
    // Event listener untuk tombol 'Pulihkan'
    document.querySelectorAll('.restore-btn').forEach(button => {
        button.onclick = async (event) => {
            const taskId = event.target.dataset.id;
            const confirmed = await showModal('Konfirmasi', 'Apakah Anda yakin ingin memulihkan tugas ini?', true);
            if (confirmed) {
                restoreTask(taskId);
                await showModal('Berhasil!', 'Tugas berhasil dipulihkan.');
                renderHistoryTasks(); // Render ulang riwayat setelah pemulihan
            }
        };
    });

    // Event listener untuk tombol 'Hapus Permanen'
    document.querySelectorAll('.permanent-delete-btn').forEach(button => {
        button.onclick = async (event) => {
            const taskId = event.target.dataset.id;
            const confirmed = await showModal('Konfirmasi', 'Apakah Anda yakin ingin menghapus tugas ini secara permanen? Tindakan ini tidak dapat dibatalkan.', true);
            if (confirmed) {
                permanentDeleteTask(taskId);
                await showModal('Berhasil!', 'Tugas berhasil dihapus secara permanen.');
                renderHistoryTasks(); // Render ulang riwayat setelah penghapusan permanen
            }
        };
    });
}


// Fungsi untuk mengubah status selesai/pending tugas
function toggleTaskCompletion(id) {
    tasks = tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveTasks(); // Simpan tugas
    renderTasks(); // Render ulang daftar tugas
}

// Fungsi untuk "menghapus lunak" tugas (memindahkan ke riwayat)
function softDeleteTask(id) {
    const taskItemElement = document.querySelector(`.task-item[data-id="${id}"]`);
    if (taskItemElement) {
        taskItemElement.classList.add('fade-out');
        taskItemElement.addEventListener('animationend', () => {
            const taskToDelete = tasks.find(task => task.id === id);
            if (taskToDelete) {
                tasks = tasks.filter(task => task.id !== id);
                deletedTasks.push(taskToDelete);
                saveTasks();
                renderTasks(); // Re-render setelah animasi selesai
            }
        }, { once: true }); // Pastikan listener hanya berjalan sekali
    } else {
        // Fallback jika elemen tidak ditemukan (misalnya, sudah dihapus atau ada kesalahan)
        const taskToDelete = tasks.find(task => task.id === id);
        if (taskToDelete) {
            tasks = tasks.filter(task => task.id !== id);
            deletedTasks.push(taskToDelete);
            saveTasks();
            renderTasks();
        }
    }
}

// Fungsi untuk menghapus tugas secara permanen dari riwayat
function permanentDeleteTask(id) {
    const historyItemElement = document.querySelector(`#historyList .history-item[data-id="${id}"]`);
    if (historyItemElement) {
        historyItemElement.classList.add('fade-out');
        historyItemElement.addEventListener('animationend', () => {
            deletedTasks = deletedTasks.filter(task => task.id !== id);
            saveTasks();
            renderHistoryTasks(); // Re-render setelah animasi selesai
        }, { once: true });
    } else {
        // Fallback
        deletedTasks = deletedTasks.filter(task => task.id !== id);
        saveTasks();
        renderHistoryTasks();
    }
}

// Fungsi untuk memulihkan tugas dari riwayat ke daftar tugas utama
function restoreTask(id) {
    const taskToRestore = deletedTasks.find(task => task.id === id);
    if (taskToRestore) {
        deletedTasks = deletedTasks.filter(task => task.id !== id);
        tasks.push(taskToRestore); // Tambahkan kembali ke array tugas aktif
        saveTasks();
        renderTasks(); // Render ulang daftar tugas utama
    }
}

// Fungsi untuk mendapatkan tanggal hari ini dalam formatgetFullYear()-MM-DD
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Bulan dimulai dari 0
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Memuat tugas saat halaman pertama kali dimuat
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    // Set tanggal input ke tanggal hari ini secara default
    dateInput.value = getTodayDate();
});


// ====== Kode Modal Kustom (untuk pesan konfirmasi/informasi) ======
let modalResolve;

function showModal(title, message, showCancel = false) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalCancelBtn.style.display = showCancel ? 'block' : 'none';
    customModal.classList.remove('hidden');
    customModal.classList.remove('modal-closing'); // Pastikan tidak ada kelas closing
    customModal.classList.add('active');

    return new Promise((resolve) => {
        modalResolve = resolve;
    });
}

function hideModal() {
    customModal.classList.add('modal-closing');
    customModal.addEventListener('animationend', () => {
        customModal.classList.remove('active', 'modal-closing');
        customModal.classList.add('hidden');
    }, { once: true });
}

modalConfirmBtn.onclick = () => {
    hideModal();
    if (modalResolve) modalResolve(true);
};

modalCancelBtn.onclick = () => {
    hideModal();
    if (modalResolve) modalResolve(false);
};

// ====== Modifikasi Fungsi yang Menggunakan Alert/Confirm ======

// Ganti alert di addTaskBtn
addTaskBtn.addEventListener('click', async () => {
    const taskText = taskInput.value.trim();
    // Gunakan tanggal yang dipilih pengguna, atau tanggal hari ini jika kosong
    const dueDate = dateInput.value || getTodayDate(); 

    if (taskText) {
        const newTask = {
            id: Date.now().toString(),
            text: taskText,
            dueDate: dueDate,
            completed: false
        };
        tasks.push(newTask);
        taskInput.value = '';
        dateInput.value = getTodayDate(); // Set kembali tanggal ke hari ini setelah menambahkan
        saveTasks();
        
        // Render ulang daftar tugas dan tambahkan animasi fade-in ke tugas baru
        renderTasks(); 
        const newTaskElement = document.querySelector(`.task-item[data-id="${newTask.id}"]`);
        if (newTaskElement) {
            newTaskElement.classList.add('fade-in');
        }

        // Tampilkan modal sukses setelah menambahkan tugas
        await showModal('Berhasil!', 'Tugas berhasil ditambahkan.');
    } else {
        await showModal('Peringatan', 'Tugas tidak boleh kosong!');
    }
});

// Ganti confirm di deleteAllBtn
deleteAllBtn.addEventListener('click', async () => {
    const confirmed = await showModal(
        'Konfirmasi', 
        'Apakah Anda yakin ingin menghapus semua tugas? Ini akan memindahkan semua tugas ke riwayat.',
        true
    );
    
    if (confirmed) {
        // Pindahkan semua tugas aktif ke deletedTasks
        // Untuk animasi hapus semua, kita bisa memudar semua item satu per satu atau langsung menghapus.
        // Untuk kesederhanaan, kita akan langsung memindahkan dan merender ulang.
        deletedTasks = [...deletedTasks, ...tasks];
        tasks = []; // Kosongkan daftar tugas aktif
        saveTasks();
        renderTasks();
        await showModal('Berhasil!', 'Semua tugas telah dihapus dan dipindahkan ke riwayat.');
    }
});

// ====== Fungsi dan Event Listener untuk Modal Filter ======

// Fungsi untuk menampilkan modal filter
function showFilterModal() {
    filterModal.classList.remove('hidden');
    filterModal.classList.remove('modal-closing'); // Pastikan tidak ada kelas closing
    filterModal.classList.add('active');
}

// Fungsi untuk menyembunyikan modal filter
function hideFilterModal() {
    filterModal.classList.add('modal-closing');
    filterModal.addEventListener('animationend', () => {
        filterModal.classList.remove('active', 'modal-closing');
        filterModal.classList.add('hidden');
    }, { once: true });
}

// Event listener untuk tombol FILTER utama
filterBtn.addEventListener('click', () => {
    showFilterModal();
});

// Event listener untuk tombol opsi filter di dalam modal
filterOptionBtns.forEach(button => {
    button.addEventListener('click', (event) => {
        currentFilter = event.target.dataset.filter;
        renderTasks(); // Render ulang tugas dengan filter baru
        hideFilterModal(); // Sembunyikan modal setelah memilih filter
    });
});

// Event listener untuk tombol Tutup di modal filter
closeFilterModalBtn.addEventListener('click', () => {
    hideFilterModal();
});

// ====== Fungsi dan Event Listener untuk Modal Riwayat ======

// Fungsi untuk menampilkan modal riwayat
function showHistoryModal() {
    renderHistoryTasks(); // Pastikan riwayat terbaru dirender sebelum ditampilkan
    historyModal.classList.remove('hidden');
    historyModal.classList.remove('modal-closing'); // Pastikan tidak ada kelas closing
    historyModal.classList.add('active');
}

// Fungsi untuk menyembunyikan modal riwayat
function hideHistoryModal() {
    historyModal.classList.add('modal-closing');
    historyModal.addEventListener('animationend', () => {
        historyModal.classList.remove('active', 'modal-closing');
        historyModal.classList.add('hidden');
    }, { once: true });
}

// Event listener untuk tombol RIWAYAT utama
historyBtn.addEventListener('click', () => {
    showHistoryModal();
});

// Event listener untuk tombol Tutup di modal riwayat
closeHistoryModalBtn.addEventListener('click', () => {
    hideHistoryModal();
});

// ====== Fungsi dan Event Listener untuk Integrasi AI ======

// Fungsi untuk mendapatkan saran dari Gemini AI
async function getAISuggestion(promptText) {
    if (!promptText.trim()) {
        await showModal('Peringatan', 'Masukkan beberapa teks untuk mendapatkan saran AI.');
        return;
    }

    aiSuggestBtn.disabled = true; // Nonaktifkan tombol saat memuat
    aiSuggestBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span class="ml-2 hidden sm:inline">Memuat...</span>'; // Tampilkan spinner

    try {
        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: `Berikan deskripsi tugas yang lebih detail atau kembangkan ide berikut dalam satu kalimat saja: "${promptText}"` }] });
        const payload = { contents: chatHistory };

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const suggestedText = result.candidates[0].content.parts[0].text.trim();
            
            // Tampilkan modal konfirmasi
            const confirmed = await showModal(
                'Saran AI Ditemukan!',
                `Saran: "${suggestedText}"\n\nApakah Anda ingin menerapkan saran ini?`,
                true // Tampilkan tombol batal
            );

            if (confirmed) {
                taskInput.value = suggestedText; // Terapkan saran jika dikonfirmasi
                await showModal('Berhasil!', 'Saran AI berhasil diterapkan.');
            } else {
                await showModal('Informasi', 'Saran AI tidak diterapkan.');
            }

        } else {
            await showModal('Error AI', 'Tidak dapat mendapatkan saran AI. Coba lagi.');
        }
    } catch (error) {
        console.error('Error fetching AI suggestion:', error);
        await showModal('Error AI', 'Terjadi kesalahan saat menghubungi AI. Periksa koneksi Anda atau coba lagi nanti.');
    } finally {
        aiSuggestBtn.disabled = false; // Aktifkan kembali tombol
        aiSuggestBtn.innerHTML = '<i class="fas fa-lightbulb"></i> <span class="ml-2 hidden sm:inline">AI</span>'; // Kembalikan teks tombol
    }
}

// Event listener untuk tombol AI Suggest
aiSuggestBtn.addEventListener('click', () => {
    getAISuggestion(taskInput.value);
});

// ====== Fungsi dan Event Listener untuk Pencarian Tugas ======
function searchTasks() {
    currentSearchQuery = searchInput.value.trim();
    renderTasks(); // Render ulang tugas dengan query pencarian baru
}

searchBtn.addEventListener('click', searchTasks);
searchInput.addEventListener('keyup', (event) => {
    // Memicu pencarian saat tombol Enter ditekan di input pencarian
    if (event.key === 'Enter') {
        searchTasks();
    } else {
        // Atau lakukan pencarian real-time saat teks berubah
        searchTasks();
    }
});

// ====== Fungsi dan Event Listener untuk Konfigurasi Database ======
toggleDbConfigBtn.addEventListener('click', () => {
    dbConfigSectionWrapper.classList.toggle('hidden'); // Mengubah visibilitas
});

// Fungsi simulasi koneksi database
connectDbBtn.addEventListener('click', async () => {
    const host = dbHostInput.value.trim();
    const port = dbPortInput.value.trim();
    const user = dbUserInput.value.trim();
    const password = dbPasswordInput.value.trim();
    const dbName = dbNameInput.value.trim();

    if (!host || !port || !user || !password || !dbName) {
        dbStatus.textContent = 'Error: Semua kolom harus diisi!';
        dbStatus.classList.remove('text-green-400');
        dbStatus.classList.add('text-red-400');
        return;
    }

    dbStatus.textContent = 'Menghubungkan...';
    dbStatus.classList.remove('text-red-400', 'text-green-400');
    dbStatus.classList.add('text-yellow-400');

    // Simulasi koneksi asinkron
    await new Promise(resolve => setTimeout(resolve, 1500)); // Tunggu 1.5 detik

    // Di sini Anda akan mengintegrasikan dengan backend Anda untuk koneksi database yang sebenarnya
    // Contoh: fetch('/api/connect-db', { method: 'POST', body: JSON.stringify({ host, port, user, password, dbName }) });

    // Untuk demo, kita asumsikan koneksi berhasil
    const success = Math.random() > 0.2; // 80% kemungkinan berhasil

    if (success) {
        dbStatus.textContent = 'Koneksi Berhasil!';
        dbStatus.classList.remove('text-red-400', 'text-yellow-400');
        dbStatus.classList.add('text-green-400');
        await showModal('Koneksi Berhasil', 'Simulasi koneksi database berhasil. Ingat, ini hanya demo frontend!');
    } else {
        dbStatus.textContent = 'Koneksi Gagal. Periksa kredensial atau host.';
        dbStatus.classList.remove('text-green-400', 'text-yellow-400');
        dbStatus.classList.add('text-red-400');
        await showModal('Koneksi Gagal', 'Simulasi koneksi database gagal. Periksa kembali detail yang Anda masukkan.');
    }
});


// ====== Fungsi dan Event Listener untuk Pintasan Keyboard ======

// Fungsi untuk menampilkan modal pintasan
function showShortcutsModal() {
    shortcutsModal.classList.remove('hidden');
    shortcutsModal.classList.remove('modal-closing'); // Pastikan tidak ada kelas closing
    shortcutsModal.classList.add('active');
}

// Fungsi untuk menyembunyikan modal pintasan
function hideShortcutsModal() {
    shortcutsModal.classList.add('modal-closing');
    shortcutsModal.addEventListener('animationend', () => {
        shortcutsModal.classList.remove('active', 'modal-closing');
        shortcutsModal.classList.add('hidden');
    }, { once: true });
}

toggleShortcutsBtn.addEventListener('click', () => {
    showShortcutsModal(); // Menampilkan modal pintasan
});

closeShortcutsModalBtn.addEventListener('click', () => {
    hideShortcutsModal(); // Menyembunyikan modal pintasan
});


// ====== Keyboard Shortcuts ======
document.addEventListener('keydown', (event) => {
    // Menutup modal/overlay dengan tombol Escape
    if (event.key === 'Escape') {
        if (customModal.classList.contains('active')) {
            hideModal();
        }
        if (filterModal.classList.contains('active')) {
            hideFilterModal();
        }
        if (historyModal.classList.contains('active')) {
            hideHistoryModal();
        }
        if (shortcutsModal.classList.contains('active')) { // Sembunyikan pintasan keyboard jika terbuka
            hideShortcutsModal();
        }
        // Juga sembunyikan konfigurasi DB jika terbuka
        if (!dbConfigSectionWrapper.classList.contains('hidden')) {
            dbConfigSectionWrapper.classList.add('hidden');
        }
    }

    // Menambah tugas dengan Enter saat input tugas aktif
    if (event.key === 'Enter' && document.activeElement === taskInput) {
        event.preventDefault(); // Mencegah perilaku default Enter (misalnya submit form)
        addTaskBtn.click(); // Memicu klik tombol tambah tugas
    }

    // Shortcut untuk membuka modal Filter (Ctrl + F atau Cmd + F)
    if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault(); // Mencegah perilaku default browser (find)
        showFilterModal();
    }

    // Shortcut untuk membuka modal Riwayat (Ctrl + H atau Cmd + H)
    if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
        event.preventDefault(); // Mencegah perilaku default browser (history)
        showHistoryModal();
    }

    // Shortcut untuk memicu saran AI (Ctrl + A atau Cmd + A)
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault(); // Mencegah perilaku default browser (select all)
        aiSuggestBtn.click(); // Memicu klik tombol AI Suggest
    }

    // Shortcut untuk fokus ke input pencarian (Ctrl + S atau Cmd + S)
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault(); // Mencegah perilaku default browser (save)
        searchInput.focus();
    }

    // Shortcut untuk menghapus semua tugas (Ctrl + D atau Cmd + D)
    if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault(); 
        deleteAllBtn.click(); // Memicu klik tombol Hapus Semua
    }

    // Shortcut untuk fokus ke input tugas baru (Ctrl + N atau Cmd + N)
    if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault(); 
        taskInput.focus();
    }

    // Shortcut untuk memuat ulang daftar tugas (Ctrl + L atau Cmd + L)
    if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
        event.preventDefault(); 
        loadTasks(); // Memuat ulang tugas dari local storage dan merender
        showModal('Informasi', 'Daftar tugas telah dimuat ulang.');
    }

    // Shortcut untuk menampilkan/menyembunyikan pintasan keyboard (Ctrl + J atau Cmd + J)
    if ((event.ctrlKey || event.metaKey) && event.key === 'j') {
        event.preventDefault(); 
        toggleShortcutsBtn.click(); // Memicu klik tombol toggle Pintasan Keyboard
    }

    // Shortcut untuk menampilkan/menyembunyikan konfigurasi database (Ctrl + K atau Cmd + K)
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault(); 
        toggleDbConfigBtn.click(); // Memicu klik tombol toggle DB Config
    }
});
