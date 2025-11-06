# 📱 Client API Documentation - React Native Mobile App

> **Dự án:** Hệ thống quản lý đại lý xe điện VinFast  
> **Version:** 2.0.0  
> **Base URL:** `http://localhost:3000/api/client`  
> **Swagger UI:** `http://localhost:3000/api-docs`

---

## 📋 MỤC LỤC

- [🔐 1. Authentication](#-1-authentication)
- [🚗 2. PHẦN 1B - QUẢN LÝ BÁN HÀNG](#-2-phần-1b---quản-lý-bán-hàng)
  - [2.1. Products APIs](#21-products-apis-quản-lý-sản-phẩm-xe)
  - [2.2. Inventory APIs](#22-inventory-apis-quản-lý-tồn-kho)
  - [2.3. Allocation Request APIs](#23-allocation-request-apis-đặt-hàng-xe-từ-hãng)
  - [2.4. Allocation Tracking APIs](#24-allocation-tracking-apis-theo-dõi-xe-được-phân-bổ)
  - [2.5. Pricing & Promotion APIs](#25-pricing--promotion-apis-giá-sỉ-chiết-khấu-khuyến-mãi)
- [👥 3. PHẦN 1C - QUẢN LÝ KHÁCH HÀNG](#-3-phần-1c---quản-lý-khách-hàng)
  - [3.1. Customer APIs](#31-customer-apis-quản-lý-khách-hàng)
  - [3.2. Test Drive APIs](#32-test-drive-apis-quản-lý-lịch-hẹn-lái-thử)
  - [3.3. Customer Feedback APIs](#33-customer-feedback-apis-phản-hồi--khiếu-nại)
- [📊 4. Tổng kết APIs](#-4-tổng-kết-apis)

---

## 🔐 1. Authentication

### POST `/account/login`
**Mục đích:** Đăng nhập cho tài khoản đại lý (Dealer)

**Request:**
```json
{
  "email": "dealer@vinfast.vn",
  "password": "Dealer@123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "673a1234567890abcdef5678",
    "email": "dealer@vinfast.vn",
    "fullName": "Nguyễn Văn Dealer",
    "dealerId": "673a9876543210fedcba9876",
    "role": "Quản lý đại lý"
  }
}
```

**⚠️ LƯU Ý QUAN TRỌNG:**
- Token này phải gửi kèm trong header cho TẤT CẢ APIs sau:
  ```
  Authorization: Bearer {token}
  ```
- Token expires sau 30 ngày
- Nếu token hết hạn → Response 401 Unauthorized

---

## 🚗 2. PHẦN 1B - QUẢN LÝ BÁN HÀNG

### 2.1. Products APIs (Quản lý sản phẩm xe)

#### 📌 GET `/products` - Danh sách xe điện
**Mục đích:** Lấy danh sách xe (CHỈ hiển thị xe có trong kho đại lý)

**Query Parameters:**
- `page` (integer, default: 1) - Số trang
- `limit` (integer, default: 20) - Số bản ghi/trang
- `keyword` (string) - Tìm kiếm theo tên xe (VD: "VF8")
- `category` (string) - Lọc theo danh mục

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "673b1111222233334444aaaa",
      "name": "VinFast VF8",
      "version": "2024",
      "basePrice": 1050000000,
      "rangeKm": 420,
      "batteryKWh": 87.7,
      "maxPowerHP": 402,
      "images": ["https://cdn.example.com/vf8-1.jpg"],
      "variants": [
        {
          "attributeValue": ["Màu trắng", "Nội thất da nâu"],
          "price": 1050000000,
          "dealerStock": 15  // ← Tồn kho đại lý
        }
      ]
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1
  }
}
```

**Use case:**
- Hiển thị danh sách xe trong app
- Tìm kiếm xe theo tên
- Lọc theo danh mục

---

#### 📌 GET `/products/{id}` - Chi tiết sản phẩm xe

**Path Parameters:**
- `id` (string, required) - ID của sản phẩm

**Response Example:**
```json
{
  "success": true,
  "data": {
    "_id": "673b1111222233334444aaaa",
    "name": "VinFast VF8",
    "version": "2024",
    "basePrice": 1050000000,
    "rangeKm": 420,
    "batteryKWh": 87.7,
    "maxPowerHP": 402,
    "content": "<p>VinFast VF8 là dòng xe điện cao cấp...</p>",
    "images": [
      "https://cdn.example.com/vf8-1.jpg",
      "https://cdn.example.com/vf8-2.jpg"
    ],
    "attributes": [
      {
        "name": "Màu sắc",
        "values": ["Trắng", "Đen", "Xanh"]
      }
    ],
    "variants": [
      {
        "attributeValue": ["Màu trắng", "Nội thất da nâu", "Pin 87.7 kWh"],
        "price": 1050000000,
        "stock": 150,        // Tồn kho tổng (của hãng)
        "dealerStock": 15    // Tồn kho của đại lý
      }
    ]
  }
}
```

**Use case:**
- Hiển thị trang chi tiết sản phẩm
- Xem thông số kỹ thuật
- Chọn variant (màu sắc, nội thất)

---

### 2.2. Inventory APIs (Quản lý tồn kho)

#### 📌 GET `/inventory` - Danh sách tồn kho

**Query Parameters:**
- `page` (integer) - Phân trang
- `productId` (string) - Lọc theo sản phẩm

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6750aaaabbbbccccddddeeee",
      "dealerId": "673a9876543210fedcba9876",
      "productId": "673b1111222233334444aaaa",
      "variantIndex": 0,
      "stock": 15,                 // Số lượng có sẵn
      "reservedStock": 3,          // Đã đặt chưa xuất
      "availableStock": 12,        // Có thể bán = stock - reservedStock
      "product": {
        "_id": "673b1111222233334444aaaa",
        "name": "VinFast VF8",
        "version": "2024",
        "variants": [...]
      },
      "lastUpdatedAt": "2025-01-19T16:20:00.000Z"
    }
  ]
}
```

**Use case:**
- Kiểm tra tồn kho trước khi tạo đơn hàng
- Quản lý hàng tồn kho

---

#### 📌 GET `/inventory/{productId}` - Tồn kho theo sản phẩm

**Mục đích:** Xem tồn kho của TẤT CẢ variants của 1 sản phẩm

**Path Parameters:**
- `productId` (string, required) - ID của sản phẩm

**Response Example:**
```json
{
  "success": true,
  "data": {
    "productId": "673b1111222233334444aaaa",
    "productName": "VinFast VF8",
    "totalStock": 45,              // Tổng tồn kho tất cả variants
    "totalReserved": 8,            // Tổng đã đặt
    "variants": [
      {
        "variantIndex": 0,
        "attributeValue": ["Màu trắng", "Nội thất da nâu"],
        "stock": 15,
        "reservedStock": 3,
        "availableStock": 12
      },
      {
        "variantIndex": 1,
        "attributeValue": ["Màu đen", "Nội thất da đen"],
        "stock": 30,
        "reservedStock": 5,
        "availableStock": 25
      }
    ]
  }
}
```

**Use case:**
- Xem tổng quan tồn kho 1 dòng xe
- So sánh tồn kho giữa các variants

---

### 2.3. Allocation Request APIs (Đặt hàng xe từ Hãng)

**📝 Luồng hoạt động:**
1. **DRAFT** - Dealer tạo yêu cầu (có thể sửa/xóa)
2. **SUBMITTED** - Gửi lên Hãng (không sửa được nữa)
3. **APPROVED/REJECTED** - Admin duyệt/từ chối
4. **COMPLETED** - Hoàn thành (xe đã được phân bổ)
5. **CANCELLED** - Dealer hủy yêu cầu

---

#### 📌 POST `/allocation-requests` - Tạo yêu cầu đặt hàng

**Request Example:**
```json
{
  "items": [
    {
      "productId": "673b1111222233334444aaaa",
      "variantIndex": 0,
      "quantity": 5,
      "notes": "Cần giao trước Tết"
    },
    {
      "productId": "673b2222333344445555bbbb",
      "variantIndex": 1,
      "quantity": 3,
      "notes": "Khách đặt trước"
    }
  ],
  "requestType": "urgent",           // urgent | normal | scheduled
  "priority": "high",                // low | medium | high | urgent
  "expectedDeliveryDate": "2025-02-15",
  "reason": "Tăng cường tồn kho cho đợt khuyến mãi Tết 2025",
  "notes": "Ưu tiên màu trắng và đỏ"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Tạo yêu cầu đặt hàng thành công",
  "data": {
    "_id": "674f1111222233334444gggg",
    "requestNumber": "AR-20250120-0001",  // Mã tự động
    "dealerId": "673a9876543210fedcba9876",
    "items": [...],
    "totalQuantity": 8,                    // 5 + 3
    "requestType": "urgent",
    "priority": "high",
    "status": "draft",                     // Trạng thái ban đầu
    "createdAt": "2025-01-20T08:00:00.000Z"
  }
}
```

**Use case:**
- Dealer đặt xe khi tồn kho sắp hết
- Đặt xe cho đợt khuyến mãi

---

#### 📌 GET `/allocation-requests` - Danh sách yêu cầu

**Query Parameters:**
- `page` (integer, default: 1)
- `status` (string) - Lọc theo trạng thái:
  - `draft` - Nháp (chưa gửi)
  - `submitted` - Đã gửi chờ duyệt
  - `approved` - Đã được duyệt
  - `rejected` - Bị từ chối
  - `completed` - Đã hoàn thành
  - `cancelled` - Đã hủy

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "674f1111222233334444gggg",
      "requestNumber": "AR-20250120-0001",
      "items": [...],
      "totalQuantity": 8,
      "status": "submitted",
      "createdAt": "2025-01-20T08:00:00.000Z",
      "submittedAt": "2025-01-20T09:00:00.000Z"
    }
  ]
}
```

---

#### 📌 GET `/allocation-requests/{id}` - Chi tiết yêu cầu

**Path Parameters:**
- `id` (string, required) - ID của yêu cầu

---

#### 📌 PATCH `/allocation-requests/{id}` - Cập nhật yêu cầu

**⚠️ CHỈ cập nhật được khi status = "draft"**

**Request Example:**
```json
{
  "items": [
    {
      "productId": "673b1111222233334444aaaa",
      "variantIndex": 0,
      "quantity": 8  // Thay đổi từ 5 → 8
    }
  ],
  "requestType": "normal",
  "priority": "medium"
}
```

---

#### 📌 PATCH `/allocation-requests/{id}/submit` - Gửi yêu cầu

**Mục đích:** Chuyển status từ **draft** → **submitted**

**Response:**
```json
{
  "success": true,
  "message": "Gửi yêu cầu đặt hàng thành công"
}
```

**⚠️ SAU KHI GỬI:**
- KHÔNG thể chỉnh sửa nữa
- Chỉ Admin mới có thể duyệt/từ chối
- Chỉ có thể hủy (cancel)

---

#### 📌 PATCH `/allocation-requests/{id}/cancel` - Hủy yêu cầu

**Request Example:**
```json
{
  "cancelReason": "Đổi kế hoạch kinh doanh"
}
```

---

#### 📌 DELETE `/allocation-requests/{id}` - Xóa yêu cầu

**⚠️ CHỈ xóa được khi status = "draft"**

---

### 2.4. Allocation Tracking APIs (Theo dõi xe được phân bổ)

**📝 Khác biệt với Allocation Request:**
- **Allocation Request** = Dealer **ĐẶT HÀNG** từ Hãng
- **Allocation Tracking** = Dealer **THEO DÕI** xe mà Admin **ĐÃ PHÂN BỔ**

**📝 Luồng trạng thái:**
1. **PENDING** - Chờ Admin phân bổ VIN
2. **ALLOCATED** - Đã phân bổ VIN (có số khung)
3. **SHIPPED** - Đang vận chuyển
4. **DELIVERED** - Đã giao đến đại lý (cập nhật tồn kho)
5. **CANCELLED** - Hủy phân bổ

---

#### 📌 GET `/allocations/summary` - Thống kê phân bổ

**Response Example:**
```json
{
  "success": true,
  "data": {
    "totalAllocations": 25,          // Tổng số lô phân bổ
    "totalVehicles": 150,            // Tổng số xe
    "byStatus": {
      "pending": 5,                  // Chờ xử lý
      "allocated": 8,                // Đã phân bổ (có VIN)
      "shipped": 7,                  // Đang vận chuyển
      "delivered": 5                 // Đã giao
    },
    "byProduct": [
      {
        "productId": "673b1111222233334444aaaa",
        "productName": "VinFast VF8",
        "totalQuantity": 80
      }
    ]
  }
}
```

**Use case:**
- Dashboard hiển thị tổng quan
- Theo dõi tiến độ phân bổ

---

#### 📌 GET `/allocations` - Danh sách phân bổ

**Query Parameters:**
- `page` (integer)
- `status` (string) - Lọc theo trạng thái
- `productId` (string) - Lọc theo sản phẩm

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6755aaaa1111222233334444",
      "dealerId": "673a9876543210fedcba9876",
      "productId": "673b1111222233334444aaaa",
      "variantIndex": 0,
      "quantity": 10,                    // Số lượng yêu cầu
      "allocatedQuantity": 8,            // Đã có VIN (8/10)
      "status": "shipped",
      "allocatedAt": "2025-01-10T10:00:00.000Z",
      "shippedAt": "2025-01-15T14:30:00.000Z",
      "product": {
        "name": "VinFast VF8",
        "version": "2024"
      }
    }
  ]
}
```

---

#### 📌 GET `/allocations/{id}` - Chi tiết phân bổ

**Response bao gồm:**
- Thông tin chi tiết lô phân bổ
- Thông tin sản phẩm (populated)
- Lịch sử chuyển trạng thái (allocatedAt, shippedAt, deliveredAt)

---

#### 📌 GET `/allocations/{id}/vins` - Danh sách VIN

**Mục đích:** Xem danh sách số khung xe (VIN) trong lô phân bổ

**Response Example:**
```json
{
  "success": true,
  "data": {
    "allocationId": "6755aaaa1111222233334444",
    "totalVins": 8,
    "vins": [
      {
        "vin": "LVSHCAMB1PE123456",
        "notes": "Xe màu trắng - Pin mới 100%",
        "createdAt": "2025-01-10T11:00:00.000Z",
        "createdBy": "Admin Nguyễn Văn A"
      },
      {
        "vin": "LVSHCAMB1PE123457",
        "notes": "Xe màu trắng",
        "createdAt": "2025-01-10T11:05:00.000Z",
        "createdBy": "Admin Nguyễn Văn A"
      }
    ]
  }
}
```

**Use case:**
- Kiểm tra số VIN để giao xe cho khách
- In phiếu xuất kho với VIN cụ thể

---

### 2.5. Pricing & Promotion APIs (Giá sỉ, Chiết khấu, Khuyến mãi)

#### 📌 GET `/pricing` - Danh sách giá sỉ

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6751bbbbccccddddeeee1111",
      "dealerId": "673a9876543210fedcba9876",
      "productId": "673b1111222233334444aaaa",
      "variantIndex": 0,               // null = áp dụng cho ALL variants
      "wholesalePrice": 980000000,     // Giá sỉ (VND)
      "effectiveDate": "2025-01-01",
      "expiryDate": "2025-03-31",
      "status": "active"
    }
  ]
}
```

**Use case:**
- Xem giá sỉ hiện tại
- Tính giá bán lẻ

---

#### 📌 GET `/pricing/discounts` - Danh sách chiết khấu

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6752ccccddddeeee22223333",
      "dealerId": "673a9876543210fedcba9876",
      "discountName": "Chiết khấu mua số lượng lớn",
      "discountType": "percentage",    // percentage | fixed_amount
      "discountValue": 5,              // 5% hoặc 5,000,000 VND
      "applyTo": "all_products",       // all_products | specific_products | product_category
      "minQuantity": 10,               // Mua tối thiểu 10 xe
      "minAmount": 5000000000,         // Hoặc giá trị đơn hàng >= 5 tỷ
      "effectiveDate": "2025-01-01",
      "expiryDate": "2025-12-31",
      "status": "active"
    }
  ]
}
```

**Các loại chiết khấu:**
- **percentage**: Giảm theo % (VD: 5%)
- **fixed_amount**: Giảm số tiền cố định (VD: 50,000,000 VND)

**Điều kiện áp dụng:**
- `minQuantity`: Số lượng tối thiểu
- `minAmount`: Giá trị đơn hàng tối thiểu

---

#### 📌 GET `/pricing/promotions` - Danh sách khuyến mãi

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6753ddddeeee33334444ffff",
      "dealerId": "673a9876543210fedcba9876",
      "promotionName": "Tặng phụ kiện khi mua VF8",
      "promotionType": "free_gift",    // buy_x_get_y | discount_percentage | fixed_discount | free_gift
      "promotionConfig": {
        "giftProductId": "6754eeee5555666677778888",
        "giftDescription": "Bộ phụ kiện cao cấp VinFast"
      },
      "applyTo": "specific_products",
      "productIds": ["673b1111222233334444aaaa"],
      "startDate": "2025-02-01",
      "endDate": "2025-02-15",
      "status": "active"
    }
  ]
}
```

**Các loại khuyến mãi:**
- **buy_x_get_y**: Mua X tặng Y
- **discount_percentage**: Giảm % (tương tự discount)
- **fixed_discount**: Giảm số tiền cố định
- **free_gift**: Tặng quà

---

#### 📌 GET `/pricing/calculate` - Tính giá cuối cùng

**Mục đích:** Tính giá sau khi áp dụng giá sỉ + chiết khấu + khuyến mãi

**Query Parameters:**
- `productId` (string, required)
- `variantIndex` (integer, required)
- `quantity` (integer, required)

**Example Request:**
```
GET /pricing/calculate?productId=673b1111222233334444aaaa&variantIndex=0&quantity=10
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "productId": "673b1111222233334444aaaa",
    "variantIndex": 0,
    "quantity": 10,
    "basePrice": 980000000,           // Giá sỉ/đơn vị (VND)
    "subtotal": 9800000000,           // Tổng trước CK = 980M × 10
    "discounts": [
      {
        "name": "Chiết khấu mua số lượng lớn",
        "type": "percentage",
        "value": 5,
        "amount": 490000000          // Giảm 490M (5% của 9.8 tỷ)
      }
    ],
    "totalDiscount": 490000000,
    "finalPrice": 9310000000,        // = 9.8 tỷ - 490M
    "promotions": [
      {
        "name": "Tặng phụ kiện khi mua VF8",
        "type": "free_gift",
        "description": "Bộ phụ kiện cao cấp VinFast"
      }
    ]
  }
}
```

**Use case:**
- Tính giá khi tạo báo giá cho khách
- Hiển thị giá ưu đãi trong app

---

## 👥 3. PHẦN 1C - QUẢN LÝ KHÁCH HÀNG

### 3.1. Customer APIs (Quản lý khách hàng)

#### 📌 POST `/customers/register` - Đăng ký khách hàng mới

**Request Example:**
```json
{
  "fullName": "Nguyễn Văn An",
  "phone": "0901234567",
  "email": "nguyenvanan@gmail.com",
  "address": {
    "street": "123 Nguyễn Huệ",
    "ward": "Phường Bến Nghé",
    "district": "Quận 1",
    "city": "TP. Hồ Chí Minh"
  },
  "idCard": "079123456789",
  "dateOfBirth": "1990-05-15"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Đăng ký khách hàng thành công",
  "data": {
    "_id": "674a1234567890abcdef1234",
    "fullName": "Nguyễn Văn An",
    "phone": "0901234567",
    "email": "nguyenvanan@gmail.com",
    "address": {...},
    "idCard": "079123456789",
    "dateOfBirth": "1990-05-15",
    "dealerId": "673a9876543210fedcba9876",
    "status": "active",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Validation:**
- `fullName` và `phone` là **bắt buộc**
- `phone` phải **unique** trong đại lý
- `email` phải **unique** (nếu có)

**Use case:**
- Nhân viên đăng ký khách hàng khi có nhu cầu mua xe
- Lưu thông tin khách để tư vấn sau

---

#### 📌 GET `/customers` - Danh sách khách hàng

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 20)
- `keyword` (string) - Tìm kiếm theo tên, SĐT, email
- `status` (string) - Lọc theo trạng thái: `active` | `inactive`

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "674a1234567890abcdef1234",
      "fullName": "Nguyễn Văn An",
      "phone": "0901234567",
      "email": "nguyenvanan@gmail.com",
      "status": "active",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

**Use case:**
- Tìm kiếm khách hàng cũ
- Xem danh sách khách hàng của đại lý

---

#### 📌 GET `/customers/{id}` - Chi tiết khách hàng

**Path Parameters:**
- `id` (string, required) - ID của khách hàng

**Response bao gồm:**
- Thông tin đầy đủ khách hàng
- Địa chỉ chi tiết
- Lịch sử tương tác (nếu có)

---

#### 📌 PATCH `/customers/{id}` - Cập nhật khách hàng

**Request Example:**
```json
{
  "fullName": "Nguyễn Văn An (Updated)",
  "email": "newemail@gmail.com",
  "address": {
    "street": "456 Lê Lợi",
    "ward": "Phường Bến Thành",
    "district": "Quận 1",
    "city": "TP. Hồ Chí Minh"
  },
  "status": "active"
}
```

**Use case:**
- Cập nhật thông tin khi khách đổi số điện thoại
- Cập nhật địa chỉ giao xe

---

#### 📌 DELETE `/customers/{id}` - Xóa khách hàng

**⚠️ Soft delete** - Không xóa hẳn, chỉ đánh dấu `deleted = true`

**Response:**
```json
{
  "success": true,
  "message": "Xóa khách hàng thành công"
}
```

---

### 3.2. Test Drive APIs (Quản lý lịch hẹn lái thử)

**📝 Luồng trạng thái:**
1. **PENDING** - Mới tạo, chờ xác nhận
2. **CONFIRMED** - Đã xác nhận lịch hẹn
3. **COMPLETED** - Đã hoàn thành lái thử
4. **CANCELLED** - Đã hủy
5. **NO_SHOW** - Khách không đến

---

#### 📌 POST `/test-drives` - Đặt lịch lái thử

**Request Example:**
```json
{
  "customerId": "674a1234567890abcdef1234",
  "productId": "673b1111222233334444aaaa",
  "variantIndex": 0,
  "scheduledDate": "2025-02-01",
  "scheduledTime": "14:30",
  "location": {
    "address": "Showroom ABC - 456 Lê Lợi, Q1, TP.HCM",
    "lat": 10.7769,
    "lng": 106.7009
  },
  "notes": "Khách muốn test công nghệ tự lái"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Đặt lịch lái thử thành công",
  "data": {
    "_id": "674c5555666677778888dddd",
    "testDriveNumber": "TD-20250201-0001",  // Mã tự động
    "customerId": "674a1234567890abcdef1234",
    "dealerId": "673a9876543210fedcba9876",
    "productId": "673b1111222233334444aaaa",
    "variantIndex": 0,
    "scheduledDate": "2025-02-01",
    "scheduledTime": "14:30",
    "location": {...},
    "status": "pending",
    "createdAt": "2025-01-20T09:15:00.000Z"
  }
}
```

**Use case:**
- Khách hàng muốn lái thử trước khi mua
- Lên lịch lái thử cho nhiều khách

---

#### 📌 GET `/test-drives` - Danh sách lịch hẹn

**Query Parameters:**
- `page` (integer)
- `limit` (integer)
- `status` (string) - Lọc theo trạng thái: `pending` | `confirmed` | `completed` | `cancelled` | `no_show`
- `customerId` (string) - Lọc theo khách hàng
- `date` (string, format: YYYY-MM-DD) - Lọc theo ngày hẹn

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "674c5555666677778888dddd",
      "testDriveNumber": "TD-20250201-0001",
      "customerId": "674a1234567890abcdef1234",
      "productId": "673b1111222233334444aaaa",
      "scheduledDate": "2025-02-01",
      "scheduledTime": "14:30",
      "status": "confirmed",
      "createdAt": "2025-01-20T09:15:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1
  }
}
```

**Use case:**
- Xem lịch lái thử trong ngày
- Quản lý lịch hẹn

---

#### 📌 GET `/test-drives/{id}` - Chi tiết lịch hẹn

**Path Parameters:**
- `id` (string, required)

---

#### 📌 PATCH `/test-drives/{id}/confirm` - Xác nhận lịch hẹn

**Mục đích:** Chuyển status từ **pending** → **confirmed**

**Response:**
```json
{
  "success": true,
  "message": "Xác nhận lịch hẹn thành công",
  "data": {...}
}
```

**Use case:**
- Nhân viên gọi điện xác nhận với khách
- Gửi thông báo nhắc nhở khách

---

#### 📌 PATCH `/test-drives/{id}/complete` - Hoàn thành lái thử

**Mục đích:** Đánh dấu đã hoàn thành sau khi khách lái thử xong

**Request Example:**
```json
{
  "feedback": "Khách hài lòng, quan tâm đến việc mua xe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Hoàn thành lái thử thành công"
}
```

**Use case:**
- Ghi nhận kết quả lái thử
- Theo dõi conversion rate (lái thử → mua xe)

---

#### 📌 PATCH `/test-drives/{id}/cancel` - Hủy lịch hẹn

**Request Example:**
```json
{
  "cancelReason": "Khách đổi lịch"
}
```

**Use case:**
- Khách hủy hẹn
- Đổi lịch lái thử

---

### 3.3. Customer Feedback APIs (Phản hồi & Khiếu nại)

**📝 Luồng trạng thái:**
1. **OPEN** - Mới tạo, chưa xử lý
2. **IN_PROGRESS** - Đang xử lý
3. **RESOLVED** - Đã giải quyết
4. **CLOSED** - Đã đóng (hoàn tất)

---

#### 📌 POST `/feedbacks` - Gửi phản hồi/khiếu nại

**Request Example:**
```json
{
  "customerId": "674a1234567890abcdef1234",
  "orderId": "674d7777888899990000eeee",  // Optional - nếu liên quan đến đơn hàng
  "type": "complaint",                     // feedback | complaint | inquiry | suggestion
  "category": "product_quality",           // product_quality | service | delivery | pricing | technical | other
  "subject": "Pin xe sạc chậm hơn mô tả",
  "content": "Xe VF8 của tôi sạc đầy mất 10 giờ thay vì 8 giờ như quảng cáo. Pin chỉ chạy được 350km thay vì 400km.",
  "priority": "high"                       // low | medium | high | urgent
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Gửi phản hồi thành công",
  "data": {
    "_id": "674e9999aaaabbbbccccffff",
    "feedbackNumber": "FB-20250120-0001",  // Mã tự động
    "customerId": "674a1234567890abcdef1234",
    "dealerId": "673a9876543210fedcba9876",
    "type": "complaint",
    "category": "product_quality",
    "subject": "Pin xe sạc chậm hơn mô tả",
    "content": "...",
    "priority": "high",
    "status": "open",
    "response": null,
    "createdAt": "2025-01-20T11:45:00.000Z"
  }
}
```

**Các loại phản hồi:**
- **feedback**: Góp ý, nhận xét
- **complaint**: Khiếu nại
- **inquiry**: Hỏi đáp
- **suggestion**: Đề xuất

**Danh mục:**
- **product_quality**: Chất lượng sản phẩm
- **service**: Dịch vụ
- **delivery**: Giao hàng
- **pricing**: Giá cả
- **technical**: Kỹ thuật
- **other**: Khác

---

#### 📌 GET `/feedbacks` - Danh sách phản hồi

**Query Parameters:**
- `page` (integer)
- `limit` (integer)
- `type` (string) - Lọc theo loại
- `status` (string) - Lọc theo trạng thái
- `priority` (string) - Lọc theo mức độ
- `customerId` (string) - Lọc theo khách hàng

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "674e9999aaaabbbbccccffff",
      "feedbackNumber": "FB-20250120-0001",
      "customerId": "674a1234567890abcdef1234",
      "type": "complaint",
      "category": "product_quality",
      "subject": "Pin xe sạc chậm hơn mô tả",
      "priority": "high",
      "status": "open",
      "createdAt": "2025-01-20T11:45:00.000Z"
    }
  ],
  "pagination": {
    "total": 78
  }
}
```

**Use case:**
- Theo dõi phản hồi chưa xử lý
- Quản lý khiếu nại của khách hàng

---

#### 📌 GET `/feedbacks/{id}` - Chi tiết phản hồi

**Path Parameters:**
- `id` (string, required)

---

#### 📌 PATCH `/feedbacks/{id}/reply` - Trả lời phản hồi

**Request Example:**
```json
{
  "response": "Cảm ơn bạn đã phản hồi. Chúng tôi sẽ kiểm tra pin xe và liên hệ lại trong 24h."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trả lời phản hồi thành công",
  "data": {
    "_id": "674e9999aaaabbbbccccffff",
    "response": "Cảm ơn bạn đã phản hồi...",
    "status": "in_progress"  // Tự động chuyển sang in_progress
  }
}
```

**Use case:**
- Nhân viên trả lời phản hồi của khách
- Ghi nhận đã tiếp nhận khiếu nại

---

#### 📌 PATCH `/feedbacks/{id}/resolve` - Giải quyết phản hồi

**Mục đích:** Đánh dấu đã giải quyết xong vấn đề (status → **resolved**)

**Response:**
```json
{
  "success": true,
  "message": "Giải quyết phản hồi thành công"
}
```

**Use case:**
- Sau khi khắc phục vấn đề cho khách
- Đóng ticket xử lý

---

#### 📌 PATCH `/feedbacks/{id}/close` - Đóng phản hồi

**Mục đích:** Đóng phản hồi hoàn toàn (status → **closed**)

**Response:**
```json
{
  "success": true,
  "message": "Đóng phản hồi thành công"
}
```

**Use case:**
- Sau khi khách xác nhận hài lòng
- Hoàn tất quy trình xử lý

---

## 📊 4. Tổng kết APIs

### 📈 Thống kê theo chức năng

| Chức năng | Số APIs | Ghi chú |
|-----------|---------|---------|
| **Authentication** | 1 | Đăng nhập |
| **Products** | 2 | Danh sách & chi tiết xe |
| **Inventory** | 2 | Quản lý tồn kho |
| **Allocation Request** | 7 | Đặt hàng xe từ Hãng |
| **Allocation Tracking** | 4 | Theo dõi xe được phân bổ |
| **Pricing & Promotion** | 4 | Giá sỉ, CK, KM |
| **Customers** | 5 | Quản lý khách hàng |
| **Test Drives** | 6 | Quản lý lịch lái thử |
| **Customer Feedback** | 5 | Phản hồi & khiếu nại |
| **TỔNG CỘNG** | **36 APIs** | Tất cả có examples |

---

### 🔑 Phân chia theo Scope

#### **PHẦN 1B - Quản lý bán hàng (19 APIs)**
1. Products APIs (2)
2. Inventory APIs (2)
3. Allocation Request APIs (7)
4. Allocation Tracking APIs (4)
5. Pricing & Promotion APIs (4)

#### **PHẦN 1C - Quản lý khách hàng (16 APIs)**
1. Customers APIs (5)
2. Test Drive APIs (6)
3. Customer Feedback APIs (5)

---

### 🛡️ Authentication & Authorization

**Header bắt buộc cho TẤT CẢ APIs (trừ login):**
```
Authorization: Bearer {token}
```

**Kiểm tra quyền:**
- Chỉ tài khoản có role liên quan đến đại lý mới truy cập được
- Tài khoản phải được liên kết với 1 Dealer active
- JWT token chứa: `id`, `email`, `dealerId`, `role`

**Token hết hạn:**
- Token expires sau 30 ngày
- Khi token hết hạn → Response 401 Unauthorized
- FE cần redirect về màn hình login

---

### ⚠️ Error Responses (Chung)

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "error": "Chi tiết lỗi validation..."
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Token không hợp lệ hoặc đã hết hạn"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Không tìm thấy dữ liệu"
}
```

**409 Conflict:**
```json
{
  "success": false,
  "message": "Số điện thoại đã được đăng ký"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Lỗi server",
  "error": "Chi tiết lỗi..."
}
```

---

### 📚 Tài liệu bổ sung

- **Swagger UI:** http://localhost:3000/api-docs
- **Source code:** `/controllers/client/`, `/routes/client/`, `/models/`
- **Test APIs file:** `TEST_APIS.md` (curl commands)

---

### 🎯 Use Cases quan trọng

#### **UC1: Dealer đặt hàng xe mới**
1. Kiểm tra tồn kho: `GET /inventory`
2. Tạo yêu cầu: `POST /allocation-requests` (status = draft)
3. Xem lại & chỉnh sửa: `PATCH /allocation-requests/{id}`
4. Gửi yêu cầu: `PATCH /allocation-requests/{id}/submit`
5. Theo dõi: `GET /allocations` (sau khi Admin duyệt)

#### **UC2: Nhân viên tạo báo giá cho khách**
1. Tìm xe: `GET /products?keyword=VF8`
2. Xem chi tiết: `GET /products/{id}`
3. Kiểm tra tồn kho: `GET /inventory/{productId}`
4. Tính giá: `GET /pricing/calculate?productId=...&quantity=10`
5. Tạo báo giá (logic app)

#### **UC3: Đăng ký khách hàng & lái thử**
1. Đăng ký KH: `POST /customers/register`
2. Đặt lịch lái thử: `POST /test-drives`
3. Xác nhận lịch: `PATCH /test-drives/{id}/confirm`
4. Sau khi lái thử: `PATCH /test-drives/{id}/complete`

#### **UC4: Xử lý khiếu nại khách hàng**
1. KH gửi khiếu nại: `POST /feedbacks`
2. NV xem: `GET /feedbacks?status=open&priority=high`
3. Trả lời: `PATCH /feedbacks/{id}/reply`
4. Giải quyết: `PATCH /feedbacks/{id}/resolve`
5. Đóng: `PATCH /feedbacks/{id}/close`

---

## 🚀 Bắt đầu sử dụng

1. **Đăng nhập để lấy token:**
   ```bash
   POST /api/client/account/login
   {
     "email": "dealer@vinfast.vn",
     "password": "Dealer@123"
   }
   ```

2. **Lưu token vào AsyncStorage/SecureStore**

3. **Gọi API với header Authorization:**
   ```javascript
   const token = await AsyncStorage.getItem('token');
   fetch('http://localhost:3000/api/client/products', {
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     }
   });
   ```

4. **Xem Swagger UI để test thử:**
   - Mở: http://localhost:3000/api-docs
   - Click "Authorize" → Nhập token
   - Test các APIs

---

**📞 Liên hệ:** Nếu có vấn đề về APIs, liên hệ Backend Developer  
**📅 Cập nhật:** 2025-01-20  
**✅ Trạng thái:** HOÀN THÀNH - 36 APIs với đầy đủ examples

