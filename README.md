# heimdall

[![Build Status](https://travis-ci.com/fterh/heimdall.svg?branch=master)](https://travis-ci.com/fterh/heimdall)
[![Maintainability](https://api.codeclimate.com/v1/badges/8400b327ea3d328c9f5e/maintainability)](https://codeclimate.com/github/fterh/heimdall/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/8400b327ea3d328c9f5e/test_coverage)](https://codeclimate.com/github/fterh/heimdall/test_coverage)

Heimdall is a self-hosted email alias/forwarding service.
I built this as a privacy tool to fight spam and also better manage access to my personal email address.
As a self-hosted/managed solution, you have complete control over your data.
With 3rd party email forwarding services, you are forced to trust a company with your emails.

This has also been a really fun project for me to learn more about AWS and the Serverless framework.

Check out: [How I built Heimdall, an open-source personal email guardian.](https://medium.com/@fabianterh/how-i-built-heimdall-an-open-source-personal-email-guardian-68e306d172d1)

## Why use Heimdall
1. With Heimdall, you completely own and manage your data and the service. No feature limitations or having to trust a third-party company with your data. 
2. Heimdall is meant for individual users to deploy and use and contains user-friendly setup instructions.
3. Heimdall is easy to run - it utilizes the idea of serverless computing, so there is zero server configuration or provisioning.
3. Heimdall is easy to deploy - it uses the Serverless framework (not to be confused with small-letter serverless in Point 2 above) so you can deploy with a single command.

## Setup

**Pre-requisites:** You need to own a domain and have an AWS account. For reasonable use cases, you should not exceed AWS's free tier (which is very generous).

**Optional:** To be able to reply to emails, you need to request AWS Support to [un-sandbox your SES account](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/request-production-access.html).

1. Add and verify your domain in AWS Simple Email Service (SES).
2. In AWS's SES console, generate a set of SMTP credentials.
   Take note of that, and also your connection information on SES's "SMTP Settings" page.
3. Populate required environment variables in `.env.sample`, and rename to `.env`.
   It is important that `EMAIL` matches your personal email exactly.
4. `yarn global add serverless`
5. Set up Serverless, then `serverless deploy`.
6. Add a receipt rule in SES to trigger your S3 bucket (created in step 3).

## Features

### Receiving

Emails received on valid aliases will automatially be forwarded to your personal email address.
Forwarded emails will preserve metadata information, such as any other recipients in the "to" or "CC" headers.
The email subject will be prepended with the alias description in brackets `[Some description]`.

### Replying

By default, your replies will be sent to the alias to be forwarded to the original sender.
Other recipients in the original email will not receive your reply.

You can include other recipients in the "to" and "cc" list,
either by manually inserting them, or using "reply-all".

If you do that, you will disclose your email address to them.
The original sender will still not be able to see your email address,
or these other recipients (provided you reply to the alias).

## Commands

To interact with the service, send a single email to one of the following email addresses.

### Generate an alias

Email `generate@yourverifieddomain.com` with the description as the subject. You will receive the generated alias as a reply.

The description lets you identify an alias and its use. E.g. "Sign up for Service X".

![Screenshot 1](https://cdn-images-1.medium.com/max/800/1*uRgQFrT9orTw9Bx6pT0jIg.png)

![Screenshot 2](https://cdn-images-1.medium.com/max/800/1*nMh7U31-JAIBLdTYLXf7uA.png)

### List aliases

Email `list@yourverifieddomain.com`. You will receive a list of all aliases as a reply.

Dev note: This reads up to a maximum of 1MB of data (due to AWS's limitations).

### Remove an alias

Email `remove@yourverifieddomain.com` with the alias as the title (case-sensitive). You will receive the operation outcome (success/failure) as a reply.

### Update an alias

Not supported yet.

## Known Limitations

Currently, attachments are not supported.
