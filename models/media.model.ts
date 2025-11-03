import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        folder: String,  // đường dẫn thư mục
        filename: String,
        mimetype: String,  // để biết file dạng gì hiển thị icon cho phù hợp
        size: Number
    },
    {
        timestamps: true, // Tự động sinh ra trường createdAt và updatedAt
    }
);

const Media = mongoose.model("Media", schema, "media");

export default Media;