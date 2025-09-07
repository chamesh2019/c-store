const request = require('supertest');
const assert = require('assert');
const sqlite3 = require('sqlite3').verbose();
const { join } = require('path');

// Force test env before requiring app
process.env.NODE_ENV = 'test';
const app = require('../app');

const dbPath = join(__dirname, '..', 'lib', 'data.db');
let dbInstance;

// Helper to wipe database between tests (delete rows to avoid file lock issues on Windows)
const resetDb = (done) => {
    if (!dbInstance) {
        dbInstance = new sqlite3.Database(dbPath, (err) => {
            if (err) return done(err);
            dbInstance.run('DELETE FROM key_value_store', [], (delErr) => done(delErr));
        });
    } else {
        dbInstance.run('DELETE FROM key_value_store', [], (delErr) => done(delErr));
    }
};

describe('C-Store API', () => {
    beforeEach((done) => {
        resetDb(done);
    });

    after((done) => {
        if (dbInstance) {
            dbInstance.close(done);
        } else {
            done();
        }
    });

    describe('Root & Health', () => {
        it('GET / should return welcome payload', async () => {
            const res = await request(app).get('/');
            assert.strictEqual(res.status, 200);
            assert(res.body.message);
            assert(res.body.status);
            assert(res.body.endpoints);
            assert(res.body.endpoints.health);
            assert(res.body.endpoints.api);
        });

        it('GET /health should return OK status', async () => {
            const res = await request(app).get('/health');
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.status, 'OK');
            assert(res.body.uptime !== undefined);
        });
    });

    describe('Namespaces listing', () => {
        it('GET /api should return empty namespaces initially', async () => {
            const res = await request(app).get('/api');
            assert.strictEqual(res.status, 200);
            assert(Array.isArray(res.body.namespaces));
            assert.strictEqual(res.body.namespaces.length, 0);
            assert.strictEqual(res.body.count, 0);
        });

        it('GET /api should list namespaces after inserts', async () => {
            await request(app).post('/api/users/1').send({ value: { name: 'Alice' } });
            await request(app).post('/api/orders/100').send({ value: { total: 10 } });

            const res = await request(app).get('/api');
            assert.strictEqual(res.status, 200);
            assert(res.body.namespaces.includes('orders'));
            assert(res.body.namespaces.includes('users'));
            assert.strictEqual(res.body.count, 2);
        });
    });

    describe('Namespace operations', () => {
        it('GET /api/:namespace should return empty object for new namespace', async () => {
            const res = await request(app).get('/api/products');
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.namespace, 'products');
            assert.deepStrictEqual(res.body.values, {});
            assert.strictEqual(res.body.count, 0);
        });

        it('POST then GET namespace should include inserted keys', async () => {
            await request(app).post('/api/products/p1').send({ value: { price: 10 } });
            await request(app).post('/api/products/p2').send({ value: { price: 15 } });
            const res = await request(app).get('/api/products');
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.count, 2);
            assert(res.body.values.p1);
            assert(res.body.values.p2);
        });
    });

    describe('Key operations', () => {
        it('POST /api/:namespace/:id should store value and GET should retrieve it', async () => {
            const payload = { name: 'Widget', price: 42 };
            const setRes = await request(app).post('/api/catalog/w1').send({ value: payload });
            assert.strictEqual(setRes.status, 200);
            assert(setRes.body.message.includes('Value set'));

            const getRes = await request(app).get('/api/catalog/w1');
            assert.strictEqual(getRes.status, 200);
            assert.deepStrictEqual(getRes.body.value, payload);
        });

        it('GET non-existent key should return empty object (no value property)', async () => {
            const res = await request(app).get('/api/unknown/doesNotExist');
            assert.strictEqual(res.status, 200);
            assert.strictEqual(typeof res.body, 'object');
            assert.strictEqual(res.body.value, undefined);
        });

        it('DELETE /api/:namespace/:id should remove key', async () => {
            await request(app).post('/api/tmp/a').send({ value: 1 });
            const delRes = await request(app).delete('/api/tmp/a');
            assert.strictEqual(delRes.status, 200);
            assert(delRes.body.message.includes('deleted successfully'));

            const getRes = await request(app).get('/api/tmp/a');
            assert.strictEqual(getRes.status, 200);
            assert.strictEqual(getRes.body.value, undefined);
        });
    });

    describe('Delete namespace', () => {
        it('DELETE /api/:namespace should remove all keys in namespace', async () => {
            await request(app).post('/api/group/k1').send({ value: 1 });
            await request(app).post('/api/group/k2').send({ value: 2 });
            const before = await request(app).get('/api/group');
            assert.strictEqual(before.body.count, 2);

            const delNs = await request(app).delete('/api/group');
            assert.strictEqual(delNs.status, 200);
            assert(delNs.body.message.includes("Namespace 'group' deleted successfully"));

            const after = await request(app).get('/api/group');
            assert.strictEqual(after.body.count, 0);
            assert.deepStrictEqual(after.body.values, {});
        });
    });

    describe('Error & 404 handling', () => {
        it('Returns 404 for unknown route', async () => {
            const res = await request(app).get('/some/missing/path');
            assert.strictEqual(res.status, 404);
            assert(res.body.error);
            assert(res.body.path);
        });
    });
});

