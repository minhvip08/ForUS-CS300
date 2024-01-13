export default function errorMessage(error) {
    switch (error) {
        case 'INVALID_SESSION':
            return 'Phiên làm việc không hợp lệ.';
        case 'INVALID_REQUEST':
            return 'Yêu cầu không hợp lệ.';
        case 'IMAGE_VALIDATION_ERROR':
            return 'Ảnh không hợp lệ.';
        case 'IMAGE_LIMIT_EXCEEDED':
            return 'Chỉ được đăng tối đa 1 ảnh.';
        case 'IMAGE_UPLOAD_FAILED':
            return 'Tải ảnh lên thất bại.';
        case 'INTERNAL_SERVER_ERROR':
            return 'Lỗi máy chủ.';
        case 'NOT_FOUND':
            return 'Không tìm thấy.';
        case 'USER_BANNED':
            return 'Người dùng đã bị ban.';
        case 'PAGE_NOT_FOUND':
            return 'Không tìm thấy trang.';
        case 'THREAD_BODY_TOO_LONG':
            return 'Nội dung thread quá dài.';
        case 'THREAD_BODY_TOO_SHORT':
            return 'Nội dung thread không được để trống.';
        case 'THREAD_TITLE_INVALID':
            return 'Tiêu đề thread tối thiểu 1 ký tự, tối đa 128 ký tự.';
        case 'COMMENT_BODY_TOO_LONG':
            return 'Nội dung comment quá dài.';
        case 'COMMENT_BODY_TOO_SHORT':
            return 'Nội dung comment không được để trống.';
        default:
            return 'Lỗi không xác định.';
    }
}