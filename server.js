const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const DATA_FILE = path.join(__dirname, 'finance_data.json');

// Middleware
app.use(cors());
app.use(express.json()); // Để đọc được req.body dưới dạng JSON
app.use(express.static(path.join(__dirname, 'dashboard'))); // Phục vụ giao diện tĩnh Frontend

// --- Helper Funcs ---
function loadData() {
    if (fs.existsSync(DATA_FILE)) {
        try {
            const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
            return JSON.parse(fileContent);
        } catch (err) {
            console.error('Lỗi đọc file JSON:', err);
        }
    }
    // Dữ liệu mặc định nếu chưa có file
    return {
        balance: 0,
        total_income: 0,
        total_expense: 0,
        transactions: []
    };
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 4), 'utf-8');
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
app.get('/api/data', (req, res) => {
    const data = loadData();
    res.json(data);
});

// API Thêm giao dịch (Thu/Chi)
app.post('/api/transaction', (req, res) => {
    const { type, amount, description } = req.body;
    const numAmount = parseFloat(amount || 0);

    if (numAmount <= 0 || !['thu', 'chi'].includes(type)) {
        return res.status(400).json({ success: false, error: 'Invalid input' });
    }

    const data = loadData();

    const transaction = {
        id: data.transactions.length + 1,
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
    saveData(data);

    res.json({ success: true, data: data });
});

// Khởi chạy server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nKhởi chạy ứng dụng Web Dashboard Tài chính (Node.js) tại: http://localhost:${PORT}`);
    console.log(`Nhấn Ctrl + C để dừng máy chủ.\n`);
});
