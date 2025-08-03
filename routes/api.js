const express = require('express');
const router = express.Router();
const { setValue, getValue, deleteValue } = require('../lib/storage');

router.get('/:namespace', (req, res) => {
    const { namespace } = req.params;
    res.json({
        message: `Welcome to the C-Store API`,
        status: 'API is running successfully!',
    });
});

router.post('/:namespace/:id', async (req, res) => {
    const { namespace, id } = req.params;
    const { value } = req.body;
    await setValue(namespace, id, value);
    res.json({ message: 'Value set successfully' });
});

router.get('/:namespace/:id', async (req, res) => {
    const { namespace, id } = req.params;
    const value = await getValue(namespace, id);
    res.json({ value });
});

router.delete('/:namespace/:id', async (req, res) => {
    const { namespace, id } = req.params;
    await deleteValue(namespace, id);
    res.json({ message: 'Value deleted successfully' });
});

module.exports = router;
