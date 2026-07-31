"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAttachments = exports.uploadAttachment = exports.uploadExcel = void 0;
const multer_1 = __importStar(require("multer"));
const errors_1 = require("../errors");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// -- Excel upload (existing) --
const EXCEL_MIME_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
];
const excelStorage = (0, multer_1.memoryStorage)();
const excelFileFilter = (_req, file, cb) => {
    if (EXCEL_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new errors_1.BadRequestError('Only Excel files (.xlsx, .xls) are allowed'));
    }
};
const excelUpload = (0, multer_1.default)({
    storage: excelStorage,
    fileFilter: excelFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});
exports.uploadExcel = excelUpload.single('file');
// -- Attachment upload (new) --
const publicDir = path_1.default.resolve(process.cwd(), 'public');
if (!fs_1.default.existsSync(publicDir)) {
    fs_1.default.mkdirSync(publicDir, { recursive: true });
}
const attachmentStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, publicDir);
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const randomStr = Math.random().toString(36).substring(2, 8);
        const filename = `${Date.now()}-${randomStr}${ext}`;
        cb(null, filename);
    },
});
const attachmentUpload = (0, multer_1.default)({
    storage: attachmentStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
});
exports.uploadAttachment = attachmentUpload.single('file');
exports.uploadAttachments = attachmentUpload.array('files', 20);
