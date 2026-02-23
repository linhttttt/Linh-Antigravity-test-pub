import os
import json
from datetime import datetime
from typing import Dict, Any
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder='dashboard')

DATA_FILE = "finance_data.json"

def load_data() -> Dict[str, Any]:
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                pass
    return {
        "balance": 0,
        "total_income": 0,
        "total_expense": 0,
        "transactions": []
    }

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def get_current_time():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

@app.route('/')
def serve_index():
    return send_from_directory('dashboard', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('dashboard', path)

@app.route('/api/data', methods=['GET'])
def get_data():
    data = load_data()
    return jsonify(data)

@app.route('/api/transaction', methods=['POST'])
def add_transaction():
    req_data = request.json
    t_type = req_data.get('type')
    amount = float(req_data.get('amount', 0))
    description = req_data.get('description', '')

    if amount <= 0 or t_type not in ['thu', 'chi']:
        return jsonify({"success": False, "error": "Invalid input"}), 400

    data = load_data()
    
    transaction = {
        "id": len(data["transactions"]) + 1,
        "type": t_type,
        "amount": amount,
        "description": description,
        "date": get_current_time()
    }
    
    if t_type == "thu":
        data["balance"] += amount
        data["total_income"] += amount
    elif t_type == "chi":
        data["balance"] -= amount
        data["total_expense"] += amount
        
    data["transactions"].append(transaction)
    save_data(data)

    return jsonify({"success": True, "data": data})

if __name__ == '__main__':
    import sys
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding='utf-8')
    print("Khởi chạy ứng dụng Web Dashboard Tài chính tại: http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
