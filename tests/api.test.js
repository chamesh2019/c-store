const request = require('supertest');
const { expect } = require('chai');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Force test env before requiring app
process.env.NODE_ENV = 'test';
const app = require('../app');
const dbPath = path.join(__dirname, '..', 'lib', 'data.db');
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

	describe('Root & Health', () => {
		it('GET / should return welcome payload', async () => {
			const res = await request(app).get('/');
			expect(res.status).to.equal(200);
			expect(res.body).to.include.keys(['message', 'status', 'endpoints']);
			expect(res.body.endpoints).to.have.keys(['health', 'api']);
		});

		it('GET /health should return OK status', async () => {
			const res = await request(app).get('/health');
			expect(res.status).to.equal(200);
			expect(res.body.status).to.equal('OK');
			expect(res.body).to.have.property('uptime');
		});
	});

	describe('Namespaces listing', () => {
		it('GET /api should return empty namespaces initially', async () => {
			const res = await request(app).get('/api');
			expect(res.status).to.equal(200);
			expect(res.body.namespaces).to.be.an('array').that.is.empty;
			expect(res.body.count).to.equal(0);
		});

		it('GET /api should list namespaces after inserts', async () => {
			await request(app).post('/api/users/1').send({ value: { name: 'Alice' } });
			await request(app).post('/api/orders/100').send({ value: { total: 10 } });

			const res = await request(app).get('/api');
			expect(res.status).to.equal(200);
			expect(res.body.namespaces).to.have.members(['orders', 'users']);
			expect(res.body.count).to.equal(2);
		});
	});

	describe('Namespace operations', () => {
		it('GET /api/:namespace should return empty object for new namespace', async () => {
			const res = await request(app).get('/api/products');
			expect(res.status).to.equal(200);
			expect(res.body.namespace).to.equal('products');
			expect(res.body.values).to.deep.equal({});
			expect(res.body.count).to.equal(0);
		});

		it('POST then GET namespace should include inserted keys', async () => {
			await request(app).post('/api/products/p1').send({ value: { price: 10 } });
			await request(app).post('/api/products/p2').send({ value: { price: 15 } });
			const res = await request(app).get('/api/products');
			expect(res.status).to.equal(200);
			expect(res.body.count).to.equal(2);
			expect(res.body.values).to.have.keys(['p1', 'p2']);
		});
	});

	describe('Key operations', () => {
		it('POST /api/:namespace/:id should store value and GET should retrieve it', async () => {
			const payload = { name: 'Widget', price: 42 };
			const setRes = await request(app).post('/api/catalog/w1').send({ value: payload });
			expect(setRes.status).to.equal(200);
			expect(setRes.body.message).to.match(/Value set/);

			const getRes = await request(app).get('/api/catalog/w1');
			expect(getRes.status).to.equal(200);
			expect(getRes.body.value).to.deep.equal(payload);
		});

			it('GET non-existent key should return empty object (no value property)', async () => {
				const res = await request(app).get('/api/unknown/doesNotExist');
				expect(res.status).to.equal(200);
				expect(res.body).to.be.an('object').that.is.empty;
				expect(res.body).to.not.have.property('value');
			});

		it('DELETE /api/:namespace/:id should remove key', async () => {
			await request(app).post('/api/tmp/a').send({ value: 1 });
			const delRes = await request(app).delete('/api/tmp/a');
			expect(delRes.status).to.equal(200);
			expect(delRes.body.message).to.match(/deleted successfully/);

			const getRes = await request(app).get('/api/tmp/a');
			expect(getRes.status).to.equal(200);
			expect(getRes.body.value).to.equal(undefined);
		});
	});

	describe('Delete namespace', () => {
		it('DELETE /api/:namespace should remove all keys in namespace', async () => {
			await request(app).post('/api/group/k1').send({ value: 1 });
			await request(app).post('/api/group/k2').send({ value: 2 });
			const before = await request(app).get('/api/group');
			expect(before.body.count).to.equal(2);

			const delNs = await request(app).delete('/api/group');
			expect(delNs.status).to.equal(200);
			expect(delNs.body.message).to.match(/Namespace 'group' deleted successfully/);

			const after = await request(app).get('/api/group');
			expect(after.body.count).to.equal(0);
			expect(after.body.values).to.deep.equal({});
		});
	});

	describe('Error & 404 handling', () => {
		it('Returns 404 for unknown route', async () => {
			const res = await request(app).get('/some/missing/path');
			expect(res.status).to.equal(404);
			expect(res.body).to.include.keys(['error', 'path']);
		});
	});
});

