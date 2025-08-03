# C-Store API Benchmark Guide

This benchmark suite tests the performance of your C-Store API with different concurrent connection loads.

## Quick Start

1. **Start the server** (in one terminal):
   ```bash
   npm start
   # or for development mode:
   npm run dev
   ```

2. **Run the benchmark** (in another terminal):
   ```bash
   npm run benchmark
   ```

## Available Benchmark Commands

### Default Benchmark
Tests with 10, 100, and 1000 concurrent connections:
```bash
npm run benchmark
```

### Light Benchmark
Tests with 10 and 50 concurrent connections (good for development):
```bash
npm run benchmark:light
```

### Heavy Benchmark
Tests with 100, 500, and 1000 concurrent connections:
```bash
npm run benchmark:heavy
```

### Custom Connection Counts
You can specify custom connection counts:
```bash
node benchmark.js 25 75 150 300
```

## What the Benchmark Tests

### SET Operations (POST)
- Creates unique key-value pairs for each connection
- Tests write performance under load
- Measures response times and throughput

### GET Operations (GET)
- Reads pre-populated test data
- Tests read performance under load
- Measures response times and throughput

## Benchmark Metrics

- **Success Rate**: Percentage of successful requests
- **Duration**: Total time to complete all requests
- **Average Response Time**: Average time per request
- **Throughput**: Requests per second
- **Error Count**: Number of failed requests

## Understanding the Output

```
📊 Results for 100 concurrent SET operations:
   ✅ Success: 100/100
   ❌ Errors: 0
   ⏱️  Total time: 1250ms
   📈 Average response time: 12ms
   🚄 Throughput: 80 req/sec
```

## Performance Tips

1. **Server Configuration**: Ensure your server has adequate resources
2. **Connection Limits**: Monitor system connection limits
3. **Storage Performance**: File I/O can be a bottleneck
4. **Memory Usage**: Watch memory consumption during high-load tests
5. **Error Analysis**: Check error patterns for connection issues

## Troubleshooting

### Server Not Running
```
❌ Server is not running or not accessible at http://localhost:3000
💡 Please start the server using: npm start or npm run dev
```
**Solution**: Start the server in another terminal before running benchmarks.

### High Error Rates
If you see many errors:
- Check server logs for error details
- Reduce connection counts temporarily
- Verify server resource availability
- Check for port conflicts

### Low Performance
If performance is lower than expected:
- Check system CPU and memory usage
- Monitor disk I/O (especially for storage operations)
- Consider server-side optimizations
- Test with lower connection counts first

## Example Output

The benchmark generates detailed reports including:
- Individual test results for each connection count
- Summary tables comparing performance across different loads
- Error analysis and troubleshooting information
- Timing and throughput metrics

This helps you understand how your API performs under different load conditions and identify potential bottlenecks.
