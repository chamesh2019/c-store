const request = require('supertest');
const app = require('../app');
const fs = require('fs');
const path = require('path');

describe('Integration Tests', () => {
    const dataPath = path.join(__dirname, '..', 'lib', 'data.json');

    beforeEach(() => {
        // Clean up data file before each test
        if (fs.existsSync(dataPath)) {
            fs.unlinkSync(dataPath);
        }
    });

    afterEach(() => {
        // Clean up data file after each test
        if (fs.existsSync(dataPath)) {
            fs.unlinkSync(dataPath);
        }
    });

    describe('End-to-End User Stories', () => {
        it('should handle a complete user management workflow', async () => {
            // User registration
            await request(app)
                .post('/api/users/john')
                .send({
                    value: {
                        name: 'John Doe',
                        email: 'john@example.com',
                        role: 'user',
                        createdAt: new Date().toISOString()
                    }
                })
                .expect(200);

            // Get user profile
            const userResponse = await request(app)
                .get('/api/users/john')
                .expect(200);

            expect(userResponse.body.value.name).toBe('John Doe');
            expect(userResponse.body.value.email).toBe('john@example.com');

            // Update user profile
            await request(app)
                .post('/api/users/john')
                .send({
                    value: {
                        name: 'John Doe',
                        email: 'john.doe@example.com',
                        role: 'admin',
                        updatedAt: new Date().toISOString()
                    }
                })
                .expect(200);

            // Verify update
            const updatedResponse = await request(app)
                .get('/api/users/john')
                .expect(200);

            expect(updatedResponse.body.value.email).toBe('john.doe@example.com');
            expect(updatedResponse.body.value.role).toBe('admin');

            // Delete user
            await request(app)
                .delete('/api/users/john')
                .expect(200);

            // Verify deletion
            const deletedResponse = await request(app)
                .get('/api/users/john')
                .expect(200);

            expect(deletedResponse.body.value).toBeUndefined();
        });

        it('should handle e-commerce product management', async () => {
            // Add products
            const products = [
                { id: 'laptop1', name: 'Gaming Laptop', price: 1200, category: 'electronics', stock: 5 },
                { id: 'mouse1', name: 'Gaming Mouse', price: 80, category: 'electronics', stock: 25 },
                { id: 'keyboard1', name: 'Mechanical Keyboard', price: 150, category: 'electronics', stock: 15 }
            ];

            for (const product of products) {
                await request(app)
                    .post(`/api/products/${product.id}`)
                    .send({ value: product })
                    .expect(200);
            }

            // Get all products (simulated by getting each one)
            for (const product of products) {
                const response = await request(app)
                    .get(`/api/products/${product.id}`)
                    .expect(200);

                expect(response.body.value.name).toBe(product.name);
                expect(response.body.value.price).toBe(product.price);
            }

            // Update stock levels
            await request(app)
                .post('/api/products/laptop1')
                .send({
                    value: {
                        id: 'laptop1',
                        name: 'Gaming Laptop',
                        price: 1200,
                        category: 'electronics',
                        stock: 3 // Reduced stock
                    }
                })
                .expect(200);

            // Verify stock update
            const stockResponse = await request(app)
                .get('/api/products/laptop1')
                .expect(200);

            expect(stockResponse.body.value.stock).toBe(3);

            // Remove discontinued product
            await request(app)
                .delete('/api/products/mouse1')
                .expect(200);

            const removedResponse = await request(app)
                .get('/api/products/mouse1')
                .expect(200);

            expect(removedResponse.body.value).toBeUndefined();
        });

        it('should handle session and cache management', async () => {
            // Create user sessions
            const sessions = [
                { id: 'session123', userId: 'john', loginTime: Date.now(), expires: Date.now() + 3600000 },
                { id: 'session456', userId: 'jane', loginTime: Date.now(), expires: Date.now() + 3600000 }
            ];

            for (const session of sessions) {
                await request(app)
                    .post(`/api/sessions/${session.id}`)
                    .send({ value: session })
                    .expect(200);
            }

            // Add some cached data
            await request(app)
                .post('/api/cache/user:john:preferences')
                .send({
                    value: {
                        theme: 'dark',
                        language: 'en',
                        notifications: true
                    }
                })
                .expect(200);

            // Verify session data
            const sessionResponse = await request(app)
                .get('/api/sessions/session123')
                .expect(200);

            expect(sessionResponse.body.value.userId).toBe('john');

            // Verify cache data
            const cacheResponse = await request(app)
                .get('/api/cache/user:john:preferences')
                .expect(200);

            expect(cacheResponse.body.value.theme).toBe('dark');

            // Clean up expired sessions
            await request(app)
                .delete('/api/sessions/session123')
                .expect(200);

            await request(app)
                .delete('/api/sessions/session456')
                .expect(200);

            // Verify cleanup
            const cleanupResponse = await request(app)
                .get('/api/sessions/session123')
                .expect(200);

            expect(cleanupResponse.body.value).toBeUndefined();
        });
    });

    describe('Performance and Load Tests', () => {
        it('should handle multiple concurrent requests', async () => {
            const concurrentRequests = 10;
            const promises = [];

            // Create concurrent write requests
            for (let i = 0; i < concurrentRequests; i++) {
                promises.push(
                    request(app)
                        .post(`/api/load/item${i}`)
                        .send({ value: { id: i, data: `test data ${i}` } })
                );
            }

            const responses = await Promise.all(promises);
            
            // All requests should succeed
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Value set successfully');
            });

            // Verify all data was written correctly
            const readPromises = [];
            for (let i = 0; i < concurrentRequests; i++) {
                readPromises.push(
                    request(app).get(`/api/load/item${i}`)
                );
            }

            const readResponses = await Promise.all(readPromises);
            
            readResponses.forEach((response, index) => {
                expect(response.status).toBe(200);
                expect(response.body.value.data).toBe(`test data ${index}`);
            });
        });

        it('should handle large data payloads', async () => {
            const largeData = {
                metadata: {
                    size: 'large',
                    items: 1000
                },
                data: Array.from({ length: 1000 }, (_, i) => ({
                    id: i,
                    name: `Item ${i}`,
                    description: 'A'.repeat(100), // 100 character description
                    tags: [`tag${i}`, `category${i % 10}`, 'bulk-data'],
                    properties: {
                        created: new Date().toISOString(),
                        weight: Math.random() * 100,
                        color: ['red', 'blue', 'green', 'yellow'][i % 4]
                    }
                }))
            };

            const response = await request(app)
                .post('/api/bulk/large-dataset')
                .send({ value: largeData })
                .expect(200);

            expect(response.body.message).toBe('Value set successfully');

            // Verify the data was stored correctly
            const retrieveResponse = await request(app)
                .get('/api/bulk/large-dataset')
                .expect(200);

            expect(retrieveResponse.body.value.metadata.items).toBe(1000);
            expect(retrieveResponse.body.value.data).toHaveLength(1000);
            expect(retrieveResponse.body.value.data[0].name).toBe('Item 0');
            expect(retrieveResponse.body.value.data[999].name).toBe('Item 999');
        });
    });

    describe('Error Recovery and Edge Cases', () => {
        it('should handle malformed requests gracefully', async () => {
            // Test with no body
            const response1 = await request(app)
                .post('/api/test/nobody')
                .expect(200);

            expect(response1.body.message).toBe('Value set successfully');

            // Test with malformed JSON (this is handled by Express middleware)
            const response2 = await request(app)
                .post('/api/test/malformed')
                .set('Content-Type', 'application/json')
                .send('{"incomplete": json}')
                .expect(400); // Express will return 400 for malformed JSON
        });

        it('should maintain data consistency across operations', async () => {
            // Perform a series of mixed operations
            await request(app)
                .post('/api/consistency/item1')
                .send({ value: { version: 1, data: 'initial' } })
                .expect(200);

            await request(app)
                .post('/api/consistency/item2')
                .send({ value: { version: 1, data: 'second' } })
                .expect(200);

            // Update first item
            await request(app)
                .post('/api/consistency/item1')
                .send({ value: { version: 2, data: 'updated' } })
                .expect(200);

            // Delete second item
            await request(app)
                .delete('/api/consistency/item2')
                .expect(200);

            // Add third item
            await request(app)
                .post('/api/consistency/item3')
                .send({ value: { version: 1, data: 'third' } })
                .expect(200);

            // Verify final state
            const item1 = await request(app).get('/api/consistency/item1').expect(200);
            const item2 = await request(app).get('/api/consistency/item2').expect(200);
            const item3 = await request(app).get('/api/consistency/item3').expect(200);

            expect(item1.body.value).toEqual({ version: 2, data: 'updated' });
            expect(item2.body.value).toBeUndefined();
            expect(item3.body.value).toEqual({ version: 1, data: 'third' });
        });

        it('should handle special characters in namespaces and keys', async () => {
            const specialCases = [
                { namespace: 'user-data', key: 'test@example.com', value: 'email key' },
                { namespace: 'config_settings', key: 'api.rate.limit', value: 1000 },
                { namespace: 'cache:redis', key: 'session:123:data', value: { active: true } }
            ];

            for (const testCase of specialCases) {
                await request(app)
                    .post(`/api/${testCase.namespace}/${testCase.key}`)
                    .send({ value: testCase.value })
                    .expect(200);

                const response = await request(app)
                    .get(`/api/${testCase.namespace}/${testCase.key}`)
                    .expect(200);

                expect(response.body.value).toEqual(testCase.value);
            }
        });
    });

    describe('Server Health and Monitoring', () => {
        it('should maintain health endpoint functionality under load', async () => {
            // Create some load first
            const loadPromises = [];
            for (let i = 0; i < 20; i++) {
                loadPromises.push(
                    request(app)
                        .post(`/api/health-test/item${i}`)
                        .send({ value: { data: `load test ${i}` } })
                );
            }

            await Promise.all(loadPromises);

            // Health endpoint should still work
            const healthResponse = await request(app)
                .get('/health')
                .expect(200);

            expect(healthResponse.body.status).toBe('OK');
            expect(typeof healthResponse.body.uptime).toBe('number');
            expect(healthResponse.body.timestamp).toBeDefined();
        });

        it('should provide consistent server information', async () => {
            const responses = await Promise.all([
                request(app).get('/'),
                request(app).get('/'),
                request(app).get('/')
            ]);

            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Welcome to C-Store API');
                expect(response.body.status).toBe('Server is running successfully!');
                expect(response.body.endpoints).toEqual({
                    health: '/health',
                    api: '/api'
                });
            });
        });
    });
});
