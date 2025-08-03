const request = require('supertest');
const app = require('../app');

describe('API Routes', () => {
    describe('GET /api/:namespace', () => {
        it('should return welcome message for any namespace', async () => {
            const response = await request(app)
                .get('/api/users')
                .expect(200);

            expect(response.body).toEqual({
                message: 'Welcome to the C-Store API',
                status: 'API is running successfully!'
            });
        });

        it('should work with different namespace names', async () => {
            const response = await request(app)
                .get('/api/products')
                .expect(200);

            expect(response.body.message).toBe('Welcome to the C-Store API');
        });
    });

    describe('POST /api/:namespace/:id', () => {
        it('should set a value successfully', async () => {
            const testValue = { name: 'John Doe', age: 30 };
            
            const response = await request(app)
                .post('/api/users/john')
                .send({ value: testValue })
                .expect(200);

            expect(response.body).toEqual({
                message: 'Value set successfully'
            });
        });

        it('should handle different data types', async () => {
            await request(app)
                .post('/api/test/string')
                .send({ value: 'hello world' })
                .expect(200);

            await request(app)
                .post('/api/test/number')
                .send({ value: 42 })
                .expect(200);

            await request(app)
                .post('/api/test/boolean')
                .send({ value: true })
                .expect(200);
        });

        it('should handle missing value in request body', async () => {
            const response = await request(app)
                .post('/api/users/john')
                .send({})
                .expect(200);

            expect(response.body.message).toBe('Value set successfully');
        });
    });

    describe('GET /api/:namespace/:id', () => {
        beforeEach(async () => {
            // Set up test data
            await request(app)
                .post('/api/users/john')
                .send({ value: { name: 'John Doe', age: 30 } });
            
            await request(app)
                .post('/api/users/jane')
                .send({ value: { name: 'Jane Smith', age: 25 } });
        });

        it('should get a specific value', async () => {
            const response = await request(app)
                .get('/api/users/john')
                .expect(200);

            expect(response.body).toEqual({
                value: { name: 'John Doe', age: 30 }
            });
        });

        it('should return undefined for non-existent key', async () => {
            const response = await request(app)
                .get('/api/users/nonexistent')
                .expect(200);

            expect(response.body).toEqual({
                value: undefined
            });
        });

        it('should handle different namespaces', async () => {
            await request(app)
                .post('/api/products/laptop')
                .send({ value: { name: 'Gaming Laptop', price: 1200 } });

            const response = await request(app)
                .get('/api/products/laptop')
                .expect(200);

            expect(response.body.value).toEqual({
                name: 'Gaming Laptop',
                price: 1200
            });
        });
    });

    describe('DELETE /api/:namespace/:id', () => {
        beforeEach(async () => {
            // Set up test data
            await request(app)
                .post('/api/users/john')
                .send({ value: { name: 'John Doe', age: 30 } });
            
            await request(app)
                .post('/api/users/jane')
                .send({ value: { name: 'Jane Smith', age: 25 } });
        });

        it('should delete a value successfully', async () => {
            const response = await request(app)
                .delete('/api/users/john')
                .expect(200);

            expect(response.body).toEqual({
                message: 'Value deleted successfully'
            });

            // Verify the value is deleted
            const getResponse = await request(app)
                .get('/api/users/john')
                .expect(200);

            expect(getResponse.body.value).toBeUndefined();
        });

        it('should handle deleting non-existent values', async () => {
            const response = await request(app)
                .delete('/api/users/nonexistent')
                .expect(200);

            expect(response.body.message).toBe('Value deleted successfully');
        });

        it('should not affect other values in the same namespace', async () => {
            await request(app)
                .delete('/api/users/john')
                .expect(200);

            // Jane should still exist
            const response = await request(app)
                .get('/api/users/jane')
                .expect(200);

            expect(response.body.value).toEqual({
                name: 'Jane Smith',
                age: 25
            });
        });
    });

    describe('Integration tests', () => {
        it('should handle complete CRUD operations', async () => {
            // Create
            await request(app)
                .post('/api/products/laptop')
                .send({ value: { name: 'Gaming Laptop', price: 1200, stock: 5 } })
                .expect(200);

            // Read
            const readResponse = await request(app)
                .get('/api/products/laptop')
                .expect(200);

            expect(readResponse.body.value).toEqual({
                name: 'Gaming Laptop',
                price: 1200,
                stock: 5
            });

            // Update (overwrite)
            await request(app)
                .post('/api/products/laptop')
                .send({ value: { name: 'Gaming Laptop Pro', price: 1500, stock: 3 } })
                .expect(200);

            const updatedResponse = await request(app)
                .get('/api/products/laptop')
                .expect(200);

            expect(updatedResponse.body.value).toEqual({
                name: 'Gaming Laptop Pro',
                price: 1500,
                stock: 3
            });

            // Delete
            await request(app)
                .delete('/api/products/laptop')
                .expect(200);

            const deletedResponse = await request(app)
                .get('/api/products/laptop')
                .expect(200);

            expect(deletedResponse.body.value).toBeUndefined();
        });

        it('should handle multiple namespaces simultaneously', async () => {
            // Set data in different namespaces
            await request(app)
                .post('/api/users/admin')
                .send({ value: { role: 'administrator', permissions: ['read', 'write'] } });

            await request(app)
                .post('/api/config/theme')
                .send({ value: { color: 'dark', font: 'roboto' } });

            await request(app)
                .post('/api/cache/session123')
                .send({ value: { userId: 'admin', expires: '2024-12-31' } });

            // Verify all namespaces work independently
            const userResponse = await request(app)
                .get('/api/users/admin')
                .expect(200);

            const configResponse = await request(app)
                .get('/api/config/theme')
                .expect(200);

            const cacheResponse = await request(app)
                .get('/api/cache/session123')
                .expect(200);

            expect(userResponse.body.value.role).toBe('administrator');
            expect(configResponse.body.value.color).toBe('dark');
            expect(cacheResponse.body.value.userId).toBe('admin');
        });
    });
});
