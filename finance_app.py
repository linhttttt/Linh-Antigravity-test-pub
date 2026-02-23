import json
import os
from datetime import datetime

DATA_FILE = "finance_data.json"

def load_data():
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

def add_transaction(data, t_type, amount, description):
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
    
    action = "Thu" if t_type == "thu" else "Chi"
    print(f"Đã ghi nhận khoản {action.lower()}: {amount:,.0f} VNĐ - Lý do: {description}")

def view_report(data):
    print("\n" + "="*40)
    print("           BÁO CÁO TÀI CHÍNH           ")
    print("="*40)
    print(f"Số dư hiện tại : {data['balance']:,.0f} VNĐ")
    print(f"Tổng Thu       : {data['total_income']:,.0f} VNĐ")
    print(f"Tổng Chi       : {data['total_expense']:,.0f} VNĐ")
    print("\n--- LỊCH SỬ GIAO DỊCH ---")
    
    if not data["transactions"]:
        print("Chưa có giao dịch nào.")
    else:
        for t in data["transactions"]:
            sign = "+" if t["type"] == "thu" else "-"
            print(f"[{t['date']}] {sign}{t['amount']:,.0f} VNĐ | {t['type'].upper()} | {t['description']}")
    print("="*40)

def main():
    data = load_data()
    while True:
        print("\n" + "="*30)
        print("  QUẢN LÝ TÀI CHÍNH CÁ NHÂN  ")
        print("="*30)
        print("1. Thêm khoản Thu")
        print("2. Thêm khoản Chi")
        print("3. Xem Báo cáo")
        print("4. Thoát")
        print("="*30)
        
        choice = input("Nhập lựa chọn của bạn (1-4): ")
        
        if choice == '1':
            try:
                amount = float(input("Nhập số tiền thu (VNĐ): "))
                if amount <= 0:
                    print("Số tiền phải lớn hơn 0.")
                    continue
                description = input("Nhập mô tả khoản thu (VD: Lương, Thưởng...): ")
                add_transaction(data, "thu", amount, description)
            except ValueError:
                print("Lỗi: Vui lòng nhập số tiền hợp lệ.")
                
        elif choice == '2':
            try:
                amount = float(input("Nhập số tiền chi (VNĐ): "))
                if amount <= 0:
                    print("Số tiền phải lớn hơn 0.")
                    continue
                description = input("Nhập mô tả khoản chi (VD: Ăn sáng, Mua sắm...): ")
                add_transaction(data, "chi", amount, description)
            except ValueError:
                print("Lỗi: Vui lòng nhập số tiền hợp lệ.")
                
        elif choice == '3':
            view_report(data)
            
        elif choice == '4':
            print("Tạm biệt. Hẹn gặp lại!")
            break
        else:
            print("Lựa chọn không hợp lệ, vui lòng chọn lại.")

if __name__ == "__main__":
    main()
