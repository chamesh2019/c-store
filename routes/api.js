const express = require('express');
const router = express.Router();
const { setValue, getValue, deleteValue, getNamespaces, deleteNamespace } = require('../lib/storage');

router.get('/:namespace', async (req, res) => {
    try {
        const { namespace } = req.params;
        const values = await getValue(namespace);
        res.json({
            namespace,
            values,
            count: Object.keys(values).length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all namespaces
router.get('/', async (req, res) => {
    try {
        const namespaces = await getNamespaces();
        res.json({
            message: 'Welcome to the C-Store API',
            status: 'API is running successfully!',
            namespaces,
            count: namespaces.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:namespace/:id', async (req, res) => {
    try {
        const { namespace, id } = req.params;
        const { value } = req.body;
        await setValue(namespace, id, value);
        res.json({ message: 'Value set successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:namespace/:id', async (req, res) => {
    try {
        const { namespace, id } = req.params;
        const value = await getValue(namespace, id);
        res.json({ value });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:namespace/:id', async (req, res) => {
    try {
        const { namespace, id } = req.params;
        await deleteValue(namespace, id);
        res.json({ message: 'Value deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete entire namespace
router.delete('/:namespace', async (req, res) => {
    try {
        const { namespace } = req.params;
        await deleteNamespace(namespace);
        res.json({ message: `Namespace '${namespace}' deleted successfully` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
