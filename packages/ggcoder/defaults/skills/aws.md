---
name: aws
description: AWS — S3, Lambda, CloudFront, IAM, CDK/SAM, DynamoDB, SQS, and CLI operations
---

You are now equipped with AWS CLI and infrastructure expertise.

## Prerequisites

Ensure AWS CLI v2 is installed. Check with `aws --version`. Configure credentials with `aws configure` (creates `~/.aws/credentials` and `~/.aws/config`).

## AWS CLI Basics

- Configure default profile: `aws configure`
- Configure named profile: `aws configure --profile staging`
- Use a profile: `aws s3 ls --profile staging`
- Set default region: `aws configure set region us-east-1`
- Set output format: `aws configure set output json`
- Override region per-command: `aws s3 ls --region eu-west-1`
- Override output format: `aws s3 ls --output table`
- Get caller identity (verify creds): `aws sts get-caller-identity`
- List configured profiles: `aws configure list-profiles`

Environment variables (override config file — useful in CI):
- `AWS_ACCESS_KEY_ID` — access key
- `AWS_SECRET_ACCESS_KEY` — secret key
- `AWS_DEFAULT_REGION` — default region
- `AWS_PROFILE` — named profile to use
- `AWS_SESSION_TOKEN` — for temporary credentials (STS)

Credential resolution order: env vars → `~/.aws/credentials` → instance profile (EC2/ECS).

## S3

### Bucket Operations

- Create bucket: `aws s3 mb s3://my-bucket-name`
- Create in specific region: `aws s3 mb s3://my-bucket-name --region eu-west-1`
- List buckets: `aws s3 ls`
- List objects in bucket: `aws s3 ls s3://my-bucket-name/`
- List recursively: `aws s3 ls s3://my-bucket-name/ --recursive`
- Delete empty bucket: `aws s3 rb s3://my-bucket-name`
- Delete bucket and all contents: `aws s3 rb s3://my-bucket-name --force`

### Upload / Download / Sync

- Upload file: `aws s3 cp ./file.txt s3://my-bucket/file.txt`
- Download file: `aws s3 cp s3://my-bucket/file.txt ./file.txt`
- Upload directory: `aws s3 cp ./dist s3://my-bucket/ --recursive`
- Sync local to S3: `aws s3 sync ./dist s3://my-bucket/`
- Sync with delete (mirror): `aws s3 sync ./dist s3://my-bucket/ --delete`
- Sync only certain files: `aws s3 sync ./dist s3://my-bucket/ --exclude "*" --include "*.html"`
- Set content type on upload: `aws s3 cp ./index.html s3://my-bucket/ --content-type "text/html"`
- Set cache headers: `aws s3 cp ./dist s3://my-bucket/ --recursive --cache-control "max-age=31536000"`
- Remove file: `aws s3 rm s3://my-bucket/file.txt`
- Remove all objects: `aws s3 rm s3://my-bucket/ --recursive`

### Presigned URLs

- Generate presigned URL (default 1hr): `aws s3 presign s3://my-bucket/file.txt`
- Custom expiry (seconds): `aws s3 presign s3://my-bucket/file.txt --expires-in 3600`

### Bucket Policy

```bash
aws s3api put-bucket-policy --bucket my-bucket --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicRead",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::my-bucket/*"
  }]
}'
```

- Get current policy: `aws s3api get-bucket-policy --bucket my-bucket`
- Delete policy: `aws s3api delete-bucket-policy --bucket my-bucket`

### CORS Configuration

```bash
aws s3api put-bucket-cors --bucket my-bucket --cors-configuration '{
  "CORSRules": [{
    "AllowedOrigins": ["https://example.com"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }]
}'
```

### Static Website Hosting

```bash
aws s3 website s3://my-bucket --index-document index.html --error-document error.html
```

- Disable public access block (required for public websites):
```bash
aws s3api put-public-access-block --bucket my-bucket --public-access-block-configuration \
  BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false
```

### Lifecycle Rules

```bash
aws s3api put-bucket-lifecycle-configuration --bucket my-bucket --lifecycle-configuration '{
  "Rules": [{
    "ID": "MoveToIA",
    "Status": "Enabled",
    "Filter": {"Prefix": "logs/"},
    "Transitions": [{"Days": 30, "StorageClass": "STANDARD_IA"}],
    "Expiration": {"Days": 365}
  }]
}'
```

## Lambda

### Create & Update Functions

- Create function from zip:
```bash
aws lambda create-function \
  --function-name my-function \
  --runtime nodejs20.x \
  --role arn:aws:iam::123456789012:role/lambda-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 256
```

- Update function code:
```bash
aws lambda update-function-code \
  --function-name my-function \
  --zip-file fileb://function.zip
```

- Update configuration:
```bash
aws lambda update-function-configuration \
  --function-name my-function \
  --timeout 60 \
  --memory-size 512 \
  --environment "Variables={DB_HOST=mydb.example.com,NODE_ENV=production}"
```

- List functions: `aws lambda list-functions`
- Delete function: `aws lambda delete-function --function-name my-function`
- Get function info: `aws lambda get-function --function-name my-function`

### Handler Patterns

Node.js (`index.mjs`):
```javascript
export const handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event));
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'OK' }),
  };
};
```

Python (`lambda_function.py`):
```python
import json

def handler(event, context):
    print(f"Event: {json.dumps(event)}")
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"message": "OK"}),
    }
```

### Invoke

- Invoke synchronously:
```bash
aws lambda invoke --function-name my-function --payload '{"key":"value"}' --cli-binary-format raw-in-base64-out response.json
```

- Invoke async (fire-and-forget):
```bash
aws lambda invoke --function-name my-function --invocation-type Event --payload '{}' --cli-binary-format raw-in-base64-out /dev/null
```

### Layers

- Publish layer:
```bash
aws lambda publish-layer-version \
  --layer-name my-layer \
  --zip-file fileb://layer.zip \
  --compatible-runtimes nodejs20.x nodejs18.x
```

- Attach layer to function:
```bash
aws lambda update-function-configuration \
  --function-name my-function \
  --layers arn:aws:lambda:us-east-1:123456789012:layer:my-layer:1
```

### Function URLs (public HTTP endpoint without API Gateway)

- Create URL: `aws lambda create-function-url-config --function-name my-function --auth-type NONE`
- Add permission for public access:
```bash
aws lambda add-permission \
  --function-name my-function \
  --statement-id FunctionURLPublic \
  --action lambda:InvokeFunctionUrl \
  --principal "*" \
  --function-url-auth-type NONE
```

### CloudWatch Logs

- View recent logs: `aws logs tail /aws/lambda/my-function --follow`
- Filter logs: `aws logs tail /aws/lambda/my-function --filter-pattern "ERROR"`
- Last 1 hour: `aws logs tail /aws/lambda/my-function --since 1h`
- Get log groups: `aws logs describe-log-groups --log-group-name-prefix /aws/lambda/`

## CloudFront

### Create Distribution (S3 origin)

```bash
aws cloudfront create-distribution --distribution-config '{
  "CallerReference": "unique-ref-123",
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "S3Origin",
      "DomainName": "my-bucket.s3.amazonaws.com",
      "S3OriginConfig": {"OriginAccessIdentity": ""}
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3Origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]},
    "ForwardedValues": {"QueryString": false, "Cookies": {"Forward": "none"}},
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Comment": "My static site"
}'
```

### Common Operations

- List distributions: `aws cloudfront list-distributions`
- Get distribution: `aws cloudfront get-distribution --id E1234567890`
- Get distribution config: `aws cloudfront get-distribution-config --id E1234567890`

### Cache Invalidation

- Invalidate single path: `aws cloudfront create-invalidation --distribution-id E1234567890 --paths "/index.html"`
- Invalidate everything: `aws cloudfront create-invalidation --distribution-id E1234567890 --paths "/*"`
- Invalidate multiple paths:
```bash
aws cloudfront create-invalidation --distribution-id E1234567890 --paths "/index.html" "/css/*" "/js/*"
```
- Check invalidation status: `aws cloudfront get-invalidation --distribution-id E1234567890 --id I1234567890`

### Custom Error Pages

Add to distribution config under `CustomErrorResponses`:
```json
{
  "Quantity": 1,
  "Items": [{
    "ErrorCode": 404,
    "ResponsePagePath": "/index.html",
    "ResponseCode": "200",
    "ErrorCachingMinTTL": 300
  }]
}
```

This is essential for single-page applications (SPA) — route all 404s to `index.html` with status 200.

### SSL with ACM

- Request certificate (must be us-east-1 for CloudFront):
```bash
aws acm request-certificate \
  --domain-name example.com \
  --subject-alternative-names "*.example.com" \
  --validation-method DNS \
  --region us-east-1
```
- List certificates: `aws acm list-certificates --region us-east-1`
- Describe certificate (get DNS validation records): `aws acm describe-certificate --certificate-arn arn:aws:acm:... --region us-east-1`

## IAM

### Users

- Create user: `aws iam create-user --user-name deploy-bot`
- Create access key: `aws iam create-access-key --user-name deploy-bot`
- List users: `aws iam list-users`
- Delete user: `aws iam delete-user --user-name deploy-bot`
- Attach policy to user: `aws iam attach-user-policy --user-name deploy-bot --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess`

### Roles

- Create role:
```bash
aws iam create-role --role-name lambda-exec-role --assume-role-policy-document '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "lambda.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}'
```

- Attach managed policy to role:
```bash
aws iam attach-role-policy \
  --role-name lambda-exec-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

- List roles: `aws iam list-roles`
- Get role: `aws iam get-role --role-name lambda-exec-role`

### Custom Policies

- Create inline policy:
```bash
aws iam put-role-policy --role-name lambda-exec-role --policy-name s3-read --policy-document '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:ListBucket"],
    "Resource": [
      "arn:aws:s3:::my-bucket",
      "arn:aws:s3:::my-bucket/*"
    ]
  }]
}'
```

- Create managed policy:
```bash
aws iam create-policy --policy-name MyCustomPolicy --policy-document file://policy.json
```

### Assume Role (for cross-account or temporary creds)

```bash
aws sts assume-role \
  --role-arn arn:aws:iam::123456789012:role/deploy-role \
  --role-session-name my-session
```

### Least-Privilege Patterns

Always scope IAM policies to specific resources and minimum actions:
- Bad: `"Action": "s3:*", "Resource": "*"`
- Good: `"Action": ["s3:GetObject"], "Resource": "arn:aws:s3:::my-bucket/*"`
- Use conditions to restrict further: `"Condition": {"StringEquals": {"aws:RequestedRegion": "us-east-1"}}`
- Use `aws iam generate-service-last-accessed-details` to audit unused permissions.

## DynamoDB

### Create Table

```bash
aws dynamodb create-table \
  --table-name Users \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes '[{
    "IndexName": "EmailIndex",
    "KeySchema": [{"AttributeName": "email", "KeyType": "HASH"}],
    "Projection": {"ProjectionType": "ALL"}
  }]'
```

- For provisioned throughput, replace `--billing-mode` with:
  `--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5`

### Key Schema

- Partition key only (HASH): unique item ID
- Partition + sort key (HASH + RANGE): enables range queries within a partition
```bash
--key-schema AttributeName=pk,KeyType=HASH AttributeName=sk,KeyType=RANGE
```

### CRUD Operations

- Put item:
```bash
aws dynamodb put-item --table-name Users --item '{
  "userId": {"S": "user-001"},
  "email": {"S": "user@example.com"},
  "name": {"S": "John Doe"},
  "createdAt": {"N": "1700000000"}
}'
```

- Get item:
```bash
aws dynamodb get-item --table-name Users --key '{"userId": {"S": "user-001"}}'
```

- Update item:
```bash
aws dynamodb update-item --table-name Users \
  --key '{"userId": {"S": "user-001"}}' \
  --update-expression "SET #n = :name" \
  --expression-attribute-names '{"#n": "name"}' \
  --expression-attribute-values '{":name": {"S": "Jane Doe"}}' \
  --return-values ALL_NEW
```

- Delete item:
```bash
aws dynamodb delete-item --table-name Users --key '{"userId": {"S": "user-001"}}'
```

### Query vs Scan

- Query (efficient — uses key): 
```bash
aws dynamodb query --table-name Orders \
  --key-condition-expression "userId = :uid AND createdAt > :since" \
  --expression-attribute-values '{":uid": {"S": "user-001"}, ":since": {"N": "1700000000"}}'
```

- Query GSI:
```bash
aws dynamodb query --table-name Users \
  --index-name EmailIndex \
  --key-condition-expression "email = :email" \
  --expression-attribute-values '{":email": {"S": "user@example.com"}}'
```

- Scan (reads entire table — expensive, avoid in production):
```bash
aws dynamodb scan --table-name Users --filter-expression "begins_with(email, :prefix)" \
  --expression-attribute-values '{":prefix": {"S": "admin"}}'
```

### Batch Operations

- Batch write (up to 25 items):
```bash
aws dynamodb batch-write-item --request-items file://batch-items.json
```

- Batch get:
```bash
aws dynamodb batch-get-item --request-items '{
  "Users": {"Keys": [{"userId": {"S": "user-001"}}, {"userId": {"S": "user-002"}}]}
}'
```

### TTL (Auto-Expire Items)

- Enable TTL: `aws dynamodb update-time-to-live --table-name Sessions --time-to-live-specification Enabled=true,AttributeName=expiresAt`
- TTL attribute must contain Unix epoch timestamp in seconds.

### Other Operations

- List tables: `aws dynamodb list-tables`
- Describe table: `aws dynamodb describe-table --table-name Users`
- Delete table: `aws dynamodb delete-table --table-name Users`

## SQS & SNS

### SQS — Queues

- Create queue: `aws sqs create-queue --queue-name my-queue`
- Create FIFO queue: `aws sqs create-queue --queue-name my-queue.fifo --attributes FifoQueue=true,ContentBasedDeduplication=true`
- List queues: `aws sqs list-queues`
- Get queue URL: `aws sqs get-queue-url --queue-name my-queue`
- Delete queue: `aws sqs delete-queue --queue-url <queue-url>`

- Send message:
```bash
aws sqs send-message --queue-url <queue-url> --message-body '{"task": "process-image", "id": "123"}'
```

- Send with delay: `aws sqs send-message --queue-url <queue-url> --message-body '{}' --delay-seconds 60`

- Receive messages:
```bash
aws sqs receive-message --queue-url <queue-url> --max-number-of-messages 10 --wait-time-seconds 20
```

- Delete message (after processing):
```bash
aws sqs delete-message --queue-url <queue-url> --receipt-handle <handle>
```

- Purge queue (delete all messages): `aws sqs purge-queue --queue-url <queue-url>`

### Dead-Letter Queue (DLQ)

Create the DLQ first, then set redrive policy on the main queue:
```bash
aws sqs create-queue --queue-name my-queue-dlq
aws sqs set-queue-attributes --queue-url <main-queue-url> --attributes '{
  "RedrivePolicy": "{\"deadLetterTargetArn\":\"arn:aws:sqs:us-east-1:123456789012:my-queue-dlq\",\"maxReceiveCount\":\"3\"}"
}'
```

### SNS — Topics & Subscriptions

- Create topic: `aws sns create-topic --name my-topic`
- List topics: `aws sns list-topics`
- Subscribe email: `aws sns subscribe --topic-arn <topic-arn> --protocol email --notification-endpoint user@example.com`
- Subscribe SQS: `aws sns subscribe --topic-arn <topic-arn> --protocol sqs --notification-endpoint <queue-arn>`
- Subscribe Lambda: `aws sns subscribe --topic-arn <topic-arn> --protocol lambda --notification-endpoint <function-arn>`
- Publish message: `aws sns publish --topic-arn <topic-arn> --message '{"default": "Hello"}' --message-structure json`
- List subscriptions: `aws sns list-subscriptions-by-topic --topic-arn <topic-arn>`
- Unsubscribe: `aws sns unsubscribe --subscription-arn <subscription-arn>`

### Fan-Out Pattern (SNS → multiple SQS)

1. Create SNS topic
2. Create multiple SQS queues
3. Subscribe each queue to the topic
4. Set SQS queue policies to allow SNS to send messages:
```bash
aws sqs set-queue-attributes --queue-url <queue-url> --attributes '{
  "Policy": "{\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"sns.amazonaws.com\"},\"Action\":\"sqs:SendMessage\",\"Resource\":\"<queue-arn>\",\"Condition\":{\"ArnEquals\":{\"aws:SourceArn\":\"<topic-arn>\"}}}]}"
}'
```

## CDK (Cloud Development Kit)

### Setup

- Install: `npm i -g aws-cdk`
- Check version: `cdk --version`
- Bootstrap account (one-time per account/region): `cdk bootstrap aws://123456789012/us-east-1`

### Init & Deploy

- New TypeScript project: `cdk init app --language typescript`
- New Python project: `cdk init app --language python`
- Synthesize CloudFormation: `cdk synth`
- Deploy all stacks: `cdk deploy`
- Deploy specific stack: `cdk deploy MyStack`
- Deploy without confirmation: `cdk deploy --require-approval never`
- Diff (preview changes): `cdk diff`
- Destroy stack: `cdk destroy MyStack`
- List stacks: `cdk list`

### Common L2 Constructs (TypeScript)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class MyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket
    const bucket = new s3.Bucket(this, 'MyBucket', {
      bucketName: 'my-app-assets',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // DynamoDB Table
    const table = new dynamodb.Table(this, 'MyTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda Function
    const fn = new lambda.Function(this, 'MyFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        TABLE_NAME: table.tableName,
        BUCKET_NAME: bucket.bucketName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // Grant permissions (CDK handles IAM policies automatically)
    table.grantReadWriteData(fn);
    bucket.grantRead(fn);

    // API Gateway
    const api = new apigateway.RestApi(this, 'MyApi', {
      restApiName: 'My Service',
    });
    api.root.addMethod('GET', new apigateway.LambdaIntegration(fn));
    api.root.addResource('items').addMethod('POST', new apigateway.LambdaIntegration(fn));
  }
}
```

## SAM (Serverless Application Model)

### Setup & Commands

- Install: follow AWS SAM CLI install docs for your OS
- Check version: `sam --version`
- Init new project: `sam init` (interactive) or `sam init --runtime nodejs20.x --app-template hello-world --name my-app`
- Build: `sam build`
- Deploy (guided first time): `sam deploy --guided`
- Deploy subsequent: `sam deploy`
- Local invoke: `sam local invoke MyFunction --event events/event.json`
- Local API: `sam local start-api` (starts on port 3000)
- Local invoke with env vars: `sam local invoke MyFunction --env-vars env.json`
- Validate template: `sam validate`
- View logs: `sam logs --name MyFunction --stack-name my-stack --tail`
- Delete stack: `sam delete --stack-name my-stack`

### template.yaml Patterns

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: My serverless app

Globals:
  Function:
    Timeout: 30
    Runtime: nodejs20.x
    MemorySize: 256
    Environment:
      Variables:
        NODE_ENV: production

Resources:
  # API Function
  ApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/
      Handler: api.handler
      Events:
        GetItems:
          Type: Api
          Properties:
            Path: /items
            Method: get
        CreateItem:
          Type: Api
          Properties:
            Path: /items
            Method: post
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref ItemsTable

  # Worker triggered by SQS
  WorkerFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/
      Handler: worker.handler
      Events:
        SQSEvent:
          Type: SQS
          Properties:
            Queue: !GetAtt TaskQueue.Arn
            BatchSize: 10

  # DynamoDB Table
  ItemsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: items
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH

  # SQS Queue
  TaskQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: task-queue
      VisibilityTimeout: 180
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt TaskDLQ.Arn
        maxReceiveCount: 3

  TaskDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: task-queue-dlq

Outputs:
  ApiUrl:
    Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/"
```

## Common Patterns

### API Gateway + Lambda (REST API)

1. Create Lambda function with handler returning `{ statusCode, headers, body }`
2. Create API Gateway REST API
3. Attach Lambda integration to routes
4. Deploy API to a stage
5. Or use SAM `Type: Api` events for automatic wiring

### S3 + CloudFront Static Site

```bash
# 1. Create bucket
aws s3 mb s3://my-site-bucket

# 2. Upload built assets
aws s3 sync ./dist s3://my-site-bucket --delete

# 3. Create CloudFront distribution pointed at bucket
#    (use OAC — Origin Access Control — instead of public bucket)
# 4. Set default root object to index.html
# 5. Add custom error response: 404 → /index.html (200) for SPA routing
# 6. Request ACM certificate in us-east-1 for custom domain
# 7. Invalidate cache after deploy
aws cloudfront create-invalidation --distribution-id E1234567890 --paths "/*"
```

### SQS + Lambda Event Source Mapping

```bash
# Create the mapping (Lambda polls SQS automatically)
aws lambda create-event-source-mapping \
  --function-name my-worker \
  --event-source-arn arn:aws:sqs:us-east-1:123456789012:my-queue \
  --batch-size 10 \
  --maximum-batching-window-in-seconds 5
```

- Lambda needs `sqs:ReceiveMessage`, `sqs:DeleteMessage`, `sqs:GetQueueAttributes` permissions.
- Failed messages return to queue. After `maxReceiveCount`, they go to the DLQ.

### Environment-Based Deployments

Use naming conventions and parameter overrides:

```bash
# SAM with parameter overrides
sam deploy --stack-name my-app-staging --parameter-overrides Environment=staging
sam deploy --stack-name my-app-prod --parameter-overrides Environment=production

# CDK with context
cdk deploy -c environment=staging
cdk deploy -c environment=production
```

In SAM `template.yaml`, use parameters:
```yaml
Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues: [dev, staging, production]

Resources:
  MyTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub "${Environment}-items"
```

## Key Gotchas

- S3 bucket names are globally unique. Use prefixes like `company-project-env-`.
- CloudFront ACM certificates MUST be in `us-east-1` regardless of where your resources are.
- CloudFront invalidations are free for the first 1,000 paths/month. Use `/*` sparingly — it counts as 1 path.
- Lambda cold starts: keep functions small, use provisioned concurrency for latency-sensitive workloads.
- Lambda max execution: 15 minutes. For longer tasks, use Step Functions or ECS/Fargate.
- Lambda zip size limit: 50MB direct upload, 250MB unzipped. Use layers or container images for larger packages.
- DynamoDB: always prefer Query over Scan. Design keys around access patterns (single-table design).
- SQS visibility timeout should be >= Lambda function timeout to prevent duplicate processing.
- IAM: use `aws iam simulate-principal-policy` to test policies before deploying.
- CDK `cdk bootstrap` is required once per account/region before first deploy.
- SAM builds in `.aws-sam/build/` — add this to `.gitignore`.
- Always use `--cli-binary-format raw-in-base64-out` when passing JSON payloads to Lambda invoke.
- For CI/CD, use IAM roles (not access keys) whenever possible — use OIDC with GitHub Actions.
