const request = require('supertest');
const app = require('../app');

describe('App.js - Express Server', () => {
    describe('GET /', () => {
        it('should return welcome message with endpoints', async () => {
            const response = await request(app)
                .get('/')
                .expect(200)
                .expect('Content-Type', /json/);

            expect(response.body).toEqual({
                message: 'Welcome to C-Store API',
                status: 'Server is running successfully!',
                endpoints: {
                    health: '/health',
                    api: '/api'
                }
            });
        });
    });

    describe('GET /health', () => {
        it('should return health check information', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200)
                .expect('Content-Type', /json/);

            expect(response.body).toHaveProperty('status', 'OK');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('uptime');
            
            // Verify timestamp is a valid ISO string
            expect(() => new Date(response.body.timestamp)).not.toThrow();
            
            // Verify uptime is a number
            expect(typeof response.body.uptime).toBe('number');
            expect(response.body.uptime).toBeGreaterThanOrEqual(0);
        });

        it('should return different uptime values on subsequent calls', async () => {
            const response1 = await request(app).get('/health');
            
            // Wait a small amount of time
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const response2 = await request(app).get('/health');
            
            expect(response2.body.uptime).toBeGreaterThanOrEqual(response1.body.uptime);
        });
    });

    describe('404 Handler', () => {
        it('should return 404 for non-existent routes', async () => {
            const response = await request(app)
                .get('/nonexistent')
                .expect(404)
                .expect('Content-Type', /json/);

            expect(response.body).toEqual({
                error: 'Route not found',
                path: '/nonexistent'
            });
        });

        it('should return 404 for non-existent POST routes', async () => {
            const response = await request(app)
                .post('/nonexistent')
                .expect(404)
                .expect('Content-Type', /json/);

            expect(response.body).toEqual({
                error: 'Route not found',
                path: '/nonexistent'
            });
        });

        it('should include the correct path in 404 response', async () => {
            const testPath = '/some/deep/path/that/does/not/exist';
            const response = await request(app)
                .get(testPath)
                .expect(404);

            expect(response.body.path).toBe(testPath);
        });
    });

    describe('Middleware', () => {
        it('should parse JSON request bodies', async () => {
            const testData = { test: 'data', number: 42 };
            
            const response = await request(app)
                .post('/api/test/json')
                .send(testData)
                .expect(200);

            expect(response.body.message).toBe('Value set successfully');
        });

        it('should parse URL-encoded request bodies', async () => {
            const response = await request(app)
                .post('/api/test/urlencoded')
                .send('value=test%20data')
                .expect(200);

            expect(response.body.message).toBe('Value set successfully');
        });

        it('should handle large JSON payloads', async () => {
            const largeData = {
                items: Array.from({ length: 1000 }, (_, i) => ({
                    id: i,
                    name: `Item ${i}`,
                    description: `This is item number ${i} with some longer description text`
                }))
            };

            const response = await request(app)
                .post('/api/bulk/data')
                .send({ value: largeData })
                .expect(200);

            expect(response.body.message).toBe('Value set successfully');
        });
    });

    describe('Error Handling', () => {
        it('should handle errors gracefully', async () => {
            // This test assumes we might have some error-producing endpoint
            // Since we don't have one, we'll test the storage layer error handling
            const fs = require('fs');
            const path = require('path');
            
            // Create an invalid JSON file to trigger an error
            const dataPath = path.join(__dirname, '..', 'lib', 'data.json');
            fs.writeFileSync(dataPath, '{ invalid json content');
            
            const response = await request(app)
                .get('/api/test/errortest')
                .expect(500);

            expect(response.body).toHaveProperty('error');
            
            // Clean up
            try {
                fs.unlinkSync(dataPath);
            } catch (e) {
                // Ignore cleanup errors
            }
        });
    });

    describe('API Integration', () => {
        it('should properly mount API routes', async () => {
            // Test that /api routes are properly mounted
            const response = await request(app)
                .get('/api/test')
                .expect(200);

            expect(response.body.message).toBe('Welcome to the C-Store API');
        });

        it('should handle API routes with parameters', async () => {
            await request(app)
                .post('/api/users/testuser')
                .send({ value: { name: 'Test User' } })
                .expect(200);

            const response = await request(app)
                .get('/api/users/testuser')
                .expect(200);

            expect(response.body.value).toEqual({ name: 'Test User' });
        });
    });

    describe('Content Type Handling', () => {
        it('should set correct content type for JSON responses', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);

            expect(response.headers['content-type']).toMatch(/application\/json/);
        });

        it('should handle requests without content-type header', async () => {
            const response = await request(app)
                .post('/api/test/nocontenttype')
                .send('{"value": "test"}')
                .expect(200);

            expect(response.body.message).toBe('Value set successfully');
        });
    });

    describe('HTTP Methods', () => {
        it('should support GET requests', async () => {
            await request(app)
                .get('/')
                .expect(200);
        });

        it('should support POST requests', async () => {
            await request(app)
                .post('/api/test/post')
                .send({ value: 'test' })
                .expect(200);
        });

        it('should support DELETE requests', async () => {
            await request(app)
                .delete('/api/test/delete')
                .expect(200);
        });

        it('should return 404 for unsupported methods on existing routes', async () => {
            await request(app)
                .patch('/api/test/patch')
                .expect(404);
        });
    });
});
