const http = require('http');
const { performance } = require('perf_hooks');

class ApiBenchmark {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
        this.results = {};
    }

    // Create HTTP request promise
    makeRequest(options, data = null) {
        return new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        data: responseData,
                        headers: res.headers
                    });
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    // SET operation (POST request)
    async setValue(namespace, id, value) {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/api/${namespace}/${id}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        return this.makeRequest(options, { value });
    }

    // GET operation
    async getValue(namespace, id) {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/api/${namespace}/${id}`,
            method: 'GET'
        };

        return this.makeRequest(options);
    }

    // Run concurrent operations
    async runConcurrentOperations(operation, count, operationType) {
        const startTime = performance.now();
        const promises = [];
        const errors = [];
        const successes = [];

        console.log(`\n🚀 Starting ${count} concurrent ${operationType} operations...`);

        for (let i = 0; i < count; i++) {
            const promise = operation(i)
                .then(result => {
                    successes.push(result);
                    return result;
                })
                .catch(error => {
                    errors.push(error);
                    return { error: error.message };
                });
            promises.push(promise);
        }

        await Promise.all(promises);
        const endTime = performance.now();
        const duration = endTime - startTime;

        return {
            count,
            duration: Math.round(duration),
            averageResponseTime: Math.round(duration / count),
            successCount: successes.length,
            errorCount: errors.length,
            throughput: Math.round((count / duration) * 1000), // requests per second
            errors: errors.slice(0, 5) // Only show first 5 errors
        };
    }

    // Benchmark SET operations
    async benchmarkSet(connectionCounts) {
        console.log('\n📝 BENCHMARKING SET OPERATIONS');
        console.log('=' .repeat(50));

        for (const count of connectionCounts) {
            const operation = async (i) => {
                const namespace = 'benchmark';
                const id = `test_${i}_${Date.now()}`;
                const value = `test_value_${i}_${Math.random()}`;
                return await this.setValue(namespace, id, value);
            };

            const result = await this.runConcurrentOperations(operation, count, 'SET');
            this.results[`SET_${count}`] = result;
            
            console.log(`\n📊 Results for ${count} concurrent SET operations:`);
            console.log(`   ✅ Success: ${result.successCount}/${result.count}`);
            console.log(`   ❌ Errors: ${result.errorCount}`);
            console.log(`   ⏱️  Total time: ${result.duration}ms`);
            console.log(`   📈 Average response time: ${result.averageResponseTime}ms`);
            console.log(`   🚄 Throughput: ${result.throughput} req/sec`);
            
            if (result.errors.length > 0) {
                console.log(`   🚨 Sample errors:`, result.errors);
            }

            // Wait a bit between tests to let the server recover
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // Benchmark GET operations (requires pre-populated data)
    async benchmarkGet(connectionCounts) {
        console.log('\n📖 BENCHMARKING GET OPERATIONS');
        console.log('=' .repeat(50));

        // First, populate some test data
        console.log('\n🔧 Pre-populating test data...');
        const maxConnections = Math.max(...connectionCounts);
        for (let i = 0; i < maxConnections; i++) {
            try {
                await this.setValue('benchmark', `get_test_${i}`, `value_${i}`);
            } catch (error) {
                console.log(`Warning: Failed to populate data for get_test_${i}`);
            }
        }
        console.log('✅ Test data populated');

        for (const count of connectionCounts) {
            const operation = async (i) => {
                const namespace = 'benchmark';
                const id = `get_test_${i % maxConnections}`; // Cycle through available test data
                return await this.getValue(namespace, id);
            };

            const result = await this.runConcurrentOperations(operation, count, 'GET');
            this.results[`GET_${count}`] = result;
            
            console.log(`\n📊 Results for ${count} concurrent GET operations:`);
            console.log(`   ✅ Success: ${result.successCount}/${result.count}`);
            console.log(`   ❌ Errors: ${result.errorCount}`);
            console.log(`   ⏱️  Total time: ${result.duration}ms`);
            console.log(`   📈 Average response time: ${result.averageResponseTime}ms`);
            console.log(`   🚄 Throughput: ${result.throughput} req/sec`);
            
            if (result.errors.length > 0) {
                console.log(`   🚨 Sample errors:`, result.errors);
            }

            // Wait a bit between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // Check if server is running
    async checkServerHealth() {
        try {
            const options = {
                hostname: 'localhost',
                port: 3000,
                path: '/health',
                method: 'GET'
            };
            
            const response = await this.makeRequest(options);
            return response.statusCode === 200;
        } catch (error) {
            return false;
        }
    }

    // Generate summary report
    generateSummaryReport() {
        console.log('\n📋 BENCHMARK SUMMARY REPORT');
        console.log('=' .repeat(60));
        
        const setResults = Object.entries(this.results).filter(([key]) => key.startsWith('SET_'));
        const getResults = Object.entries(this.results).filter(([key]) => key.startsWith('GET_'));

        if (setResults.length > 0) {
            console.log('\n📝 SET Operations Summary:');
            console.log('┌─────────────┬──────────┬─────────────┬─────────────┬──────────────┐');
            console.log('│ Connections │ Duration │ Success Rate│ Avg Resp.   │ Throughput   │');
            console.log('│             │ (ms)     │ (%)         │ Time (ms)   │ (req/sec)    │');
            console.log('├─────────────┼──────────┼─────────────┼─────────────┼──────────────┤');
            
            setResults.forEach(([key, result]) => {
                const connections = key.split('_')[1];
                const successRate = ((result.successCount / result.count) * 100).toFixed(1);
                console.log(`│ ${connections.padEnd(11)} │ ${result.duration.toString().padEnd(8)} │ ${successRate.padEnd(11)} │ ${result.averageResponseTime.toString().padEnd(11)} │ ${result.throughput.toString().padEnd(12)} │`);
            });
            console.log('└─────────────┴──────────┴─────────────┴─────────────┴──────────────┘');
        }

        if (getResults.length > 0) {
            console.log('\n📖 GET Operations Summary:');
            console.log('┌─────────────┬──────────┬─────────────┬─────────────┬──────────────┐');
            console.log('│ Connections │ Duration │ Success Rate│ Avg Resp.   │ Throughput   │');
            console.log('│             │ (ms)     │ (%)         │ Time (ms)   │ (req/sec)    │');
            console.log('├─────────────┼──────────┼─────────────┼─────────────┼──────────────┤');
            
            getResults.forEach(([key, result]) => {
                const connections = key.split('_')[1];
                const successRate = ((result.successCount / result.count) * 100).toFixed(1);
                console.log(`│ ${connections.padEnd(11)} │ ${result.duration.toString().padEnd(8)} │ ${successRate.padEnd(11)} │ ${result.averageResponseTime.toString().padEnd(11)} │ ${result.throughput.toString().padEnd(12)} │`);
            });
            console.log('└─────────────┴──────────┴─────────────┴─────────────┴──────────────┘');
        }
    }

    // Run full benchmark suite
    async runFullBenchmark(connectionCounts = [10, 100, 1000]) {
        console.log('🎯 C-Store API Benchmark Suite');
        console.log('=' .repeat(60));
        console.log(`📅 Started at: ${new Date().toISOString()}`);
        console.log(`🔗 Target URL: ${this.baseUrl}`);
        console.log(`📊 Testing with: ${connectionCounts.join(', ')} concurrent connections`);

        // Check if server is running
        console.log('\n🔍 Checking server health...');
        const isServerRunning = await this.checkServerHealth();
        
        if (!isServerRunning) {
            console.log('❌ Server is not running or not accessible at http://localhost:3000');
            console.log('💡 Please start the server using: npm start or npm run dev');
            return;
        }
        
        console.log('✅ Server is running and healthy');

        const overallStartTime = performance.now();

        try {
            // Run SET benchmarks
            await this.benchmarkSet(connectionCounts);
            
            // Wait between SET and GET tests
            console.log('\n⏳ Waiting 2 seconds before GET benchmarks...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Run GET benchmarks
            await this.benchmarkGet(connectionCounts);
            
            const overallEndTime = performance.now();
            const totalDuration = Math.round(overallEndTime - overallStartTime);
            
            console.log(`\n⏱️  Total benchmark duration: ${totalDuration}ms`);
            
            // Generate summary report
            this.generateSummaryReport();
            
        } catch (error) {
            console.error('\n❌ Benchmark failed:', error.message);
        }
    }
}

// Main execution
async function main() {
    const benchmark = new ApiBenchmark();
    
    // Get connection counts from command line arguments or use defaults
    const args = process.argv.slice(2);
    let connectionCounts = [10, 100, 1000];
    
    if (args.length > 0) {
        connectionCounts = args.map(arg => parseInt(arg)).filter(num => !isNaN(num) && num > 0);
        if (connectionCounts.length === 0) {
            console.log('❌ Invalid connection counts provided. Using defaults: 10, 100, 1000');
            connectionCounts = [10, 100, 1000];
        }
    }
    
    await benchmark.runFullBenchmark(connectionCounts);
}

// Run the benchmark if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = ApiBenchmark;
