export const formatFileSize = (bytes: number): string => {
    // Nếu < 1024 thì hiển thị đơn vị bytes
    if (bytes < 1024) return bytes + " B";

    // Nếu < 1024 * 1024 = 1048576 (1MB) thì hiển thị đơn vị KB
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";

    // Nếu >= 1MB thì hiển thị đơn vị MB
    return (bytes / 1048576).toFixed(2) + " MB";
}

// Convert string to slug (for search)
export const convertToSlug = (text: string): string => {
    if (!text) return '';
    
    // Convert to lowercase
    let slug = text.toLowerCase();
    
    // Remove Vietnamese accents
    slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Replace special characters with space
    slug = slug.replace(/[^a-z0-9\s-]/g, ' ');
    
    // Replace multiple spaces with single space
    slug = slug.replace(/\s+/g, ' ');
    
    // Trim spaces
    slug = slug.trim();
    
    return slug;
}