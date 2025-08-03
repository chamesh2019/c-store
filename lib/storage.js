const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, 'data.json');

/**
 * Opens a file for reading and writing.
 * @param {string} filePath - Relative or absolute path to the file.
 * @returns {Promise<fs.promises.FileHandle>} - File handle for read/write operations.
 */
async function openFile(filePath) {
    const absolutePath = path.resolve(filePath);
    try {
        // 'r+' opens the file for reading and writing. If the file does not exist, it throws an error.
        const fileHandle = await fs.promises.open(absolutePath, 'r+');
        return fileHandle;
    } catch (err) {
        // If file does not exist, create it with 'w+' (read/write, create if not exists)
        if (err.code === 'ENOENT') {
            return await fs.promises.open(absolutePath, 'w+');
        }
        throw err;
    }
}

const setValue = async (namespace, key, value) => {
    const fileHandle = await openFile(FILE_PATH);
    try {
        const data = JSON.parse((await fileHandle.readFile()).toString() || '{}');
        if (!data[namespace]) {
            data[namespace] = {};
        }
        data[namespace][key] = value;
        await fileHandle.writeFile(JSON.stringify(data, null, 2));
    } finally {
        await fileHandle.close();
    }
}
const getValue = async (namespace, key) => {
    const fileHandle = await openFile(FILE_PATH);
    try {
        const data = JSON.parse((await fileHandle.readFile()).toString() || '{}');
        if (!data[namespace]) {
            return key === undefined ? {} : undefined;
        }
        return key === undefined ? data[namespace] : data[namespace][key];
    } finally {
        await fileHandle.close();
    }
}
const deleteValue = async (namespace, key) => {
    const fileHandle = await openFile(FILE_PATH);
    try {
        const data = JSON.parse((await fileHandle.readFile()).toString() || '{}');
        if (data[namespace]) {
            delete data[namespace][key];
            // Remove empty namespace
            if (Object.keys(data[namespace]).length === 0) {
                delete data[namespace];
            }
        }
        await fileHandle.writeFile(JSON.stringify(data, null, 2));
    } finally {
        await fileHandle.close();
    }
}

module.exports = { openFile, setValue, getValue, deleteValue };