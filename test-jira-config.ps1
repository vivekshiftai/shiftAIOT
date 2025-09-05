# Test Jira Configuration
Write-Host "Testing Jira Configuration..." -ForegroundColor Green

# Check environment variables
Write-Host "`nEnvironment Variables:" -ForegroundColor Yellow
Write-Host "JIRA_BASE_URL: $env:JIRA_BASE_URL"
Write-Host "JIRA_USERNAME: $env:JIRA_USERNAME"
Write-Host "JIRA_API_TOKEN: $env:JIRA_API_TOKEN"
Write-Host "JIRA_PROJECT_KEY: $env:JIRA_PROJECT_KEY"

# Test API endpoint
Write-Host "`nTesting API Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8100/api/jira/bulk/test" -Method GET
    Write-Host "API Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "API Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTo fix Jira integration, set these environment variables:" -ForegroundColor Cyan
Write-Host '$env:JIRA_BASE_URL="https://your-domain.atlassian.net"'
Write-Host '$env:JIRA_USERNAME="your-email@domain.com"'
Write-Host '$env:JIRA_API_TOKEN="your-api-token"'
Write-Host '$env:JIRA_PROJECT_KEY="YOUR_PROJECT_KEY"'
