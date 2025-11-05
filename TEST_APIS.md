# 🧪 HƯỚNG DẪN TEST APIs - Phần 1b Quản lý bán hàng

## 📋 Chuẩn bị

### 1. Khởi động server
```bash
npm start
```
Server sẽ chạy tại: `http://localhost:3000`

### 2. Lấy Token
Đăng nhập để lấy Bearer Token:

**POST** `http://localhost:3000/api/client/account/login`

Body:
```json
{
  "email": "dealer@example.com",
  "password": "password123"
}
```

Response sẽ trả về `token`. Copy token này để dùng cho các API tiếp theo.

**Authorization Header cho tất cả APIs dưới đây:**
```
Authorization: Bearer {token}
```

---

## 🔥 TEST CASES

### 1️⃣ INVENTORY APIs (Tồn kho)

#### 1.1. Xem danh sách tồn kho
**GET** `http://localhost:3000/api/client/inventory`

Query Parameters (optional):
- `page=1`
- `limit=20`
- `keyword=vinfast`
- `categoryId=xxx`
- `lowStock=true` (lọc sản phẩm sắp hết hàng)

Expected Response:
```json
{
  "success": true,
  "message": "Lấy danh sách tồn kho thành công!",
  "data": {
    "inventories": [
      {
        "inventoryId": "...",
        "product": {
          "id": "...",
          "name": "VinFast VF 8",
          "version": "Plus",
          "images": [],
          "basePrice": 1200000000
        },
        "variant": {
          "index": 0,
          "hash": "...",
          "attributeValue": [],
          "price": 1200000000
        },
        "stock": 5,
        "reservedStock": 0,
        "availableStock": 5,
        "wholesalePrice": 1150000000,
        "lastUpdatedAt": "2024-11-05T..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalRecords": 5,
      "totalPages": 1
    }
  }
}
```

#### 1.2. Xem tồn kho của 1 sản phẩm
**GET** `http://localhost:3000/api/client/inventory/:productId`

Expected Response:
```json
{
  "success": true,
  "message": "Lấy thông tin tồn kho sản phẩm thành công!",
  "data": {
    "product": { ... },
    "variants": [
      {
        "index": 0,
        "attributeValue": [],
        "price": 1200000000,
        "wholesalePrice": 1150000000,
        "inventory": {
          "stock": 5,
          "reservedStock": 0,
          "availableStock": 5
        }
      }
    ],
    "summary": {
      "totalStock": 5,
      "totalReserved": 0,
      "totalAvailable": 5,
      "variantsInStock": 2,
      "totalVariants": 3
    }
  }
}
```

---

### 2️⃣ ALLOCATION REQUEST APIs (Đặt hàng từ Hãng)

#### 2.1. Xem danh sách yêu cầu đặt hàng
**GET** `http://localhost:3000/api/client/allocation-requests`

Query Parameters (optional):
- `page=1`
- `limit=20`
- `status=pending` (draft/pending/approved/rejected/processing/completed/cancelled)

Expected Response:
```json
{
  "success": true,
  "message": "Lấy danh sách yêu cầu đặt hàng thành công!",
  "data": {
    "requests": [
      {
        "id": "...",
        "requestNumber": "REQ-20241105-0001",
        "totalQuantity": 10,
        "requestType": "normal",
        "priority": "medium",
        "status": "pending",
        "items": [
          {
            "productId": "...",
            "productName": "VinFast VF 8",
            "variantIndex": 0,
            "quantity": 10,
            "estimatedPrice": 1150000000
          }
        ],
        "createdAt": "2024-11-05T..."
      }
    ],
    "pagination": { ... }
  }
}
```

#### 2.2. Tạo yêu cầu đặt hàng mới
**POST** `http://localhost:3000/api/client/allocation-requests`

Body:
```json
{
  "items": [
    {
      "productId": "673a1234567890abcdef1234",
      "variantIndex": 0,
      "quantity": 10,
      "estimatedPrice": 1150000000,
      "notes": "Cần gấp cho khách đặt trước"
    }
  ],
  "requestType": "urgent",
  "priority": "high",
  "expectedDeliveryDate": "2024-12-01",
  "reason": "Đơn hàng từ khách VIP, cần giao trước tháng 12",
  "notes": "Liên hệ trước khi giao",
  "submitNow": false
}
```

**submitNow:**
- `false` = Lưu nháp (status: draft)
- `true` = Gửi ngay (status: pending)

Expected Response:
```json
{
  "success": true,
  "message": "Lưu nháp yêu cầu đặt hàng thành công!",
  "data": {
    "requestId": "...",
    "requestNumber": "REQ-20241105-0001",
    "status": "draft"
  }
}
```

#### 2.3. Chi tiết yêu cầu đặt hàng
**GET** `http://localhost:3000/api/client/allocation-requests/:id`

#### 2.4. Gửi yêu cầu (draft → pending)
**PATCH** `http://localhost:3000/api/client/allocation-requests/:id/submit`

Body: (empty)

Expected Response:
```json
{
  "success": true,
  "message": "Gửi yêu cầu đặt hàng thành công!",
  "data": {
    "requestId": "...",
    "status": "pending",
    "submittedAt": "2024-11-05T..."
  }
}
```

#### 2.5. Hủy yêu cầu
**PATCH** `http://localhost:3000/api/client/allocation-requests/:id/cancel`

Body:
```json
{
  "cancelReason": "Khách hủy đơn"
}
```

---

### 3️⃣ ALLOCATION TRACKING APIs (Theo dõi xe được phân bổ)

#### 3.1. Thống kê tổng quan
**GET** `http://localhost:3000/api/client/allocations/summary`

Expected Response:
```json
{
  "success": true,
  "message": "Lấy thống kê phân bổ thành công!",
  "data": {
    "summary": {
      "total": 15,
      "pending": 3,
      "allocated": 5,
      "shipped": 4,
      "delivered": 2,
      "cancelled": 1,
      "totalQuantity": 50,
      "totalVins": 45
    }
  }
}
```

#### 3.2. Danh sách xe được phân bổ
**GET** `http://localhost:3000/api/client/allocations`

Query Parameters (optional):
- `page=1`
- `limit=20`
- `status=allocated` (pending/allocated/shipped/delivered/cancelled)
- `productId=xxx`

Expected Response:
```json
{
  "success": true,
  "message": "Lấy danh sách phân bổ thành công!",
  "data": {
    "allocations": [
      {
        "id": "...",
        "product": {
          "id": "...",
          "name": "VinFast VF 8",
          "version": "Plus",
          "images": []
        },
        "variant": { ... },
        "quantity": 10,
        "allocatedQuantity": 10,
        "vinCount": 10,
        "status": "allocated",
        "allocatedAt": "2024-11-05T...",
        "createdAt": "2024-11-01T..."
      }
    ],
    "pagination": { ... }
  }
}
```

#### 3.3. Chi tiết phân bổ
**GET** `http://localhost:3000/api/client/allocations/:id`

#### 3.4. Danh sách VIN của phân bổ
**GET** `http://localhost:3000/api/client/allocations/:id/vins`

Expected Response:
```json
{
  "success": true,
  "message": "Lấy danh sách VIN thành công!",
  "data": {
    "allocationId": "...",
    "product": { ... },
    "vins": [
      {
        "vin": "VF8XXXXXXXXXXXXXXX",
        "notes": "",
        "createdAt": "2024-11-05T...",
        "createdBy": "..."
      }
    ],
    "totalVins": 10,
    "status": "allocated"
  }
}
```

---

### 4️⃣ PRICING & PROMOTION APIs (Giá & Khuyến mãi)

#### 4.1. Xem giá sỉ của đại lý
**GET** `http://localhost:3000/api/client/pricing`

Query Parameters (optional):
- `productId=xxx` (filter theo sản phẩm)

Expected Response:
```json
{
  "success": true,
  "message": "Lấy danh sách giá sỉ thành công!",
  "data": {
    "pricing": [
      {
        "id": "...",
        "product": {
          "id": "...",
          "name": "VinFast VF 8",
          "basePrice": 1200000000
        },
        "variant": {
          "index": 0,
          "attributeValue": []
        },
        "wholesalePrice": 1150000000,
        "effectiveDate": "2024-11-01T...",
        "expiryDate": null
      }
    ]
  }
}
```

#### 4.2. Xem chính sách chiết khấu
**GET** `http://localhost:3000/api/client/pricing/discounts`

Expected Response:
```json
{
  "success": true,
  "message": "Lấy danh sách chiết khấu thành công!",
  "data": {
    "discounts": [
      {
        "id": "...",
        "discountName": "Chiết khấu mua số lượng lớn",
        "discountType": "percentage",
        "discountValue": 5,
        "applyTo": "all_products",
        "minQuantity": 10,
        "minAmount": 10000000000,
        "effectiveDate": "2024-11-01T...",
        "expiryDate": "2024-12-31T..."
      }
    ]
  }
}
```

#### 4.3. Xem khuyến mãi hiện tại
**GET** `http://localhost:3000/api/client/pricing/promotions`

Expected Response:
```json
{
  "success": true,
  "message": "Lấy danh sách khuyến mãi thành công!",
  "data": {
    "promotions": [
      {
        "id": "...",
        "promotionName": "Tặng bộ phụ kiện cao cấp",
        "promotionType": "free_gift",
        "promotionValue": 0,
        "promotionConfig": {
          "giftDescription": "Bộ phụ kiện cao cấp trị giá 50 triệu"
        },
        "applyTo": "all_products",
        "conditions": {
          "minQuantity": 5,
          "minAmount": 0
        },
        "startDate": "2024-11-01T...",
        "endDate": "2024-12-31T..."
      }
    ]
  }
}
```

#### 4.4. Tính giá cuối cùng
**GET** `http://localhost:3000/api/client/pricing/calculate`

Query Parameters:
- `productId=xxx` (required)
- `variantIndex=0` (required)
- `quantity=10` (required)

Expected Response:
```json
{
  "success": true,
  "message": "Tính giá thành công!",
  "data": {
    "product": {
      "id": "...",
      "name": "VinFast VF 8",
      "version": "Plus"
    },
    "variant": { ... },
    "quantity": 10,
    "basePrice": 1150000000,
    "subtotal": 11500000000,
    "discount": {
      "id": "...",
      "name": "Chiết khấu mua số lượng lớn",
      "type": "percentage",
      "value": 5,
      "amount": 575000000
    },
    "totalAfterDiscount": 10925000000
  }
}
```

---

## 🎯 FLOW TEST THỰC TẾ

### Scenario: Dealer đặt hàng 10 xe VinFast VF 8

1. **Đăng nhập** → Lấy token
2. **Xem tồn kho hiện tại** → `GET /inventory`
3. **Xem giá sỉ** → `GET /pricing?productId=xxx`
4. **Tính giá cho 10 xe** → `GET /pricing/calculate?productId=xxx&variantIndex=0&quantity=10`
5. **Tạo yêu cầu đặt hàng** → `POST /allocation-requests` (submitNow=false)
6. **Gửi yêu cầu** → `PATCH /allocation-requests/:id/submit`
7. **Theo dõi trạng thái** → `GET /allocation-requests/:id`
8. *(Admin duyệt yêu cầu → tạo allocation)*
9. **Xem xe được phân bổ** → `GET /allocations`
10. **Xem VIN đã nhận** → `GET /allocations/:id/vins`

---

## ⚠️ LƯU Ý

1. Tất cả APIs (trừ login) đều cần **Bearer Token** trong header
2. Token expires sau 30 ngày
3. Chỉ xem được dữ liệu của đại lý mình
4. Status flow:
   - **AllocationRequest**: draft → pending → approved/rejected → processing → completed
   - **Allocation**: pending → allocated → shipped → delivered

---

## 🐛 TROUBLESHOOTING

### Lỗi 401 Unauthorized
→ Token không hợp lệ hoặc đã hết hạn. Đăng nhập lại để lấy token mới.

### Lỗi 403 Forbidden
→ Tài khoản không có quyền truy cập hoặc không phải là dealer account.

### Lỗi 404 Not Found
→ Resource không tồn tại hoặc không thuộc về đại lý này.

### Lỗi 500 Internal Server Error
→ Kiểm tra console log để xem chi tiết lỗi.

---

## 📬 POSTMAN COLLECTION

Import file này vào Postman để test nhanh: `postman_collection.json` (sẽ tạo riêng)

