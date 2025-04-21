// Añadir los campos de auto-lock a la interfaz User
export interface User {
    id?: number;
    username: string;
    password: string;
    biometric?: number;
    auto_lock_enabled?: number;
    auto_lock_timeout?: number;
    created_at?: string;
    updated_at?: string;
}

export interface Category {
    id?: number;
    key?: string;
    name: string;
    icon?: string;
    color?: string;
    user_id: number;
    created_at?: string;
    updated_at?: string;
}

export interface Password {
    id?: number;
    title: string;
    username?: string;
    password: string;
    website?: string;
    notes?: string;
    category?: Category;
    favorite?: number; // 0 for false, 1 for true
    iv: string;
    user_id: number;
    created_at?: string;
    updated_at?: string;
}
