import fs from 'fs-extra';
import path from 'path';

export interface MigrationReport {
  timestamp: string;
  projectName: string;
  analysis: any;
  results: any;
  performanceComparison?: any;
  backupId?: string;
}

export class ReportGenerator {
  async generateReport(data: MigrationReport): Promise<string> {
    const reportPath = path.join(process.cwd(), 'migration-report.html');
    
    const html = this.generateHTMLReport(data);
    await fs.writeFile(reportPath, html);
    
    return reportPath;
  }

  private generateHTMLReport(data: MigrationReport): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Next.js 16 Migration Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 700;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 1.1em;
        }
        .card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .card h2 {
            color: #2d3748;
            margin-top: 0;
            font-size: 1.5em;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .metric:last-child {
            border-bottom: none;
        }
        .metric-label {
            font-weight: 600;
            color: #4a5568;
        }
        .metric-value {
            font-weight: 700;
            color: #2d3748;
        }
        .success {
            color: #38a169;
        }
        .warning {
            color: #d69e2e;
        }
        .error {
            color: #e53e3e;
        }
        .file-list {
            background: #f7fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 15px 0;
        }
        .file-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .file-item:last-child {
            border-bottom: none;
        }
        .file-path {
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9em;
            color: #4a5568;
        }
        .file-type {
            background: #667eea;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: 600;
        }
        .performance-comparison {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .performance-card {
            background: #f7fafc;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .performance-card h3 {
            margin: 0 0 10px 0;
            color: #2d3748;
        }
        .performance-value {
            font-size: 1.5em;
            font-weight: 700;
            color: #38a169;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #718096;
            border-top: 1px solid #e2e8f0;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: 600;
            margin: 2px;
        }
        .badge-success {
            background: #c6f6d5;
            color: #22543d;
        }
        .badge-warning {
            background: #faf089;
            color: #744210;
        }
        .badge-error {
            background: #fed7d7;
            color: #742a2a;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Next.js 16 Migration Report</h1>
        <p>Migration completed on ${new Date(data.timestamp).toLocaleString()}</p>
    </div>

    <div class="card">
        <h2>📊 Migration Summary</h2>
        <div class="metric">
            <span class="metric-label">Files Transformed</span>
            <span class="metric-value success">${data.results.successful}</span>
        </div>
        <div class="metric">
            <span class="metric-label">Failed Transformations</span>
            <span class="metric-value ${data.results.failed > 0 ? 'error' : 'success'}">${data.results.failed}</span>
        </div>
        <div class="metric">
            <span class="metric-label">Migration Complexity</span>
            <span class="metric-value">${data.analysis.complexity}</span>
        </div>
        <div class="metric">
            <span class="metric-label">Estimated Time</span>
            <span class="metric-value">${data.analysis.estimatedTime}</span>
        </div>
    </div>

    <div class="card">
        <h2>📁 Files Transformed</h2>
        <div class="file-list">
            ${data.analysis.filesToTransform.map(file => `
                <div class="file-item">
                    <span class="file-path">${file.path}</span>
                    <span class="file-type">${file.type}</span>
                </div>
            `).join('')}
        </div>
    </div>

    ${data.performanceComparison ? `
    <div class="card">
        <h2>⚡ Performance Improvements</h2>
        <div class="performance-comparison">
            <div class="performance-card">
                <h3>Build Time</h3>
                <div class="performance-value">${data.performanceComparison.improvement.buildTime.toFixed(1)}% faster</div>
            </div>
            <div class="performance-card">
                <h3>Bundle Size</h3>
                <div class="performance-value">${data.performanceComparison.improvement.bundleSize.toFixed(1)}% smaller</div>
            </div>
            <div class="performance-card">
                <h3>Core Web Vitals</h3>
                <div class="performance-value">${data.performanceComparison.improvement.coreWebVitals.status}</div>
            </div>
        </div>
    </div>
    ` : ''}

    <div class="card">
        <h2>🔧 Transformations Applied</h2>
        <div class="file-list">
            ${data.results.changes.map(change => `
                <div class="file-item">
                    <span class="file-path">${change.file}</span>
                    <span class="badge badge-success">${change.description}</span>
                </div>
            `).join('')}
        </div>
    </div>

    ${data.results.errors.length > 0 ? `
    <div class="card">
        <h2>⚠️ Issues Encountered</h2>
        <div class="file-list">
            ${data.results.errors.map(error => `
                <div class="file-item">
                    <span class="file-path">${error.file}</span>
                    <span class="badge badge-error">${error.message}</span>
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    <div class="card">
        <h2>💡 Recommendations</h2>
        <ul>
            ${data.analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>

    ${data.backupId ? `
    <div class="card">
        <h2>🔄 Backup Information</h2>
        <div class="metric">
            <span class="metric-label">Backup ID</span>
            <span class="metric-value">${data.backupId}</span>
        </div>
        <p>To rollback this migration, run: <code>npx @nandann/nextjs16-migrator rollback</code></p>
    </div>
    ` : ''}

    <div class="footer">
        <p>Generated by @nandann/nextjs16-migrator</p>
        <p>For support and documentation, visit: <a href="https://github.com/nandann-creative/nextjs16-migrator">GitHub Repository</a></p>
    </div>
</body>
</html>
    `;
  }
}
