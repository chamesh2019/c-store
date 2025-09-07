const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize SQLite database
const DB_PATH = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(DB_PATH);

// Initialize the database schema
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS key_value_store (
        namespace TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        PRIMARY KEY (namespace, key)
    )`);
});

/**
 * Sets a value in the specified namespace
 * @param {string} namespace - The namespace to store the value in
 * @param {string} key - The key to store the value under
 * @param {any} value - The value to store
 */
const setValue = async (namespace, key, value) => {
    return new Promise((resolve, reject) => {
        try {
            const jsonValue = JSON.stringify(value);
            db.run(
                'INSERT OR REPLACE INTO key_value_store (namespace, key, value) VALUES (?, ?, ?)',
                [namespace, key, jsonValue],
                function(error) {
                    if (error) {
                        reject(new Error(`Failed to set value: ${error.message}`));
                    } else {
                        resolve();
                    }
                }
            );
        } catch (error) {
            reject(new Error(`Failed to set value: ${error.message}`));
        }
    });
};

/**
 * Gets a value from the specified namespace
 * @param {string} namespace - The namespace to retrieve from
 * @param {string} key - The key to retrieve (optional - if not provided, returns all keys in namespace)
 * @returns {Promise<any>} - The stored value or undefined if not found
 */
const getValue = async (namespace, key) => {
    return new Promise((resolve, reject) => {
        try {
            if (key === undefined) {
                // Return all values in the namespace
                db.all(
                    'SELECT key, value FROM key_value_store WHERE namespace = ?',
                    [namespace],
                    (error, rows) => {
                        if (error) {
                            reject(new Error(`Failed to get value: ${error.message}`));
                        } else {
                            const result = {};
                            rows.forEach(row => {
                                try {
                                    result[row.key] = JSON.parse(row.value);
                                } catch (parseError) {
                                    result[row.key] = row.value;
                                }
                            });
                            resolve(result);
                        }
                    }
                );
            } else {
                // Return specific key
                db.get(
                    'SELECT value FROM key_value_store WHERE namespace = ? AND key = ?',
                    [namespace, key],
                    (error, row) => {
                        if (error) {
                            reject(new Error(`Failed to get value: ${error.message}`));
                        } else if (!row) {
                            resolve(undefined);
                        } else {
                            try {
                                resolve(JSON.parse(row.value));
                            } catch (parseError) {
                                resolve(row.value);
                            }
                        }
                    }
                );
            }
        } catch (error) {
            reject(new Error(`Failed to get value: ${error.message}`));
        }
    });
};

/**
 * Deletes a value from the specified namespace
 * @param {string} namespace - The namespace to delete from
 * @param {string} key - The key to delete
 */
const deleteValue = async (namespace, key) => {
    return new Promise((resolve, reject) => {
        try {
            db.run(
                'DELETE FROM key_value_store WHERE namespace = ? AND key = ?',
                [namespace, key],
                function(error) {
                    if (error) {
                        reject(new Error(`Failed to delete value: ${error.message}`));
                    } else {
                        resolve();
                    }
                }
            );
        } catch (error) {
            reject(new Error(`Failed to delete value: ${error.message}`));
        }
    });
};

/**
 * Gets all namespaces in the database
 * @returns {Promise<string[]>} - Array of namespace names
 */
const getNamespaces = async () => {
    return new Promise((resolve, reject) => {
        try {
            db.all(
                'SELECT DISTINCT namespace FROM key_value_store ORDER BY namespace',
                [],
                (error, rows) => {
                    if (error) {
                        reject(new Error(`Failed to get namespaces: ${error.message}`));
                    } else {
                        const namespaces = rows.map(row => row.namespace);
                        resolve(namespaces);
                    }
                }
            );
        } catch (error) {
            reject(new Error(`Failed to get namespaces: ${error.message}`));
        }
    });
};

/**
 * Deletes an entire namespace and all its keys
 * @param {string} namespace - The namespace to delete
 */
const deleteNamespace = async (namespace) => {
    return new Promise((resolve, reject) => {
        try {
            db.run(
                'DELETE FROM key_value_store WHERE namespace = ?',
                [namespace],
                function(error) {
                    if (error) {
                        reject(new Error(`Failed to delete namespace: ${error.message}`));
                    } else {
                        resolve();
                    }
                }
            );
        } catch (error) {
            reject(new Error(`Failed to delete namespace: ${error.message}`));
        }
    });
};

/**
 * Closes the database connection
 */
const close = async () => {
    return new Promise((resolve, reject) => {
        db.close((error) => {
            if (error) {
                reject(new Error(`Failed to close database: ${error.message}`));
            } else {
                resolve();
            }
        });
    });
};

module.exports = { 
    setValue, 
    getValue, 
    deleteValue, 
    getNamespaces, 
    deleteNamespace, 
    close 
};
