const fs = require('fs');
const path = require('path');
const { openFile, setValue, getValue, deleteValue } = require('../lib/storage');

describe('Storage Module', () => {
    const testDataPath = path.join(__dirname, '..', 'lib', 'data.json');

    beforeEach(() => {
        // Clean up test data file before each test
        if (fs.existsSync(testDataPath)) {
            fs.unlinkSync(testDataPath);
        }
    });

    afterEach(() => {
        // Clean up test data file after each test
        if (fs.existsSync(testDataPath)) {
            fs.unlinkSync(testDataPath);
        }
    });

    describe('openFile', () => {
        it('should create a new file if it does not exist', async () => {
            const fileHandle = await openFile(testDataPath);
            expect(fileHandle).toBeDefined();
            expect(fs.existsSync(testDataPath)).toBe(true);
            await fileHandle.close();
        });

        it('should open an existing file', async () => {
            // Create a file first
            fs.writeFileSync(testDataPath, '{"test": "data"}');
            
            const fileHandle = await openFile(testDataPath);
            expect(fileHandle).toBeDefined();
            
            const content = await fileHandle.readFile();
            expect(JSON.parse(content.toString())).toEqual({ test: 'data' });
            await fileHandle.close();
        });

        it('should handle file paths correctly', async () => {
            const relativePath = './lib/data.json';
            const fileHandle = await openFile(relativePath);
            expect(fileHandle).toBeDefined();
            await fileHandle.close();
        });
    });

    describe('setValue', () => {
        it('should set a value in a new namespace', async () => {
            await setValue('users', 'john', { name: 'John Doe', age: 30 });
            
            const data = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
            expect(data.users.john).toEqual({ name: 'John Doe', age: 30 });
        });

        it('should set multiple values in the same namespace', async () => {
            await setValue('users', 'john', { name: 'John Doe' });
            await setValue('users', 'jane', { name: 'Jane Smith' });
            
            const data = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
            expect(data.users.john).toEqual({ name: 'John Doe' });
            expect(data.users.jane).toEqual({ name: 'Jane Smith' });
        });

        it('should overwrite existing values', async () => {
            await setValue('users', 'john', { name: 'John Doe' });
            await setValue('users', 'john', { name: 'John Updated', age: 31 });
            
            const data = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
            expect(data.users.john).toEqual({ name: 'John Updated', age: 31 });
        });

        it('should handle different data types', async () => {
            await setValue('test', 'string', 'hello world');
            await setValue('test', 'number', 42);
            await setValue('test', 'boolean', true);
            await setValue('test', 'array', [1, 2, 3]);
            await setValue('test', 'object', { nested: { value: 'test' } });
            
            const data = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
            expect(data.test.string).toBe('hello world');
            expect(data.test.number).toBe(42);
            expect(data.test.boolean).toBe(true);
            expect(data.test.array).toEqual([1, 2, 3]);
            expect(data.test.object).toEqual({ nested: { value: 'test' } });
        });
    });

    describe('getValue', () => {
        beforeEach(async () => {
            await setValue('users', 'john', { name: 'John Doe', age: 30 });
            await setValue('users', 'jane', { name: 'Jane Smith', age: 25 });
            await setValue('products', 'laptop', { name: 'Gaming Laptop', price: 1200 });
        });

        it('should get a specific value by namespace and key', async () => {
            const value = await getValue('users', 'john');
            expect(value).toEqual({ name: 'John Doe', age: 30 });
        });

        it('should get all values in a namespace when key is undefined', async () => {
            const values = await getValue('users');
            expect(values).toEqual({
                john: { name: 'John Doe', age: 30 },
                jane: { name: 'Jane Smith', age: 25 }
            });
        });

        it('should return undefined for non-existent key', async () => {
            const value = await getValue('users', 'nonexistent');
            expect(value).toBeUndefined();
        });

        it('should return undefined for non-existent namespace with key', async () => {
            const value = await getValue('nonexistent', 'key');
            expect(value).toBeUndefined();
        });

        it('should return empty object for non-existent namespace without key', async () => {
            const value = await getValue('nonexistent');
            expect(value).toEqual({});
        });

        it('should handle empty file', async () => {
            fs.writeFileSync(testDataPath, '');
            const value = await getValue('users', 'john');
            expect(value).toBeUndefined();
        });
    });

    describe('deleteValue', () => {
        beforeEach(async () => {
            await setValue('users', 'john', { name: 'John Doe' });
            await setValue('users', 'jane', { name: 'Jane Smith' });
            await setValue('products', 'laptop', { name: 'Gaming Laptop' });
        });

        it('should delete a specific value', async () => {
            await deleteValue('users', 'john');
            
            const data = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
            expect(data.users.john).toBeUndefined();
            expect(data.users.jane).toEqual({ name: 'Jane Smith' });
        });

        it('should remove empty namespace after deleting last key', async () => {
            await deleteValue('products', 'laptop');
            
            const data = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
            expect(data.products).toBeUndefined();
            expect(data.users).toBeDefined();
        });

        it('should handle deleting from non-existent namespace', async () => {
            await deleteValue('nonexistent', 'key');
            
            // Should not throw error and file should remain intact
            const data = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
            expect(data.users).toBeDefined();
            expect(data.products).toBeDefined();
        });

        it('should handle deleting non-existent key from existing namespace', async () => {
            await deleteValue('users', 'nonexistent');
            
            const data = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
            expect(data.users.john).toEqual({ name: 'John Doe' });
            expect(data.users.jane).toEqual({ name: 'Jane Smith' });
        });

        it('should maintain file structure after partial deletion', async () => {
            await deleteValue('users', 'john');
            
            const data = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
            expect(Object.keys(data)).toEqual(['users', 'products']);
            expect(Object.keys(data.users)).toEqual(['jane']);
        });
    });

    describe('Error handling', () => {
        it('should handle corrupted JSON file', async () => {
            fs.writeFileSync(testDataPath, '{ invalid json }');
            
            // Should throw JSON parsing error
            await expect(getValue('users', 'john')).rejects.toThrow();
        });

        it('should handle file permission errors gracefully', async () => {
            // This test might not work on all systems, but it's good to have
            const restrictedPath = '/root/restricted.json';
            
            // On Windows, this might not throw the expected error
            if (process.platform !== 'win32') {
                await expect(openFile(restrictedPath)).rejects.toThrow();
            }
        });
    });
});
