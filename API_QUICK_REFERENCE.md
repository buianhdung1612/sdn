# 📱 API Quick Reference - Client Mobile App

> **Tham khảo nhanh các APIs** - Chi tiết đầy đủ xem `CLIENT_API_DOCUMENTATION.md`

---

## 🔐 Authentication

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/account/login` | Đăng nhập (trả về token) |

---

## 🚗 PHẦN 1B - QUẢN LÝ BÁN HÀNG

### Products (Sản phẩm xe)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/products` | Danh sách xe (có trong kho đại lý) |
| GET | `/products/{id}` | Chi tiết xe |

### Inventory (Tồn kho)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/inventory` | Danh sách tồn kho |
| GET | `/inventory/{productId}` | Tồn kho theo sản phẩm (tất cả variants) |

### Allocation Request (Đặt hàng xe từ Hãng)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/allocation-requests` | Tạo yêu cầu (status = draft) |
| GET | `/allocation-requests` | Danh sách yêu cầu |
| GET | `/allocation-requests/{id}` | Chi tiết yêu cầu |
| PATCH | `/allocation-requests/{id}` | Cập nhật (chỉ khi draft) |
| DELETE | `/allocation-requests/{id}` | Xóa (chỉ khi draft) |
| PATCH | `/allocation-requests/{id}/submit` | Gửi yêu cầu (draft → submitted) |
| PATCH | `/allocation-requests/{id}/cancel` | Hủy yêu cầu |

### Allocation Tracking (Theo dõi xe được phân bổ)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/allocations/summary` | Thống kê phân bổ |
| GET | `/allocations` | Danh sách phân bổ |
| GET | `/allocations/{id}` | Chi tiết phân bổ |
| GET | `/allocations/{id}/vins` | Danh sách VIN (số khung xe) |

### Pricing & Promotion (Giá sỉ, Chiết khấu, Khuyến mãi)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/pricing` | Danh sách giá sỉ |
| GET | `/pricing/discounts` | Danh sách chiết khấu |
| GET | `/pricing/promotions` | Danh sách khuyến mãi |
| GET | `/pricing/calculate` | Tính giá cuối cùng (sau CK + KM) |

---

## 👥 PHẦN 1C - QUẢN LÝ KHÁCH HÀNG

### Customers (Khách hàng)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/customers/register` | Đăng ký khách hàng mới |
| GET | `/customers` | Danh sách khách hàng |
| GET | `/customers/{id}` | Chi tiết khách hàng |
| PATCH | `/customers/{id}` | Cập nhật thông tin |
| DELETE | `/customers/{id}` | Xóa khách hàng (soft delete) |

### Test Drives (Lịch hẹn lái thử)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/test-drives` | Đặt lịch lái thử |
| GET | `/test-drives` | Danh sách lịch hẹn |
| GET | `/test-drives/{id}` | Chi tiết lịch hẹn |
| PATCH | `/test-drives/{id}/confirm` | Xác nhận lịch hẹn (pending → confirmed) |
| PATCH | `/test-drives/{id}/complete` | Hoàn thành lái thử |
| PATCH | `/test-drives/{id}/cancel` | Hủy lịch hẹn |

### Customer Feedback (Phản hồi & Khiếu nại)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/feedbacks` | Gửi phản hồi/khiếu nại |
| GET | `/feedbacks` | Danh sách phản hồi |
| GET | `/feedbacks/{id}` | Chi tiết phản hồi |
| PATCH | `/feedbacks/{id}/reply` | Trả lời phản hồi |
| PATCH | `/feedbacks/{id}/resolve` | Giải quyết phản hồi (→ resolved) |
| PATCH | `/feedbacks/{id}/close` | Đóng phản hồi (→ closed) |

---

## 📊 Tổng kết

- **Tổng số APIs:** 36
- **Phần 1B (Quản lý bán hàng):** 19 APIs
- **Phần 1C (Quản lý khách hàng):** 16 APIs
- **Authentication:** 1 API

---

## 🔑 Authorization Header

**Tất cả APIs (trừ login) cần header:**
```
Authorization: Bearer {token}
```

---

## 🌐 Base URLs

- **Development:** `http://localhost:3000/api/client`
- **Production:** `https://your-domain.com/api/client`

---

## 📚 Tài liệu đầy đủ

- **Chi tiết:** `CLIENT_API_DOCUMENTATION.md`
- **Swagger UI:** `http://localhost:3000/api-docs`
- **Test APIs:** `TEST_APIS.md`

---

## ⚡ Quick Start

1. **Login:**
   ```bash
   POST /api/client/account/login
   Body: { "email": "dealer@vinfast.vn", "password": "Dealer@123" }
   ```

2. **Lưu token vào storage**

3. **Gọi API với header Authorization:**
   ```javascript
   fetch('http://localhost:3000/api/client/products', {
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     }
   });
   ```

---

**📅 Cập nhật:** 2025-01-20  
**✅ Status:** COMPLETED - Tất cả APIs đã có examples đầy đủ trong Swagger

