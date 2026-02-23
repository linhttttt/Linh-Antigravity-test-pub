const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');

const app = express();
const PORT = 5000;

// Initialize Firebase
const serviceAccount = require('./firebase-key.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://linh-antigravity-test-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

// Middleware
app.use(cors());
app.use(express.json()); // Để đọc được req.body dưới dạng JSON
app.use(express.static(path.join(__dirname, 'dashboard'))); // Phục vụ giao diện tĩnh Frontend

// --- Helper Funcs ---
async function loadData() {
    try {
        const snapshot = await db.ref('finances').once('value');
        const data = snapshot.val();
        if (data) {
            // Đảm bảo transactions luôn là mảng
            if (!data.transactions) {
                data.transactions = [];
            }
            return data;
        }
    } catch (err) {
        console.error('Lỗi đọc dữ liệu từ Firebase:', err);
    }
    // Dữ liệu mặc định nếu chưa có
    return {
        balance: 0,
        total_income: 0,
        total_expense: 0,
        transactions: []
    };
}

async function saveData(data) {
    try {
        await db.ref('finances').set(data);
    } catch (err) {
        console.error('Lỗi lưu dữ liệu lên Firebase:', err);
    }
}

function getCurrentTime() {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
}

// --- API Endpoints ---

// Phục vụ file màn hình chính (giống app.route('/'))
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
});

// API Lấy dữ liệu 
app.get('/api/data', async (req, res) => {
    const data = await loadData();
    res.json(data);
});

// API Thêm giao dịch (Thu/Chi)
app.post('/api/transaction', async (req, res) => {
    const { type, amount, description } = req.body;
    const numAmount = parseFloat(amount || 0);

    if (numAmount <= 0 || !['thu', 'chi'].includes(type)) {
        return res.status(400).json({ success: false, error: 'Invalid input' });
    }

    const data = await loadData();

    const transaction = {
        id: (data.transactions ? data.transactions.length : 0) + 1,
        type: type,
        amount: numAmount,
        description: description || '',
        date: getCurrentTime()
    };

    if (type === 'thu') {
        data.balance += numAmount;
        data.total_income += numAmount;
    } else if (type === 'chi') {
        data.balance -= numAmount;
        data.total_expense += numAmount;
    }

    data.transactions.push(transaction);
    await saveData(data);

    res.json({ success: true, data: data });
});

// Khởi chạy server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nKhởi chạy ứng dụng Web Dashboard Tài chính (Node.js) tại: http://localhost:${PORT}`);
    console.log(`Nhấn Ctrl + C để dừng máy chủ.\n`);
});
