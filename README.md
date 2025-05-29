# QuickTerra 🚀

> A Terraform-like Infrastructure as Code (IaC) tool for Quickbase applications

QuickTerra allows you to define, version, and manage your Quickbase applications using declarative configuration files. Just like Terraform manages cloud infrastructure, QuickTerra manages your Quickbase apps, tables, fields, and relationships.

## ✨ Features

- **Declarative Configuration**: Define your Quickbase structure using HCL-like syntax
- **State Management**: Track and manage resource changes with state files
- **Plan & Apply Workflow**: Preview changes before applying them
- **Import Existing Resources**: Bring existing Quickbase apps under management
- **Configuration Generation**: Generate configurations from existing resources
- **Relationship Management**: Handle complex table relationships
- **Webhook Integration**: Automate notifications and integrations
- **Validation**: Validate configurations before deployment
- **Multi-Environment Support**: Manage dev, staging, and production environments

## 🚀 Quick Start

### Prerequisites

- Node.js 14 or higher
- Quickbase account with API access
- User token from Quickbase

### Installation

```bash
# Clone or download the QuickTerra script
wget https://raw.githubusercontent.com/your-repo/quickterra/main/quickterra.js
chmod +x quickterra.js

# Or run directly with Node
node quickterra.js --help
```

### Environment Setup

```bash
export QB_REALM="your-company-realm"
export QB_USER_TOKEN="QB-USER-TOKEN_your_token_here"
export QB_APP_TOKEN="optional_app_token"  # Optional
```

### Your First Configuration

Create a file called `my-app.qb`:

```hcl
variable "realm" {
  description = "Quickbase realm"
  type        = string
  default     = "mycompany"
}

variable "user_token" {
  description = "Quickbase user token"
  type        = string
  sensitive   = true
}

resource "quickbase_application" "my_first_app" {
  name        = "My First App"
  description = "Created with QuickTerra"
}

resource "quickbase_table" "customers" {
  app_id      = quickbase_application.my_first_app.id
  name        = "Customers"
  description = "Customer information"
}

resource "quickbase_field" "company_name" {
  table_id   = quickbase_table.customers.id
  label      = "Company Name"
  type       = "text"
  required   = true
  unique     = true
}

output "app_url" {
  value = "https://${var.realm}.quickbase.com/db/${quickbase_application.my_first_app.id}"
}
```

### Deploy Your Configuration

```bash
# Validate the configuration
node quickterra.js validate my-app.qb

# Preview what will be created
node quickterra.js plan my-app.qb

# Create the resources
node quickterra.js apply my-app.qb
```

## 📖 Documentation

### Commands

| Command | Description | Example |
|---------|-------------|---------|
| `plan` | Show what changes will be made | `node quickterra.js plan config.qb` |
| `apply` | Apply changes to Quickbase | `node quickterra.js apply config.qb` |
| `destroy` | Remove all managed resources | `node quickterra.js destroy config.qb` |
| `validate` | Validate configuration syntax | `node quickterra.js validate config.qb` |
| `import` | Import existing resources | `node quickterra.js import quickbase_application my_app APP_ID` |
| `generate` | Generate config from existing resources | `node quickterra.js generate` |

### Resource Types

#### quickbase_application

Manages Quickbase applications.

```hcl
resource "quickbase_application" "example" {
  name        = "Application Name"
  description = "Application description"
}
```

**Attributes:**
- `name` (required) - Application name
- `description` (optional) - Application description

**Exported Attributes:**
- `id` - Application ID
- `token` - Application token (if generated)
- `created` - Creation timestamp
- `updated` - Last update timestamp

#### quickbase_table

Manages tables within applications.

```hcl
resource "quickbase_table" "example" {
  app_id      = quickbase_application.my_app.id
  name        = "Table Name"
  description = "Table description"
}
```

**Attributes:**
- `app_id` (required) - ID of the parent application
- `name` (required) - Table name
- `description` (optional) - Table description

**Exported Attributes:**
- `id` - Table ID
- `created` - Creation timestamp
- `updated` - Last update timestamp

#### quickbase_field

Manages fields within tables.

```hcl
resource "quickbase_field" "example" {
  table_id    = quickbase_table.my_table.id
  label       = "Field Label"
  type        = "text"
  required    = true
  unique      = false
  field_help  = "Help text for users"
  properties  = {
    choices = ["Option 1", "Option 2"]  # For multiple choice fields
  }
}
```

**Attributes:**
- `table_id` (required) - ID of the parent table
- `label` (required) - Field label shown to users
- `type` (required) - Field type (see Field Types below)
- `required` (optional) - Whether field is required (default: false)
- `unique` (optional) - Whether field values must be unique (default: false)
- `field_help` (optional) - Help text shown to users
- `properties` (optional) - Additional field-specific properties

**Field Types:**
- `text` - Single line text
- `text-multiple-choice` - Dropdown with predefined options
- `text-multi-line` - Multi-line text area
- `rich-text` - Rich text with formatting
- `numeric` - Numbers
- `currency` - Currency values
- `rating` - Star rating (1-5)
- `percent` - Percentage values
- `duration` - Time duration
- `date` - Date picker
- `datetime` - Date and time picker
- `timestamp` - Automatic timestamp
- `checkbox` - True/false checkbox
- `user` - User selection
- `multiuser` - Multiple user selection
- `file` - File attachment
- `url` - Website URL
- `email` - Email address
- `phone` - Phone number
- `recordid` - Unique record identifier
- `dblink` - Link to another table

#### quickbase_relationship

Manages relationships between tables.

```hcl
resource "quickbase_relationship" "example" {
  parent_table_id  = quickbase_table.parent.id
  child_table_id   = quickbase_table.child.id
  lookup_field_ids = [
    quickbase_field.parent_name.id,
    quickbase_field.parent_status.id
  ]
}
```

**Attributes:**
- `parent_table_id` (required) - ID of the parent table
- `child_table_id` (required) - ID of the child table
- `lookup_field_ids` (optional) - List of field IDs to lookup from parent

#### quickbase_webhook

Manages webhooks for notifications and integrations.

```hcl
resource "quickbase_webhook" "example" {
  app_id       = quickbase_application.my_app.id
  table_id     = quickbase_table.my_table.id
  endpoint_url = "https://api.example.com/webhook"
  event        = "RecordSaved"
}
```

**Attributes:**
- `app_id` (required) - ID of the application
- `table_id` (required) - ID of the table to monitor
- `endpoint_url` (required) - URL to send webhook notifications
- `event` (required) - Event type (RecordSaved, RecordDeleted, etc.)

### Variables and Data Types

QuickTerra supports variables for configuration reuse:

```hcl
variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "app_settings" {
  description = "Application configuration"
  type = object({
    name        = string
    description = string
    owner_email = string
  })
}
```

**Supported Types:**
- `string` - Text values
- `number` - Numeric values
- `bool` - True/false values
- `list(type)` - List of values
- `object({...})` - Complex objects

### Local Values

Use locals for computed values and complex expressions:

```hcl
locals {
  app_prefix = "${var.environment}-"
  
  common_field_settings = {
    find_enabled = true
    audited      = var.environment == "prod"
  }
  
  notification_urls = {
    slack = "https://hooks.slack.com/services/${var.slack_webhook_path}"
    teams = var.teams_webhook_url
  }
}
```

### Data Sources

Reference existing Quickbase resources:

```hcl
data "quickbase_app" "existing" {
  name = "Existing Application"
}

data "quickbase_table" "legacy_table" {
  app_id = data.quickbase_app.existing.id
  name   = "Legacy Table"
}

resource "quickbase_field" "new_field" {
  table_id = data.quickbase_table.legacy_table.id
  label    = "New Field"
  type     = "text"
}
```

### Outputs

Export values from your configuration:

```hcl
output "application_url" {
  description = "URL to access the application"
  value       = "https://${var.realm}.quickbase.com/db/${quickbase_application.my_app.id}"
}

output "table_ids" {
  description = "Map of table names to IDs"
  value = {
    customers = quickbase_table.customers.id
    orders    = quickbase_table.orders.id
  }
  sensitive = false
}
```

## 🔄 Workflow

### 1. Plan Phase
```bash
node quickterra.js plan config.qb
```

Shows you exactly what will be:
- ➕ **Created** (new resources)
- 🔄 **Modified** (changed resources)
- ❌ **Destroyed** (removed resources)

### 2. Apply Phase
```bash
node quickterra.js apply config.qb
```

Executes the planned changes and updates the state file.

### 3. State Management

QuickTerra maintains a `terraform.tfstate` file that tracks:
- Resource IDs and current configurations
- Relationships between resources
- Metadata like creation times

**Important:** Always commit your state file to version control or use remote state storage.

## 📥 Importing Existing Resources

Bring existing Quickbase resources under QuickTerra management:

```bash
# Import an application
node quickterra.js import quickbase_application my_app bdk5x7ram7

# Import a table  
node quickterra.js import quickbase_table customers bdk5x7ram8

# Import a field (requires table ID)
node quickterra.js import quickbase_field company_name 123 bdk5x7ram8
```

After importing, add the corresponding resource blocks to your configuration:

```hcl
resource "quickbase_application" "my_app" {
  name        = "Imported Application"
  description = "Previously existing app"
}
```

## 🔧 Configuration Generation

Generate QuickTerra configurations from existing Quickbase resources:

```bash
node quickterra.js generate
```

This will:
- Scan all applications in your realm
- Generate resource blocks for apps, tables, and fields
- Create a complete `.qb` configuration file
- Include proper relationships and references

## 🌍 Multi-Environment Management

Manage multiple environments with the same configuration:

### Directory Structure
```
├── environments/
│   ├── dev.tfvars
│   ├── staging.tfvars
│   └── prod.tfvars
├── modules/
│   └── crm-app/
│       └── main.qb
└── main.qb
```

### Environment-Specific Variables

**dev.tfvars:**
```hcl
environment = "dev"
app_prefix = "dev-"
enable_webhooks = false
```

**prod.tfvars:**
```hcl
environment = "prod"
app_prefix = ""
enable_webhooks = true
```

### Conditional Resources

```hcl
resource "quickbase_webhook" "production_alerts" {
  count = var.environment == "prod" ? 1 : 0
  
  app_id       = quickbase_application.my_app.id
  table_id     = quickbase_table.orders.id
  endpoint_url = var.production_webhook_url
  event        = "RecordSaved"
}
```

## 🔒 Security Best Practices

### 1. Environment Variables
Never hardcode tokens in configuration files:

```bash
export QB_USER_TOKEN="QB-USER-TOKEN_your_token_here"
export QB_APP_TOKEN="your_app_token_here"
```

### 2. Sensitive Variables
Mark sensitive variables appropriately:

```hcl
variable "user_token" {
  description = "Quickbase user token"
  type        = string
  sensitive   = true
}
```

### 3. Version Control
- ✅ **Include:** Configuration files (`.qb`)
- ✅ **Include:** State files (`terraform.tfstate`)
- ❌ **Exclude:** Environment files with secrets (`.env`)
- ❌ **Exclude:** Variable files with tokens (`*.tfvars` with secrets)

### 4. Access Control
- Use principle of least privilege for API tokens
- Rotate tokens regularly
- Audit token usage and access logs

## 🚨 Error Handling and Troubleshooting

### Common Issues

#### 1. Authentication Errors
```
❌ API Error 401: Unauthorized
```

**Solution:** Check your user token and realm settings:
```bash
echo $QB_REALM
echo $QB_USER_TOKEN
```

#### 2. Resource Not Found
```
❌ API Error 404: Table not found
```

**Solution:** Verify resource IDs and references in your configuration.

#### 3. Validation Errors
```
❌ quickbase_field.my_field: invalid field type "invalid_type"
```

**Solution:** Check the field type against supported types listed in documentation.

#### 4. Dependency Issues
```
❌ Resource depends on non-existent resource
```

**Solution:** Ensure proper resource references and dependency order.

### Debugging

Enable debug mode for detailed logging:

```bash
DEBUG=1 node quickterra.js plan config.qb
```

This will show:
- Complete API requests and responses
- State file operations
- Resource dependency resolution
- Detailed error stack traces

### State File Recovery

If your state file becomes corrupted:

1. **Backup existing state:**
   ```bash
   cp terraform.tfstate terraform.tfstate.backup
   ```

2. **Reset state:**
   ```bash
   rm terraform.tfstate
   ```

3. **Import resources manually:**
   ```bash
   node quickterra.js import quickbase_application my_app APP_ID
   node quickterra.js import quickbase_table my_table TABLE_ID
   ```

## 📊 Advanced Features

### Custom Field Properties

Different field types support various properties:

```hcl
# Multiple choice field
resource "quickbase_field" "status" {
  table_id   = quickbase_table.tasks.id
  label      = "Status"
  type       = "text-multiple-choice"
  properties = {
    choices = ["New", "In Progress", "Done"]
    allow_new_choices = false
  }
}

# Numeric field with validation
resource "quickbase_field" "budget" {
  table_id   = quickbase_table.projects.id
  label      = "Budget"
  type       = "currency"
  properties = {
    min_value = 0
    max_value = 1000000
    decimal_places = 2
  }
}

# Rating field
resource "quickbase_field" "satisfaction" {
  table_id   = quickbase_table.feedback.id
  label      = "Satisfaction Rating"
  type       = "rating"
  properties = {
    max_value = 5
    allow_half_ratings = true
  }
}
```

### Complex Relationships

Set up lookup fields to pull data from parent tables:

```hcl
resource "quickbase_relationship" "project_tasks" {
  parent_table_id = quickbase_table.projects.id
  child_table_id  = quickbase_table.tasks.id
  
  lookup_field_ids = [
    quickbase_field.project_name.id,
    quickbase_field.project_manager.id,
    quickbase_field.project_budget.id,
    quickbase_field.project_deadline.id
  ]
}
```

### Webhook Filtering

Configure webhooks with specific conditions:

```hcl
resource "quickbase_webhook" "high_priority_alerts" {
  app_id       = quickbase_application.helpdesk.id
  table_id     = quickbase_table.tickets.id
  endpoint_url = "https://api.company.com/urgent-alerts"
  event        = "RecordSaved"
  
  # Webhook will only trigger for high priority tickets
  filter = {
    field_id = quickbase_field.ticket_priority.id
    operator = "EX"  # Equals
    value    = "High"
  }
}
```

## 🧪 Testing Strategies

### 1. Validation Testing
```bash
# Test configuration syntax
node quickterra.js validate test-config.qb

# Test with different variable values
QB_ENVIRONMENT=staging node quickterra.js validate config.qb
```

### 2. Plan Testing
```bash
# Dry run to see what would change
node quickterra.js plan config.qb

# Test with different environments
QB_ENVIRONMENT=dev node quickterra.js plan config.qb
```

### 3. Sandbox Testing
- Use a dedicated Quickbase realm for testing
- Test imports and exports with non-critical data
- Validate state file operations

### 4. Configuration Testing
Create test configurations for common scenarios:

```hcl
# test-simple-app.qb
resource "quickbase_application" "test_app" {
  name = "Test Application - ${formatdate("YYYY-MM-DD", timestamp())}"
  description = "Temporary test application"
}

# Clean up after testing
# node quickterra.js destroy test-simple-app.qb
```

## 📈 Performance Optimization

### 1. Batch Operations
QuickTerra automatically batches API calls where possible, but you can optimize by:

- Grouping related resources together
- Using data sources to reduce API calls
- Minimizing cross-references between apps

### 2. State File Management
- Keep state files small by splitting large configurations
- Use remote state storage for team collaboration
- Regular state file cleanup and optimization

### 3. API Rate Limiting
QuickTerra respects Quickbase API limits:
- Maximum 1000 requests per 5 minutes per IP
- Automatic retry with exponential backoff
- Progress indicators for long-running operations

## 🤝 Integration Examples

### 1. CI/CD Pipeline

**GitHub Actions Example:**
```yaml
name: Deploy Quickbase Infrastructure

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          
      - name: Validate Configuration
        run: node quickterra.js validate production.qb
        env:
          QB_REALM: ${{ secrets.QB_REALM }}
          QB_USER_TOKEN: ${{ secrets.QB_USER_TOKEN }}
          
      - name: Plan Changes
        run: node quickterra.js plan production.qb
        env:
          QB_REALM: ${{ secrets.QB_REALM }}
          QB_USER_TOKEN: ${{ secrets.QB_USER_TOKEN }}
          
      - name: Apply Changes
        if: github.ref == 'refs/heads/main'
        run: node quickterra.js apply production.qb
        env:
          QB_REALM: ${{ secrets.QB_REALM }}
          QB_USER_TOKEN: ${{ secrets.QB_USER_TOKEN }}
```

### 2. Backup Script

```bash
#!/bin/bash
# backup-quickbase.sh

# Generate current configuration from Quickbase
node quickterra.js generate > backup-$(date +%Y%m%d).qb

# Backup state file
cp terraform.tfstate state-backup-$(date +%Y%m%d).json

# Commit to git
git add backup-$(date +%Y%m%d).qb state-backup-$(date +%Y%m%d).json
git commit -m "Automated backup $(date)"
git push origin backup-branch
```

### 3. Migration Script

```bash
#!/bin/bash
# migrate-environment.sh

SOURCE_ENV=$1
TARGET_ENV=$2

if [ -z "$SOURCE_ENV" ] || [ -z "$TARGET_ENV" ]; then
    echo "Usage: $0 <source-env> <target-env>"
    echo "Example: $0 dev staging"
    exit 1
fi

# Generate config from source environment
QB_ENVIRONMENT=$SOURCE_ENV node quickterra.js generate > ${TARGET_ENV}-config.qb

# Replace environment-specific values
sed -i "s/environment = \"$SOURCE_ENV\"/environment = \"$TARGET_ENV\"/g" ${TARGET_ENV}-config.qb
sed -i "s/${SOURCE_ENV}-/${TARGET_ENV}-/g" ${TARGET_ENV}-config.qb

# Validate new configuration
QB_ENVIRONMENT=$TARGET_ENV node quickterra.js validate ${TARGET_ENV}-config.qb

echo "Migration configuration created: ${TARGET_ENV}-config.qb"
echo "Review the file and run: node quickterra.js plan ${TARGET_ENV}-config.qb"
```

## 🆘 Support and Community

### Getting Help

1. **Documentation:** Read through this README thoroughly
2. **Examples:** Check the example configurations provided
3. **Validation:** Use `validate` command to check syntax
4. **Debug Mode:** Enable debug logging for detailed output
5. **Community:** Join discussions and share experiences

### Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit a pull request

### Known Limitations

- **Field Type Changes:** Some field type changes require recreation
- **Table Dependencies:** Complex dependency graphs may need manual ordering
- **Bulk Operations:** Large datasets may hit API rate limits
- **Custom Apps:** Some advanced Quickbase features not yet supported

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔄 Changelog

### Version 1.0.0
- Initial release with core functionality
- Support for apps, tables, fields, relationships
- Import/export capabilities
- State management
- Webhook integration

### Planned Features
- [ ] Remote state storage
- [ ] Module system for reusable configurations
- [ ] Enhanced field validation
- [ ] Report management
- [ ] User and permission management
- [ ] Pipeline integration
- [ ] Advanced querying and filtering

---

**Happy Infrastructure as Code with QuickTerra!** 🎉

For questions, issues, or contributions, please visit our [GitHub repository](https://github.com/your-username/quickterra).