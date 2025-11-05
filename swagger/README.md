# Client API Documentation

## Tổng quan

API cho ứng dụng client (React Native) - Dành cho quản lý đại lý và nhân viên bán hàng.

## Swagger Documentation

File Swagger được lưu tại: `swagger/client-api.yaml`

### Cách sử dụng Swagger UI

1. **Cài đặt Swagger UI** (nếu chưa có):
   ```bash
   npm install swagger-ui-express swagger-jsdoc
   npm install --save-dev @types/swagger-ui-express @types/swagger-jsdoc
   ```

2. **Tích hợp vào Express** (thêm vào `index.ts`):
   ```typescript
   import swaggerUi from 'swagger-ui-express';
   import YAML from 'yamljs';
   import path from 'path';
   
   const swaggerDocument = YAML.load(path.join(__dirname, 'swagger/client-api.yaml'));
   
   app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
   ```

3. **Truy cập Swagger UI**: 
   - URL: `http://localhost:3000/api-docs`

### Cách sử dụng với Postman

1. Import file `swagger/client-api.yaml` vào Postman
2. Postman sẽ tự động tạo collection từ Swagger spec
3. Test các API endpoints trực tiếp từ Postman

### Cách sử dụng với Insomnia

1. Import file `swagger/client-api.yaml` vào Insomnia
2. Insomnia sẽ tự động tạo requests từ OpenAPI spec

## API Endpoints

### Base URL
- Development: `http://localhost:3000/api/client`
- Production: `https://your-domain.com/api/client`

### 1. Đăng nhập
**POST** `/account/login`

**Request Body:**
```json
{
  "email": "dealer@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công!",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "fullName": "...",
      "email": "...",
      "role": "...",
      "dealer": {
        "id": "...",
        "name": "...",
        "code": "..."
      }
    }
  }
}
```

### 2. Lấy danh sách sản phẩm
**GET** `/product`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `keyword` (optional): Từ khóa tìm kiếm
- `categoryId` (optional): ID danh mục
- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số lượng mỗi trang (default: 20)

**Example:**
```
GET /product?keyword=Alpha&categoryId=123&page=1&limit=20
```

### 3. Lấy chi tiết sản phẩm
**GET** `/product/{id}`

**Headers:**
```
Authorization: Bearer {token}
```

## Authentication

Tất cả các API (trừ `/account/login`) đều yêu cầu header `Authorization`:

```
Authorization: Bearer {token}
```

Token được lấy từ API đăng nhập và có thời hạn 30 ngày.

## Error Responses

Tất cả các lỗi đều trả về format:

```json
{
  "success": false,
  "message": "Mô tả lỗi"
}
```

**Status Codes:**
- `200`: Thành công
- `400`: Dữ liệu không hợp lệ
- `401`: Không có quyền truy cập / Token không hợp lệ
- `403`: Không có quyền thực hiện hành động
- `404`: Không tìm thấy tài nguyên
- `500`: Lỗi server

## Lưu ý

- Chỉ tài khoản có role "quản lý đại lý" hoặc "nhân viên bán hàng" mới có thể đăng nhập
- Tài khoản phải được liên kết với một đại lý (dealer) active
- Chỉ trả về sản phẩm đã được phân bổ cho đại lý của user

