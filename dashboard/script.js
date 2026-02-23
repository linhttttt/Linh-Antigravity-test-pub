import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Firebase configuration (Public config is safe for Frontend)
const firebaseConfig = {
    databaseURL: "https://linh-antigravity-test-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {
    // Checkbox styling handler
    const checkboxes = document.querySelectorAll('.task-item input[type="checkbox"]');

    checkboxes.forEach(box => {
        box.addEventListener('change', (e) => {
            const label = e.target.nextElementSibling;
            if (e.target.checked) {
                label.classList.add('checked-label');
            } else {
                label.classList.remove('checked-label');
            }
        });
    });

    // Simple Pomodoro Timer Logic (Visual Only)
    const playBtn = document.getElementById('start-pomodoro');
    const timerDisplay = document.querySelector('.timer-display h2');
    let isPlaying = false;
    let timerInterval;
    let minutes = 25;
    let seconds = 0;

    playBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        const icon = playBtn.querySelector('i');

        if (isPlaying) {
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');

            timerInterval = setInterval(() => {
                if (seconds === 0) {
                    if (minutes === 0) {
                        clearInterval(timerInterval);
                        isPlaying = false;
                        icon.classList.add('fa-play');
                        icon.classList.remove('fa-pause');
                        return;
                    }
                    minutes--;
                    seconds = 59;
                } else {
                    seconds--;
                }

                timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }, 1000);
        } else {
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            clearInterval(timerInterval);
        }
    });

    // Helper function for LocalStorage fallback
    function getLocalStorageData() {
        const stored = localStorage.getItem('finance_data');
        if (stored) {
            return JSON.parse(stored);
        }
        return {
            balance: 0,
            total_income: 0,
            total_expense: 0,
            transactions: []
        };
    }

    function saveLocalStorageData(data) {
        localStorage.setItem('finance_data', JSON.stringify(data));
    }

    // Firebase calls and UI updates
    async function loadMainData() {
        let data;
        try {
            // Lấy dữ liệu từ Firebase
            const snapshot = await get(ref(db, 'finances'));
            if (snapshot.exists()) {
                data = snapshot.val();
                if (!data.transactions) data.transactions = [];
            } else {
                data = getLocalStorageData(); // Default
            }
        } catch (err) {
            console.error('Không tải được dữ liệu từ Firebase. Sử dụng LocalStorage.', err);
            data = getLocalStorageData();
        }

        // Format vnđ
        const formatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

        // Update UI
        document.getElementById('display-balance').textContent = formatter.format(data.balance);
        document.getElementById('display-expense').textContent = `Đã chi: ${formatter.format(data.total_expense)}`;
        document.getElementById('display-income').textContent = `Tổng thu: ${formatter.format(data.total_income)}`;

        // Calculate progress based on total income vs total expense
        let percentage = 0;
        if (data.total_income > 0) {
            percentage = Math.min(100, Math.round((data.total_expense / data.total_income) * 100));
        }

        document.getElementById('display-percentage').textContent = `${percentage}%`;
        document.getElementById('display-progress-bar').style.width = `${percentage}%`;

        return data; // Return it so submitTransaction can use current state
    }

    // Global modal funcs for inline HTML onclicks
    window.openTransactionModal = function (type) {
        document.getElementById('trans-type').value = type;
        document.getElementById('transactionModal').style.display = 'flex';
        document.getElementById('trans-amount').value = '';
        document.getElementById('trans-desc').value = '';

        if (type === 'thu') {
            document.getElementById('modal-title').textContent = 'Thêm Giao Dịch Thu (Cộng tiền)';
        } else {
            document.getElementById('modal-title').textContent = 'Thêm Giao Dịch Chi (Trừ tiền)';
        }
    }

    window.closeTransactionModal = function () {
        document.getElementById('transactionModal').style.display = 'none';
    }

    window.submitTransaction = async function (e) {
        e.preventDefault();

        const type = document.getElementById('trans-type').value;
        const amount = document.getElementById('trans-amount').value;
        const desc = document.getElementById('trans-desc').value;

        // Disable inputs while submitting
        const btn = document.getElementById('submit-btn');
        btn.textContent = 'Đang lưu...';
        btn.disabled = true;

        try {
            // Cập nhật lên Firebase trực tiếp từ Trình duyệt
            let data = await loadMainData(); // Get current fresh state
            let numAmount = parseFloat(amount) || 0;

            const transaction = {
                id: (data.transactions ? data.transactions.length : 0) + 1,
                type: type,
                amount: numAmount,
                description: desc,
                date: new Date().toISOString().replace('T', ' ').substring(0, 19)
            };

            if (type === "thu") {
                data.balance += numAmount;
                data.total_income += numAmount;
            } else if (type === "chi") {
                data.balance -= numAmount;
                data.total_expense += numAmount;
            }

            data.transactions.push(transaction);

            // Push to Firebase
            await set(ref(db, 'finances'), data);

            // Backup locally
            saveLocalStorageData(data);

            closeTransactionModal();
            loadMainData(); // Refresh UI

        } catch (err) {
            console.error('Lỗi khi lưu lên Firebase:', err);
            alert('Không kết nối được Data (Lưu tạm Storage).');
        } finally {
            btn.textContent = 'Xác nhận';
            btn.disabled = false;
        }
    }

    // Initial load
    loadMainData();
});
