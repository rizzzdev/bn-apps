"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStorage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("../configs/env");
class LocalStorage {
    publicDir;
    constructor() {
        this.publicDir = path_1.default.resolve(process.cwd(), 'public');
        if (!fs_1.default.existsSync(this.publicDir)) {
            fs_1.default.mkdirSync(this.publicDir, { recursive: true });
        }
    }
    async upload(filename, file) {
        const filepath = path_1.default.join(this.publicDir, filename);
        if (file.buffer) {
            fs_1.default.writeFileSync(filepath, file.buffer);
        }
        else if (file.path) {
            fs_1.default.copyFileSync(file.path, filepath);
        }
        return filename;
    }
    async delete(filename) {
        const filepath = path_1.default.join(this.publicDir, filename);
        if (fs_1.default.existsSync(filepath)) {
            fs_1.default.unlinkSync(filepath);
        }
    }
    async getFile(filename) {
        const filepath = path_1.default.join(this.publicDir, filename);
        if (!fs_1.default.existsSync(filepath)) {
            throw new Error('File not found');
        }
        const ext = path_1.default.extname(filename).toLowerCase();
        const contentTypeMap = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.zip': 'application/zip',
            '.json': 'application/json',
            '.txt': 'text/plain',
            '.csv': 'text/csv',
            '.mp4': 'video/mp4',
            '.mp3': 'audio/mpeg',
        };
        return {
            buffer: fs_1.default.readFileSync(filepath),
            contentType: contentTypeMap[ext] || 'application/octet-stream',
        };
    }
}
class SupabaseStorage {
    supabase;
    constructor() {
        this.supabase = (0, supabase_js_1.createClient)(env_1.env.SUPABASE_URL, env_1.env.SUPABASE_SERVICE_KEY);
    }
    async upload(filename, file) {
        const { error } = await this.supabase.storage
            .from(env_1.env.SUPABASE_BUCKET)
            .upload(filename, file.buffer || fs_1.default.readFileSync(file.path), {
            contentType: file.mimetype,
            upsert: true,
        });
        if (error)
            throw error;
        return filename;
    }
    async delete(filename) {
        const { error } = await this.supabase.storage
            .from(env_1.env.SUPABASE_BUCKET)
            .remove([filename]);
        if (error)
            throw error;
    }
    async getFile(filename) {
        const { data, error } = await this.supabase.storage
            .from(env_1.env.SUPABASE_BUCKET)
            .download(filename);
        if (error)
            throw new Error('File not found');
        const buffer = Buffer.from(await data.arrayBuffer());
        return { buffer, contentType: data.type };
    }
}
let storageInstance;
const getStorage = () => {
    if (!storageInstance) {
        if (env_1.env.SUPABASE_URL && env_1.env.SUPABASE_SERVICE_KEY) {
            storageInstance = new SupabaseStorage();
        }
        else {
            storageInstance = new LocalStorage();
        }
    }
    return storageInstance;
};
exports.getStorage = getStorage;
