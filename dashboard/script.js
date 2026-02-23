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

    // API calls and UI updates
    async function loadMainData() {
        let data;
        try {
            // Try fetching from backend first
            const res = await fetch('/api/data');
            if (!res.ok) throw new Error('Network error');
            data = await res.json();
        } catch (err) {
            console.log('Không tìm thấy Backend. Chuyển sang sử dụng LocalStorage (Chế độ chạy tĩnh trên GitHub Pages).');
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
            const res = await fetch('/api/transaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: type,
                    amount: amount,
                    description: desc
                })
            });

            if (res.ok) {
                closeTransactionModal();
                loadMainData(); // Refresh API
            } else {
                alert('Có lỗi xảy ra khi lưu giao dịch');
            }
        } catch (err) {
            console.log('Không kết nối được server, lưu cục bộ qua LocalStorage...');
            
            // Xử lý lưu local
            let data = getLocalStorageData();
            let numAmount = parseFloat(amount) || 0;
            
            const transaction = {
                id: data.transactions.length + 1,
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
            saveLocalStorageData(data);

            closeTransactionModal();
            loadMainData(); // Refresh UI
            
            alert('Đã lưu thành công (Chế độ Local).');
        } finally {
            btn.textContent = 'Xác nhận';
            btn.disabled = false;
        }
    }

    // Initial load
    loadMainData();
});
